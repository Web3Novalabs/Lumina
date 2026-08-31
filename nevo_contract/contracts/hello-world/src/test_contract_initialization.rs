#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    Address, Env,
};

// ============= ISSUE #1087: CONTRACT INITIALIZATION VALIDATION TESTS =============

/// Test 1: First admin initialization succeeds
#[test]
fn test_first_admin_initialization_succeeds() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.set_admin(&admin);

    // Verify admin was stored by setting a creation fee (admin-only operation)
    client.set_creation_fee(&admin, &100_000i128);
    assert_eq!(client.get_creation_fee(), 100_000i128);
}

/// Test 2: Second admin initialization succeeds (overwrites previous)
#[test]
fn test_second_admin_initialization_overwrites() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin1 = Address::generate(&env);
    let admin2 = Address::generate(&env);

    // First admin set
    client.set_admin(&admin1);
    client.set_creation_fee(&admin1, &50_000i128);

    // Second admin set overwrites
    client.set_admin(&admin2);

    // New admin can now perform admin operations
    client.set_creation_fee(&admin2, &200_000i128);
    assert_eq!(client.get_creation_fee(), 200_000i128);
}

/// Test 3: Negative creation fee fails with InvalidFee
#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_negative_creation_fee_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.set_admin(&admin);

    client.set_creation_fee(&admin, &-1i128);
}

/// Test 4: Valid creation fee parameters are set correctly
#[test]
fn test_valid_creation_fee_set_correctly() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.set_admin(&admin);

    // Zero fee (disables fee)
    client.set_creation_fee(&admin, &0i128);
    assert_eq!(client.get_creation_fee(), 0i128);

    // Small fee
    client.set_creation_fee(&admin, &1_000i128);
    assert_eq!(client.get_creation_fee(), 1_000i128);

    // Large fee
    client.set_creation_fee(&admin, &1_000_000_000i128);
    assert_eq!(client.get_creation_fee(), 1_000_000_000i128);
}

/// Test 5: Admin authorization is enforced on set_creation_fee
#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_set_creation_fee_requires_admin() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let non_admin = Address::generate(&env);

    client.set_admin(&admin);
    client.set_creation_fee(&non_admin, &100_000i128);
}

/// Test 6: Creation fee defaults to zero before any set
#[test]
fn test_creation_fee_defaults_to_zero() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    assert_eq!(client.get_creation_fee(), 0i128);
}

/// Test 7: Setting admin without prior admin succeeds
#[test]
fn test_set_admin_without_prior_admin_succeeds() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.set_admin(&admin);

    // Verify by checking fee can be set
    let fee = client.get_creation_fee();
    assert_eq!(fee, 0i128);
}

/// Test 8: set_creation_fee without admin set fails
#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_set_creation_fee_without_admin_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let caller = Address::generate(&env);
    client.set_creation_fee(&caller, &100i128);
}
