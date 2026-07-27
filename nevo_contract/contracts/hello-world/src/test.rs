#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, MockAuth, MockAuthInvoke},
    token::StellarAssetClient,
    Address, Env, IntoVal, String,
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
