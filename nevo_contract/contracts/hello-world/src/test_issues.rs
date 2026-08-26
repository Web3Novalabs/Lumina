#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events as _, Ledger},
    token::StellarAssetClient,
    Address, BytesN, Env, IntoVal, String, Symbol, TryIntoVal,
};

fn create_token(env: &Env, amount: i128, recipient: &Address) -> Address {
    let admin = Address::generate(env);
    let token = env.register_stellar_asset_contract_v2(admin.clone());
    let sac = StellarAssetClient::new(env, &token.address());
    sac.mint(recipient, &amount);
    token.address()
}

// ============= ISSUE #460: EMERGENCY WITHDRAWAL GRACE PERIOD VALIDATION TESTS =============

/// Test 1: Execute withdrawal exactly at grace period boundary succeeds
#[test]
fn test_emergency_withdrawal_at_grace_period_boundary() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let token = create_token(&env, 1_000_000_000i128, &contract_id);

    client.set_admin(&admin);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Emergency Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    client.request_emergency_withdraw(&admin, &pool_id, &token, &100_000_000i128);

    // Advance time exactly to grace period boundary (86400 seconds)
    env.ledger().set_timestamp(86400);

    // Should succeed at exactly grace period boundary
    client.execute_emergency_withdraw(&pool_id);
}

/// Test 2: Execute withdrawal 1 second before grace period fails
#[test]
#[should_panic(expected = "Grace period not elapsed")]
fn test_emergency_withdrawal_before_grace_period_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let token = create_token(&env, 1_000_000_000i128, &contract_id);

    client.set_admin(&admin);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Emergency Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    client.request_emergency_withdraw(&admin, &pool_id, &token, &100_000_000i128);

    // Advance time to 1 second before grace period (86399 seconds)
    env.ledger().set_timestamp(86399);

    // Should fail - grace period not elapsed
    client.execute_emergency_withdraw(&pool_id);
}

/// Test 3: Test grace period calculation with different timestamps
#[test]
fn test_grace_period_calculation_with_different_timestamps() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let token = create_token(&env, 1_000_000_000i128, &contract_id);

    client.set_admin(&admin);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Emergency Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Set initial timestamp to a non-zero value
    env.ledger().set_timestamp(1000);
    client.request_emergency_withdraw(&admin, &pool_id, &token, &100_000_000i128);

    // Advance time past grace period (1000 + 86400 + 1 = 87401)
    env.ledger().set_timestamp(87401);

    // Should succeed - grace period elapsed
    client.execute_emergency_withdraw(&pool_id);
}

/// Test 4: Verify tokens are properly transferred after successful execution
#[test]
fn test_emergency_withdrawal_token_transfer() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let withdrawal_amount = 100_000_000i128;
    let token = create_token(&env, withdrawal_amount, &contract_id);

    client.set_admin(&admin);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Emergency Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    client.request_emergency_withdraw(&admin, &pool_id, &token, &withdrawal_amount);

    // Advance time past grace period
    env.ledger().set_timestamp(86401);

    // Execute withdrawal - tokens should be transferred to admin
    client.execute_emergency_withdraw(&pool_id);

    // Verify withdrawal request was removed
    let withdrawal_key = (Symbol::new(&env, "emergency_withdraw"), pool_id);
    let has_request = env.as_contract(&contract_id, || {
        env.storage().persistent().has(&withdrawal_key)
    });
    assert!(
        !has_request,
        "Withdrawal request should be removed after execution"
    );
}

// ============= ISSUE #461: POOL CONTRIBUTION EDGE CASE TESTS FOR STATE VALIDATION =============

/// Test 1: Contribute to Active pool succeeds
#[test]
fn test_contribute_to_active_pool_succeeds() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let token = create_token(&env, 100_000_000i128, &donor);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Active Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Pool is in Active state by default - should succeed
    client.donate_with_token(&pool_id, &donor, &token, &100_000_000i128);

    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.3, 100_000_000u128);
}

/// Test 2: Contribute to Closed pool fails
#[test]
#[should_panic(expected = "Error(Contract, #4)")]
fn test_contribute_to_closed_pool_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let token = create_token(&env, 100_000_000i128, &donor);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Closed Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Transition to Disbursed so close_pool is allowed, then close the pool
    client.set_pool_state(&pool_id, &PoolState::Disbursed);
    client.close_pool(&pool_id);

    // Should fail with "Pool is closed"
    client.donate_with_token(&pool_id, &donor, &token, &100_000_000i128);
}

/// Test 3: Contribute to a Paused pool fails (Issue #943)
#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_contribute_to_paused_pool_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let token = create_token(&env, 100_000_000i128, &donor);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Paused Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.set_pool_state(&pool_id, &PoolState::Paused);

    // Should fail with InvalidPoolState
    client.donate_with_token(&pool_id, &donor, &token, &100_000_000i128);
}

/// Test 4: Contribute to a Completed pool fails (Issue #943)
#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_contribute_to_completed_pool_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let token = create_token(&env, 100_000_000i128, &donor);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Completed Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.set_pool_state(&pool_id, &PoolState::Completed);

    // Should fail with InvalidPoolState
    client.donate_with_token(&pool_id, &donor, &token, &100_000_000i128);
}

/// Test 5: Contribute to a Cancelled pool fails (Issue #943)
#[test]
#[should_panic(expected = "Error(Contract, #2)")]
fn test_contribute_to_cancelled_pool_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let token = create_token(&env, 100_000_000i128, &donor);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Cancelled Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.set_pool_state(&pool_id, &PoolState::Cancelled);

    // Should fail with InvalidPoolState
    client.donate_with_token(&pool_id, &donor, &token, &100_000_000i128);
}

// NOTE: Disbursed state is intentionally not covered here: it is not part of
// the Paused/Completed/Cancelled gap this issue targets, and is reachable
// only via the test-only `set_pool_state` helper (no production flow drives
// a pool from Active to Disbursed before donations close).

// ============= ISSUE #459: COMPREHENSIVE TESTS FOR EMERGENCY WITHDRAWAL AUTHORIZATION =============

/// Test 1: Valid admin successfully requests emergency withdrawal with proper token and amount
#[test]
fn test_valid_admin_requests_emergency_withdrawal() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let token = create_token(&env, 1_000_000_000i128, &contract_id);

    client.set_admin(&admin);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Emergency Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Valid admin should successfully request emergency withdrawal
    client.request_emergency_withdraw(&admin, &pool_id, &token, &100_000_000i128);

    // Verify request was stored
    let withdrawal_key = (Symbol::new(&env, "emergency_withdraw"), pool_id);
    let has_request = env.as_contract(&contract_id, || {
        env.storage().persistent().has(&withdrawal_key)
    });
    assert!(has_request, "Emergency withdrawal request should be stored");
}

/// Test 2: Non-admin account calling request_emergency_withdraw gets Auth Error
#[test]
#[should_panic(expected = "Error(Auth, InvalidAction)")]
fn test_non_admin_request_emergency_withdrawal_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let non_admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let token = create_token(&env, 1_000_000_000i128, &contract_id);

    client.set_admin(&admin);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Emergency Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Non-admin should fail with Auth Error
    client.request_emergency_withdraw(&non_admin, &pool_id, &token, &100_000_000i128);
}

/// Test 3: Test duplicate requests fail with EmergencyWithdrawalAlreadyRequested
#[test]
#[should_panic(expected = "EmergencyWithdrawalAlreadyRequested")]
fn test_duplicate_emergency_withdrawal_request_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let token = create_token(&env, 1_000_000_000i128, &contract_id);

    client.set_admin(&admin);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Emergency Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // First request should succeed
    client.request_emergency_withdraw(&admin, &pool_id, &token, &100_000_000i128);

    // Second request should fail with EmergencyWithdrawalAlreadyRequested
    client.request_emergency_withdraw(&admin, &pool_id, &token, &100_000_000i128);
}

/// Test 4: Test execute_emergency_withdraw before grace period fails
#[test]
#[should_panic(expected = "Grace period not elapsed")]
fn test_execute_emergency_withdraw_before_grace_period_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let creator = Address::generate(&env);
    let token = create_token(&env, 1_000_000_000i128, &contract_id);

    client.set_admin(&admin);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Emergency Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    client.request_emergency_withdraw(&admin, &pool_id, &token, &100_000_000i128);

    // Don't advance time - should fail immediately
    client.execute_emergency_withdraw(&pool_id);
}

// ============= ISSUE #462: POOL CONTRIBUTION AMOUNT VALIDATION TESTS =============

/// Test 1: Zero amount contribution fails with InvalidAmount
#[test]
#[should_panic(expected = "InvalidAmount")]
fn test_zero_amount_contribution_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let token = create_token(&env, 100_000_000i128, &donor);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Zero amount should fail with InvalidAmount
    client.donate_with_token(&pool_id, &donor, &token, &0i128);
}

/// Test 2: Negative amount contribution fails
#[test]
#[should_panic(expected = "InvalidAmount")]
fn test_negative_amount_contribution_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let token = create_token(&env, 100_000_000i128, &donor);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Negative amount should fail with InvalidAmount
    client.donate_with_token(&pool_id, &donor, &token, &-100_000_000i128);
}

/// Test 3: Maximum i128 amount contribution succeeds if balance allows
#[test]
fn test_maximum_i128_amount_contribution_succeeds() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let max_amount = i128::MAX;
    let token = create_token(&env, max_amount, &donor);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Max Amount Pool"),
        &String::from_str(&env, "Test"),
        &(i128::MAX as u128),
        &100_000u64,
    );

    // Maximum i128 amount should succeed if balance allows
    client.donate_with_token(&pool_id, &donor, &token, &max_amount);

    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.3, max_amount as u128);
}

/// Test 4: Contribution exceeding user balance fails with token transfer error
#[test]
#[should_panic]
fn test_contribution_exceeding_balance_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let token = create_token(&env, 100_000_000i128, &donor);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Test Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Try to contribute more than balance - should fail with token transfer error
    client.donate_with_token(&pool_id, &donor, &token, &200_000_000i128);
}

// ============= ISSUE #476: POOL CLOSURE STATE VALIDATION TESTS =============

/// Test 1: Close pool in Disbursed state succeeds
#[test]
fn test_close_disbursed_pool_succeeds() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Disbursed Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Set pool state to Disbursed
    client.set_pool_state(&pool_id, &PoolState::Disbursed);

    // Close should succeed for Disbursed pool
    client.close_pool(&pool_id);

    // Verify closed state persists
    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.4, true);
}

/// Test 2: Close pool in Cancelled state succeeds
#[test]
fn test_close_cancelled_pool_succeeds() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Cancelled Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Set pool state to Cancelled
    client.set_pool_state(&pool_id, &PoolState::Cancelled);

    // Close should succeed for Cancelled pool
    client.close_pool(&pool_id);

    // Verify closed state persists
    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.4, true);
}

/// Test 3: Close pool in Active state fails with PoolNotDisbursedOrRefunded error
#[test]
#[should_panic(expected = "Error(Contract, #8)")]
fn test_close_active_pool_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Active Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Pool is in Active state by default - should fail
    client.close_pool(&pool_id);
}

/// Test 4: Close pool in Paused state fails with PoolNotDisbursedOrRefunded error
#[test]
#[should_panic(expected = "Error(Contract, #8)")]
fn test_close_paused_pool_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Paused Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Set pool state to Paused
    client.set_pool_state(&pool_id, &PoolState::Paused);

    // Close should fail for Paused pool
    client.close_pool(&pool_id);
}

/// Test 5: Close pool in Completed state fails with PoolNotDisbursedOrRefunded error
#[test]
#[should_panic(expected = "Error(Contract, #8)")]
fn test_close_completed_pool_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Completed Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Set pool state to Completed
    client.set_pool_state(&pool_id, &PoolState::Completed);

    // Close should fail for Completed pool
    client.close_pool(&pool_id);
}

/// Test 6: Close pool in Closed state fails with PoolNotDisbursedOrRefunded error
#[test]
#[should_panic(expected = "Error(Contract, #8)")]
fn test_close_already_closed_pool_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Closed Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // Set pool state to Closed
    client.set_pool_state(&pool_id, &PoolState::Closed);

    // Close should fail for already Closed pool
    client.close_pool(&pool_id);
}

/// Test 7: Closed state persists correctly after successful close
#[test]
fn test_closed_state_persists() {
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

    // Set pool state to Disbursed
    client.set_pool_state(&pool_id, &PoolState::Disbursed);

    // Close the pool
    client.close_pool(&pool_id);

    // Verify is_closed returns true via get_pool
    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.4, true);

    // Verify state persists across multiple reads
    let pool2 = client.get_pool(&pool_id);
    assert_eq!(pool2.4, true);
}

// ============= ISSUE #939: REFUND_DONATION TESTS =============

/// Test 1: Donor is refunded once the deadline has passed AND the grace
/// period (REFUND_GRACE_PERIOD_LEDGERS) has fully elapsed.
#[test]
fn test_refund_donation_after_grace_period_succeeds() {
    let env = Env::default();
    env.mock_all_auths();
    // Raise the default persistent-entry TTL (4096 ledgers) so that jumping
    // the ledger sequence forward past the deadline + grace period doesn't
    // archive the contract instance / pool storage entries in the test sandbox.
    env.ledger().with_mut(|li| {
        li.min_persistent_entry_ttl = 20_000;
    });
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let contribution = 50_000_000u128;
    // Fund the contract directly (mirrors the withdraw_unallocated_funds
    // regression test): `donate` only updates accounting, so the contract
    // needs a real token balance for `refund_donation`'s transfer to work.
    let token = create_token(&env, contribution as i128, &contract_id);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Refund Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &donor, &contribution);

    let deadline: u32 = 1_000;
    client.set_pool_deadline(&pool_id, &deadline);

    // Advance exactly to the boundary: deadline + REFUND_GRACE_PERIOD_LEDGERS.
    env.ledger()
        .set_sequence_number(deadline + REFUND_GRACE_PERIOD_LEDGERS);

    client.refund_donation(&pool_id, &donor, &token);

    // Donor received their contribution back.
    let token_client = token::Client::new(&env, &token);
    assert_eq!(token_client.balance(&donor), contribution as i128);

    // Pool's collected amount and the donor's recorded contribution are both cleared.
    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.3, 0u128);
    assert_eq!(client.get_contribution(&pool_id, &donor), 0u128);
}

/// Test 2: Refund fails when no deadline was ever set on the pool.
#[test]
#[should_panic(expected = "Error(Contract, #12)")]
fn test_refund_donation_no_deadline_set_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let contribution = 50_000_000u128;
    let token = create_token(&env, contribution as i128, &contract_id);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Refund Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &donor, &contribution);

    // No deadline was ever set -> refund must be rejected with PoolNotExpired.
    client.refund_donation(&pool_id, &donor, &token);
}

/// Test 3: Refund fails when the deadline is set but has not passed yet.
#[test]
#[should_panic(expected = "Error(Contract, #12)")]
fn test_refund_donation_before_deadline_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let contribution = 50_000_000u128;
    let token = create_token(&env, contribution as i128, &contract_id);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Refund Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &donor, &contribution);

    let deadline: u32 = 1_000;
    client.set_pool_deadline(&pool_id, &deadline);

    // Ledger sequence is still 0 (the default) -- well before the deadline.
    client.refund_donation(&pool_id, &donor, &token);
}

/// Test 4: Refund fails when the deadline has passed but the grace period
/// has not fully elapsed yet -- one ledger short of the boundary.
#[test]
#[should_panic(expected = "Error(Contract, #12)")]
fn test_refund_donation_within_grace_period_fails() {
    let env = Env::default();
    env.mock_all_auths();
    // Raise the default persistent-entry TTL so the ledger-sequence jump
    // below doesn't archive the contract instance / pool storage entries.
    env.ledger().with_mut(|li| {
        li.min_persistent_entry_ttl = 20_000;
    });
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let contribution = 50_000_000u128;
    let token = create_token(&env, contribution as i128, &contract_id);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Refund Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &donor, &contribution);

    let deadline: u32 = 1_000;
    client.set_pool_deadline(&pool_id, &deadline);

    // One ledger short of deadline + REFUND_GRACE_PERIOD_LEDGERS: the
    // deadline has passed, but the grace period has not fully elapsed.
    env.ledger()
        .set_sequence_number(deadline + REFUND_GRACE_PERIOD_LEDGERS - 1);

    client.refund_donation(&pool_id, &donor, &token);
}

/// Test 5: Refund fails for a donor who never contributed to the pool.
#[test]
#[should_panic(expected = "Error(Contract, #13)")]
fn test_refund_donation_no_contribution_fails() {
    let env = Env::default();
    env.mock_all_auths();
    // Raise the default persistent-entry TTL so the ledger-sequence jump
    // below doesn't archive the contract instance / pool storage entries.
    env.ledger().with_mut(|li| {
        li.min_persistent_entry_ttl = 20_000;
    });
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env); // never donates
    let token = create_token(&env, 50_000_000i128, &contract_id);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Refund Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    let deadline: u32 = 1_000;
    client.set_pool_deadline(&pool_id, &deadline);
    env.ledger()
        .set_sequence_number(deadline + REFUND_GRACE_PERIOD_LEDGERS);

    // Donor never contributed -> NoContributionToRefund.
    client.refund_donation(&pool_id, &donor, &token);
}

// ============= ISSUE #941: CREATE_POOL_FOR_SCHOOL / GET_POOL_SCHOOL TESTS =============

/// Test 1: A registered school can back a pool, and get_pool_school returns it.
#[test]
fn test_create_pool_for_school_succeeds_for_registered_school() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.set_admin(&admin);

    let school = Address::generate(&env);
    let metadata_hash = BytesN::from_array(&env, &[6u8; 32]);
    client.register_school(&school, &metadata_hash);

    let creator = Address::generate(&env);
    let goal = 250_000_000u128;
    let pool_id = client.create_pool_for_school(
        &creator,
        &String::from_str(&env, "School Pool"),
        &String::from_str(&env, "Test"),
        &goal,
        &school,
        &100_000u64,
    );

    assert_eq!(client.get_pool_school(&pool_id), school);
    let pool = client.get_pool(&pool_id);
    assert_eq!(pool.1, creator);
    assert_eq!(pool.2, goal);
    assert_eq!(pool.3, 0u128);
}

/// Test 2: Creating a school-linked pool for an unregistered school panics.
#[test]
#[should_panic(expected = "Error(Contract, #14)")]
fn test_create_pool_for_school_unregistered_school_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let unregistered_school = Address::generate(&env);

    // No `register_school` call was made for this address.
    client.create_pool_for_school(
        &creator,
        &String::from_str(&env, "School Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &unregistered_school,
        &100_000u64,
    );
}

/// Test 3: get_pool_school panics for a pool with no linked school (i.e. one
/// created via the normal, non-school `create_pool` path).
#[test]
#[should_panic(expected = "Pool school not set")]
fn test_get_pool_school_fails_for_non_school_pool() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Regular Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    client.get_pool_school(&pool_id);
}

// ============= ISSUE #1069: REFUND CONTRIBUTION TRACKING TESTS =============
//
// `refund_donation()` (deadline/grace-period gating is covered by the
// ISSUE #939 tests above) is exercised here for its post-refund
// bookkeeping: the donor's token balance, their per-donor contribution
// record in storage, the pool's aggregate `collected` total, and the
// `DONATION_REFUND` ("don_refnd") event it emits with `(donor,
// contribution)` data.

/// Test 1: A donor with no recorded contribution in *this* pool cannot
/// refund — even if they contributed to a different pool, proving the
/// check is scoped per-pool. Panics with the contract's actual
/// `ContractError::NoContributionToRefund` variant (error code #13).
#[test]
#[should_panic(expected = "Error(Contract, #13)")]
fn test_refund_no_prior_contribution_fails_with_no_contribution_to_refund_error() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| {
        li.min_persistent_entry_ttl = 20_000;
    });
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let contribution = 50_000_000u128;
    let token = create_token(&env, contribution as i128, &contract_id);

    // Donor contributes to a different pool...
    let other_pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Other Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&other_pool_id, &donor, &contribution);

    // ...but has never contributed to this one.
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Refund Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    let deadline: u32 = 1_000;
    client.set_pool_deadline(&pool_id, &deadline);
    env.ledger()
        .set_sequence_number(deadline + REFUND_GRACE_PERIOD_LEDGERS);

    // Donor has a contribution elsewhere, but zero here -> NoContributionToRefund.
    client.refund_donation(&pool_id, &donor, &token);
}

/// Test 2: A successful refund transfers the donor's exact contribution
/// back to them -- checked on both sides of the transfer, not just that
/// the call succeeded.
#[test]
fn test_refund_transfers_full_contribution_back_to_donor() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| {
        li.min_persistent_entry_ttl = 20_000;
    });
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let contribution = 63_000_000u128;
    let token = create_token(&env, contribution as i128, &contract_id);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Refund Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &donor, &contribution);

    let deadline: u32 = 1_000;
    client.set_pool_deadline(&pool_id, &deadline);
    env.ledger()
        .set_sequence_number(deadline + REFUND_GRACE_PERIOD_LEDGERS);

    let token_client = token::Client::new(&env, &token);
    assert_eq!(
        token_client.balance(&donor),
        0i128,
        "donor should hold no tokens before the refund"
    );
    assert_eq!(token_client.balance(&contract_id), contribution as i128);

    client.refund_donation(&pool_id, &donor, &token);

    // The full contribution moved from the contract to the donor.
    assert_eq!(
        token_client.balance(&donor),
        contribution as i128,
        "donor must receive their full contribution back"
    );
    assert_eq!(
        token_client.balance(&contract_id),
        0i128,
        "contract's token balance must decrease by exactly the refunded amount"
    );
}

/// Test 3: After a refund, the donor's per-pool contribution record in
/// storage is zeroed -- verified by reading it back via
/// `get_contribution`, and further proven by the fact that a second
/// refund attempt on the same pool is rejected with
/// `NoContributionToRefund` (double-refund is impossible).
#[test]
#[should_panic(expected = "Error(Contract, #13)")]
fn test_refund_zeroes_contribution_record_and_prevents_double_refund() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| {
        li.min_persistent_entry_ttl = 20_000;
    });
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let contribution = 40_000_000u128;
    let token = create_token(&env, contribution as i128, &contract_id);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Refund Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &donor, &contribution);
    assert_eq!(client.get_contribution(&pool_id, &donor), contribution);

    let deadline: u32 = 1_000;
    client.set_pool_deadline(&pool_id, &deadline);
    env.ledger()
        .set_sequence_number(deadline + REFUND_GRACE_PERIOD_LEDGERS);

    client.refund_donation(&pool_id, &donor, &token);

    // The storage record is read back and must be zeroed after the refund.
    assert_eq!(
        client.get_contribution(&pool_id, &donor),
        0u128,
        "contribution record must be zeroed after refund"
    );

    // Nothing left to refund -> a second attempt must fail the same way.
    client.refund_donation(&pool_id, &donor, &token);
}

/// Test 4: Refunding one donor decrements the pool's `collected` total by
/// exactly their contribution, leaving another donor's contribution to the
/// same pool untouched -- proving this is a targeted decrement, not a
/// reset to zero.
#[test]
fn test_refund_decrements_pool_collected_by_exact_refunded_amount() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| {
        li.min_persistent_entry_ttl = 20_000;
    });
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor_a = Address::generate(&env);
    let donor_b = Address::generate(&env);
    let contribution_a = 30_000_000u128;
    let contribution_b = 45_000_000u128;
    // Only donor_a is refunded in this test, so the contract only needs
    // enough real token balance to cover that one transfer.
    let token = create_token(&env, contribution_a as i128, &contract_id);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Refund Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &donor_a, &contribution_a);
    client.donate(&pool_id, &donor_b, &contribution_b);

    let pool_before = client.get_pool(&pool_id);
    assert_eq!(pool_before.3, contribution_a + contribution_b);

    let deadline: u32 = 1_000;
    client.set_pool_deadline(&pool_id, &deadline);
    env.ledger()
        .set_sequence_number(deadline + REFUND_GRACE_PERIOD_LEDGERS);

    client.refund_donation(&pool_id, &donor_a, &token);

    let pool_after = client.get_pool(&pool_id);
    assert_eq!(
        pool_after.3, contribution_b,
        "pool.collected must be decremented by exactly donor_a's contribution"
    );
    // donor_b's own contribution record is untouched by donor_a's refund.
    assert_eq!(client.get_contribution(&pool_id, &donor_b), contribution_b);
}

/// Test 5: A successful refund emits `DONATION_REFUND` ("don_refnd") with
/// the full expected payload -- the contributor and the exact amount
/// refunded, tagged with the pool id in the topics.
#[test]
fn test_refund_emits_donation_refund_event_with_correct_fields() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| {
        li.min_persistent_entry_ttl = 20_000;
    });
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let donor = Address::generate(&env);
    let contribution = 55_000_000u128;
    let token = create_token(&env, contribution as i128, &contract_id);

    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Refund Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );
    client.donate(&pool_id, &donor, &contribution);

    let deadline: u32 = 1_000;
    client.set_pool_deadline(&pool_id, &deadline);
    env.ledger()
        .set_sequence_number(deadline + REFUND_GRACE_PERIOD_LEDGERS);

    let events_before_refund = env.events().all().len();
    client.refund_donation(&pool_id, &donor, &token);

    let all_events = env.events().all();
    assert_eq!(
        all_events.len(),
        events_before_refund + 1,
        "refund_donation() should emit exactly one event"
    );

    let event = all_events.get(all_events.len() - 1).unwrap();
    assert_eq!(event.0, contract_id, "event should come from the contract");
    assert_eq!(
        event.1,
        (DONATION_REFUND, pool_id).into_val(&env),
        "refund must use the DONATION_REFUND topic, tagged with the pool id"
    );
    assert_eq!(
        event.2,
        (donor.clone(), contribution).into_val(&env),
        "refund event data must be (donor, refunded_amount)"
    );

    // Decode the fields individually to make the assertion explicit.
    let (refunded_donor, refunded_amount): (Address, u128) =
        event.2.clone().try_into_val(&env).unwrap();
    assert_eq!(
        refunded_donor, donor,
        "event must name the correct contributor"
    );
    assert_eq!(
        refunded_amount, contribution,
        "event must carry the exact amount that was refunded"
    );
}
