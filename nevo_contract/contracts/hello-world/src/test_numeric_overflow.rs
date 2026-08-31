#![cfg(test)]

//! Issue #944: numeric boundary and overflow handling in the real `Contract` API.
//!
//! Covers the checked-arithmetic paths (`collected`, milestone sums) and the
//! sign/range validation on fee and claim amounts.

use super::*;
use soroban_sdk::{
    testutils::Address as _, token::StellarAssetClient, Address, Env, String, Vec,
};

fn create_token(env: &Env, amount: i128, recipient: &Address) -> Address {
    let admin = Address::generate(env);
    let token = env.register_stellar_asset_contract_v2(admin.clone());
    let sac = StellarAssetClient::new(env, &token.address());
    sac.mint(recipient, &amount);
    token.address()
}

fn new_pool(env: &Env, client: &ContractClient, goal: u128) -> (u32, Address) {
    let creator = Address::generate(env);
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(env, "Pool"),
        &String::from_str(env, "Test"),
        &goal,
        &100_000u64,
    );
    (pool_id, creator)
}

/// `collected` uses checked addition and rejects a total that would wrap.
#[test]
#[should_panic(expected = "Collected amount overflow")]
fn test_collected_amount_addition_overflow_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let donor = Address::generate(&env);
    let token = create_token(&env, 1_000i128, &donor);
    let (pool_id, _) = new_pool(&env, &client, u128::MAX);

    // Push `collected` to the top of the u128 range.
    client.donate(&pool_id, &donor, &u128::MAX);
    assert_eq!(client.get_total_raised(&pool_id), u128::MAX);

    // Any further contribution must overflow the checked add rather than wrap.
    client.donate_with_token(&pool_id, &donor, &token, &1i128);
}

/// The largest representable contribution is accepted without wrapping.
#[test]
fn test_max_u128_contribution_recorded_exactly() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let donor = Address::generate(&env);
    let (pool_id, _) = new_pool(&env, &client, u128::MAX);

    client.donate(&pool_id, &donor, &u128::MAX);

    assert_eq!(client.get_total_raised(&pool_id), u128::MAX);
    assert_eq!(client.get_contribution(&pool_id, &donor), u128::MAX);
}

/// Summing milestone amounts uses checked addition.
#[test]
#[should_panic(expected = "Milestone amount overflow")]
fn test_milestone_sum_overflow_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let student = Address::generate(&env);
    let (pool_id, _) = new_pool(&env, &client, 1_000u128);

    let mut milestones = Vec::new(&env);
    milestones.push_back(Milestone { amount: u128::MAX });
    milestones.push_back(Milestone { amount: 1u128 });

    client.setup_application_milestones(&pool_id, &student, &milestones);
}

/// A negative creation fee is rejected with `InvalidFee`.
#[test]
#[should_panic(expected = "Error(Contract, #11)")]
fn test_negative_creation_fee_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.set_admin(&admin);
    client.set_creation_fee(&admin, &-1i128);
}

/// `i128::MAX` is accepted as a creation fee and stored without truncation.
#[test]
fn test_max_i128_creation_fee_stored_exactly() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.set_admin(&admin);
    client.set_creation_fee(&admin, &i128::MAX);

    assert_eq!(client.get_creation_fee(), i128::MAX);
}

/// A negative claim amount is rejected before any arithmetic is done.
#[test]
#[should_panic(expected = "Claim amount must be positive")]
fn test_negative_claim_amount_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let student = Address::generate(&env);
    let token = create_token(&env, 1_000i128, &contract_id);
    let (pool_id, _) = new_pool(&env, &client, 1_000u128);

    client.claim_funds(&student, &pool_id, &-1i128, &token);
}

/// The pool counter increments monotonically without wrapping.
#[test]
fn test_pool_counter_increments_without_wrapping() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    assert_eq!(client.get_pool_count(), 0);
    for expected in 1..=3u32 {
        let (pool_id, _) = new_pool(&env, &client, 1_000u128);
        assert_eq!(pool_id, expected);
        assert_eq!(client.get_pool_count(), expected);
    }
}
