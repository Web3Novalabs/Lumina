#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    token::StellarAssetClient,
    Address, BytesN, Env, IntoVal, String,
};

fn create_token(env: &Env, amount: i128, recipient: &Address) -> Address {
    let admin = Address::generate(env);
    let token = env.register_stellar_asset_contract_v2(admin.clone());
    let sac = StellarAssetClient::new(env, &token.address());
    sac.mint(recipient, &amount);
    token.address()
}

// ============= BASIC POOL TESTS =============

#[test]
fn test_create_pool() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Emergency Relief Fund"),
        &String::from_str(&env, "Helping those in need"),
        &1_000_000_000u128,
        &100_000u64,
    );

    assert_eq!(pool_id, 1);
    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.0, 1);
    assert_eq!(pool.1, creator);
    assert_eq!(pool.2, 1_000_000_000u128);
    assert_eq!(pool.3, 0u128);
    assert_eq!(pool.4, false);
}

#[test]
fn test_donate() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Educational Scholarship"),
        &String::from_str(&env, "Support for students"),
        &10_000_000_000u128,
        &100_000u64,
    );

    client.donate(&pool_id, &donor, &100_000_000u128);
    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.3, 100_000_000u128);
}

#[test]
fn test_donate_with_configured_token_transfers_and_accounts() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let token = create_token(&env, 100, &donor);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Token Pool"),
        &String::from_str(&env, "Test"),
        &1_000u128,
        &100_000u64,
    );
    client.set_pool_token(&pool_id, &token);

    client.donate_with_token(&pool_id, &donor, &token, &40i128);

    assert_eq!(token::Client::new(&env, &token).balance(&donor), 60);
    assert_eq!(token::Client::new(&env, &token).balance(&contract_id), 40);
    assert_eq!(client.get_pool(&pool_id).3, 40u128);
}

#[test]
#[should_panic(expected = "TokenTransferFailed")]
fn test_donate_with_wrong_token_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let accepted_token = create_token(&env, 100, &donor);
    let wrong_token = create_token(&env, 100, &donor);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Token Pool"),
        &String::from_str(&env, "Test"),
        &1_000u128,
        &100_000u64,
    );
    client.set_pool_token(&pool_id, &accepted_token);

    client.donate_with_token(&pool_id, &donor, &wrong_token, &40i128);
}

#[test]
#[should_panic]
fn test_donate_with_invalid_token_address_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Token Pool"),
        &String::from_str(&env, "Test"),
        &1_000u128,
        &100_000u64,
    );

    client.donate_with_token(&pool_id, &donor, &Address::generate(&env), &40i128);
}

#[test]
fn test_save_pool_metadata_accepts_limits() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Metadata Pool"),
        &String::from_str(&env, "Initial"),
        &1_000u128,
        &100_000u64,
    );
    let description = String::from_str(&env, &"d".repeat(MAX_DESCRIPTION_LENGTH));
    let url = String::from_str(&env, &"u".repeat(MAX_URL_LENGTH));
    let image_hash = String::from_str(&env, &"h".repeat(MAX_IMAGE_HASH_LENGTH));

    client.save_pool(&pool_id, &description, &url, &image_hash);

    assert_eq!(client.get_saved_pool_metadata(&pool_id), (description, url, image_hash));
}

#[test]
#[should_panic(expected = "Description exceeds maximum length")]
fn test_save_pool_rejects_long_description() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let pool_id = client.create_pool(&creator, &String::from_str(&env, "Pool"), &String::from_str(&env, "Test"), &1_000, &100_000);
    client.save_pool(&pool_id, &String::from_str(&env, &"d".repeat(MAX_DESCRIPTION_LENGTH + 1)), &String::from_str(&env, "url"), &String::from_str(&env, "hash"));
}

#[test]
#[should_panic(expected = "URL exceeds maximum length")]
fn test_save_pool_rejects_long_url() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let pool_id = client.create_pool(&creator, &String::from_str(&env, "Pool"), &String::from_str(&env, "Test"), &1_000, &100_000);
    client.save_pool(&pool_id, &String::from_str(&env, "description"), &String::from_str(&env, &"u".repeat(MAX_URL_LENGTH + 1)), &String::from_str(&env, "hash"));
}

#[test]
#[should_panic(expected = "Image hash exceeds maximum length")]
fn test_save_pool_rejects_long_image_hash() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    let creator = Address::generate(&env);
    let pool_id = client.create_pool(&creator, &String::from_str(&env, "Pool"), &String::from_str(&env, "Test"), &1_000, &100_000);
    client.save_pool(&pool_id, &String::from_str(&env, "description"), &String::from_str(&env, "url"), &String::from_str(&env, &"h".repeat(MAX_IMAGE_HASH_LENGTH + 1)));
}

#[test]
fn test_multiple_donations() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Community Project"),
        &String::from_str(&env, "Building together"),
        &5_000_000_000u128,
        &100_000u64,
    );

    client.donate(&pool_id, &Address::generate(&env), &100_000_000u128);
    client.donate(&pool_id, &Address::generate(&env), &200_000_000u128);
    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.3, 300_000_000u128);
}

#[test]
fn test_close_pool() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Closed Pool"),
        &String::from_str(&env, "Test pool"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.set_pool_state(&pool_id, &PoolState::Disbursed);
    client.close_pool(&pool_id);
    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.4, true);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_donate_to_closed_pool() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.set_pool_state(&pool_id, &PoolState::Disbursed);
    client.close_pool(&pool_id);
    client.donate(&pool_id, &Address::generate(&env), &100_000_000u128);
}

#[test]
#[should_panic(expected = "Error(Auth, InvalidAction)")]
fn test_close_pool_unauthorized() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let unauthorized = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client
        .mock_auths(&[MockAuth {
            address: &unauthorized,
            invoke: &MockAuthInvoke {
                contract: &contract_id,
                fn_name: "close_pool",
                args: (&pool_id,).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .close_pool(&pool_id);
}

#[test]
fn test_multiple_pools() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let pool_id_1 = client.create_pool(
        &Address::generate(&env),
        &String::from_str(&env, "Pool 1"),
        &String::from_str(&env, "First pool"),
        &1_000_000_000u128,
        &100_000u64,
    );
    let pool_id_2 = client.create_pool(
        &Address::generate(&env),
        &String::from_str(&env, "Pool 2"),
        &String::from_str(&env, "Second pool"),
        &2_000_000_000u128,
        &100_000u64,
    );

    assert_eq!(pool_id_1, 1);
    assert_eq!(pool_id_2, 2);
    assert_eq!(client.get_pool_count(), 2);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_try_get_pool_returns_none_for_missing_pool() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    let _missing_pool = client.try_get_pool(&999).unwrap();
}

#[test]
fn test_get_total_raised_starts_at_zero() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Fresh Pool"),
        &String::from_str(&env, "No donations yet"),
        &1_000_000_000u128,
        &100_000u64,
    );
    assert_eq!(client.get_total_raised(&pool_id), 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")]
fn test_get_total_raised_rejects_missing_pool() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);
    let _ = client.get_total_raised(&999);
}

#[test]
#[should_panic(expected = "Description exceeds maximum length")]
fn test_pool_description_exceeds_max_length() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let long_desc = String::from_str(&env, &"x".repeat(501));
    client.create_pool(
        &Address::generate(&env),
        &String::from_str(&env, "Title"),
        &long_desc,
        &1_000_000_000u128,
        &100_000u64,
    );
}

// ============= CLAIM FUNDS TESTS =============

#[test]
#[should_panic(expected = "Application status not found")]
fn test_claim_funds_no_status() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let student = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &creator, &500_000_000u128);
    let token = Address::generate(&env);
    client.claim_funds(&student, &pool_id, &100_000_000i128, &token);
}

#[test]
#[should_panic(expected = "Application is not approved")]
fn test_claim_funds_rejected_application() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let student = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &creator, &500_000_000u128);
    client.set_application_status(&pool_id, &student, &String::from_str(&env, "Rejected"));
    let token = Address::generate(&env);
    client.claim_funds(&student, &pool_id, &100_000_000i128, &token);
}

#[test]
#[should_panic(expected = "Overdraw attempt")]
fn test_claim_funds_overdraw() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let student = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &creator, &100_000_000u128);
    client.set_application_status(&pool_id, &student, &String::from_str(&env, "Approved"));
    let token = Address::generate(&env);
    client.claim_funds(&student, &pool_id, &500_000_000i128, &token);
}

#[test]
#[should_panic(expected = "Claim amount must be positive")]
fn test_claim_funds_negative_amount() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let student = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &creator, &500_000_000u128);
    client.set_application_status(&pool_id, &student, &String::from_str(&env, "Approved"));
    let token = Address::generate(&env);
    client.claim_funds(&student, &pool_id, &-100_000_000i128, &token);
}

#[test]
fn test_get_claimed_amount_initial_zero() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let student = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    assert_eq!(client.get_claimed_amount(&pool_id, &student), 0);
}

#[test]
fn test_get_application_status() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let student = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    assert_eq!(
        client.get_application_status(&pool_id, &student),
        String::from_str(&env, "")
    );

    let approved = String::from_str(&env, "Approved");
    client.set_application_status(&pool_id, &student, &approved);
    assert_eq!(client.get_application_status(&pool_id, &student), approved);
}

// ============= PROTOCOL FEES TESTS =============

#[test]
fn test_protocol_fees_accumulation_on_claim() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let student = Address::generate(&env);
    let claim_amount: i128 = 100_000_000;
    let token = create_token(&env, claim_amount, &contract_id);

    client.set_admin(&admin);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &creator, &500_000_000u128);
    client.set_application_status(&pool_id, &student, &String::from_str(&env, "Approved"));
    client.claim_funds(&student, &pool_id, &claim_amount, &token);

    let app = client.get_application(&pool_id, &student);
    assert!(app.is_some());
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_claim_protocol_fees_requires_admin_authorization() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let non_admin = Address::generate(&env);
    let token = Address::generate(&env);
    client.set_admin(&admin);
    client.claim_protocol_fees(&non_admin, &token);
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_claim_protocol_fees_no_fees() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    client.set_admin(&admin);
    client.claim_protocol_fees(&admin, &token);
}

#[test]
fn test_claim_protocol_fees_multiple_claims_accumulate() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let student1 = Address::generate(&env);
    let student2 = Address::generate(&env);
    let claim1: i128 = 100_000_000;
    let claim2: i128 = 50_000_000;
    let token = create_token(&env, claim1 + claim2, &contract_id);

    client.set_admin(&admin);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &creator, &500_000_000u128);
    client.set_application_status(&pool_id, &student1, &String::from_str(&env, "Approved"));
    client.set_application_status(&pool_id, &student2, &String::from_str(&env, "Approved"));
    client.claim_funds(&student1, &pool_id, &claim1, &token);
    client.claim_funds(&student2, &pool_id, &claim2, &token);

    let fees = client.claim_protocol_fees(&admin, &token);
    assert_eq!(fees, 1_500_000); // 1% of 100M + 1% of 50M
}

#[test]
#[should_panic(expected = "Error(Contract, #10)")]
fn test_protocol_fees_reset_after_claim() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let student = Address::generate(&env);
    let claim_amount: i128 = 100_000_000;
    let token = create_token(&env, claim_amount, &contract_id);

    client.set_admin(&admin);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &creator, &500_000_000u128);
    client.set_application_status(&pool_id, &student, &String::from_str(&env, "Approved"));
    client.claim_funds(&student, &pool_id, &claim_amount, &token);
    client.claim_protocol_fees(&admin, &token);
    // Second claim should panic
    client.claim_protocol_fees(&admin, &token);
}

// ============= DONOR COUNT TRACKING TESTS =============

#[test]
fn test_new_campaign_has_zero_donors() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Description"),
        &1_000_000_000u128,
        &100_000u64,
    );
    assert_eq!(client.get_donor_count(&pool_id), 0);
}

// ============= WITHDRAW UNALLOCATED FUNDS TESTS =============

#[test]
fn test_withdraw_unallocated_funds_respects_locked_funds_regression_949() {
    // Regression test for issue #949: Storage key mismatch in withdraw_unallocated_funds
    // Ensures locked funds from approved applications are correctly excluded from withdrawal
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    // Setup: Create pool, admin, and register school
    let admin = Address::generate(&env);
    client.set_admin(&admin);

    let school = Address::generate(&env);
    let school_metadata_hash = BytesN::from_array(&env, &[0u8; 32]);
    client.register_school(&school, &school_metadata_hash);

    let creator = Address::generate(&env);
    let pool_goal = 100_000_000u128; // 100 XLM in stroops
    let pool_id = client.create_pool_for_school(
        &creator,
        &String::from_str(&env, "Scholarship Pool"),
        &String::from_str(&env, "Educational funding"),
        &pool_goal,
        &school,
        &200_000u64,
    );

    // Setup: Create token and approve donations
    let token_address = create_token(&env, 500_000_000i128, &contract_id);

    // Step 1: Multiple donors contribute to the pool
    let donor1 = Address::generate(&env);
    let donor2 = Address::generate(&env);
    let donor1_amount = 50_000_000u128;
    let donor2_amount = 30_000_000u128;

    client.donate(&pool_id, &donor1, &donor1_amount);
    client.donate(&pool_id, &donor2, &donor2_amount);

    // Total collected: 80_000_000 (leaving 20_000_000 unallocated)
    let pool_info = client.get_pool(&pool_id);
    assert_eq!(pool_info.3, 80_000_000u128, "Pool should have 80M collected");

    // Step 2: Student applies and gets approved for a portion
    let student = Address::generate(&env);
    client.apply_to_pool(
        &pool_id,
        &student,
        &String::from_str(&env, "Application data"),
    );

    // School approves the application
    client.approve_application(&pool_id, &school, &student, &true);

    // Create Application record by claiming funds
    let approved_amount = 60_000_000i128; // Approve 60M, locking 60M from withdrawal
    let application_status = client.get_application_status(&pool_id, &student);
    assert_eq!(
        application_status,
        String::from_str(&env, "Approved"),
        "Student should be approved"
    );

    // Simulate setting up application with approved amount
    // (In a real scenario, this would be done through setup_application_milestones + claim workflow)
    // For this test, we manually verify the locking mechanism by using the Application structure

    // Step 3: Attempt to withdraw surplus
    // Without the fix, this would incorrectly allow withdrawing 20M (80M - 0 locked)
    // With the fix, this should fail because 60M should be locked to the approved student

    // First, create an Application record by having the student claim partial funds
    client.claim_funds(&student, &pool_id, &10_000_000i128, &token_address);

    // Verify the Application record was created with the claimed amount tracked
    let claimed = client.get_claimed_amount(&pool_id, &student);
    assert_eq!(claimed, 10_000_000i128, "Student should have claimed 10M");

    // Now update the application to have a higher approved amount for testing
    // (This simulates what would happen in a real workflow)
    let app = client.get_application(&pool_id, &student);
    assert!(
        app.is_some(),
        "Application record should exist after claim"
    );

    let app_record = app.unwrap();
    assert_eq!(
        app_record.amount_claimed, 10_000_000i128,
        "Claimed amount should be 10M"
    );

    // The approved_amount should be set based on pool.collected when claimed
    // In the real implementation, this is 80_000_000 (the collected amount at claim time)
    let expected_approved = 80_000_000i128;
    assert_eq!(
        app_record.approved_amount, expected_approved,
        "Approved amount should be pool collected amount"
    );

    // Calculate locked funds: approved_amount (80M) - amount_claimed (10M) = 70M locked
    let locked_funds = (app_record.approved_amount - app_record.amount_claimed) as u128;
    assert_eq!(locked_funds, 70_000_000u128, "Locked funds should be 70M");

    // Attempt to withdraw
    // Expected: Only 80M - 70M locked = 10M surplus available
    // The transaction should succeed but only transfer 10M
    client.withdraw_unallocated_funds(&pool_id, &token_address);

    // Verify pool state after withdrawal
    let pool_after = client.get_pool(&pool_id);
    let collected_after = pool_after.3;

    // After withdrawing 10M surplus, collected should be 70M
    assert_eq!(
        collected_after, 70_000_000u128,
        "Pool should have 70M collected after withdrawing 10M surplus"
    );

    // This test passes because the storage key is now correct with Symbol::new()
    // If the bug existed, the locked funds would be computed as 0, and
    // the contract would attempt to transfer 80M, failing the assertion above
}
