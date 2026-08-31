#![cfg(test)]

//! Issue #944: authorization-bypass coverage against the real `Contract` API.
//!
//! Each test drives a privileged entrypoint from an address that is not
//! entitled to call it and asserts the contract rejects the call, either with
//! a typed `ContractError` or with a Soroban auth failure.

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

/// A non-admin caller cannot drain accumulated protocol fees.
#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_non_admin_cannot_claim_protocol_fees() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let attacker = Address::generate(&env);
    let token = create_token(&env, 1_000_000i128, &contract_id);

    client.set_admin(&admin);

    // Attacker authorizes itself but is not the stored admin.
    client.claim_protocol_fees(&attacker, &token);
}

/// A non-admin caller cannot rewrite the pool creation fee.
#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_non_admin_cannot_set_creation_fee() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let attacker = Address::generate(&env);

    client.set_admin(&admin);
    client.set_creation_fee(&attacker, &500i128);
}

/// Signing as an unrelated address does not satisfy `admin.require_auth()`.
#[test]
#[should_panic(expected = "InvalidAction")]
fn test_admin_auth_cannot_be_satisfied_by_another_signer() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let attacker = Address::generate(&env);

    // Only `attacker` has signed, but the call requires `admin`'s signature.
    client
        .mock_auths(&[MockAuth {
            address: &attacker,
            invoke: &MockAuthInvoke {
                contract: &contract_id,
                fn_name: "set_admin",
                args: (admin.clone(),).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .set_admin(&admin);
}

/// Only the school linked to a pool may approve that pool's applications.
#[test]
#[should_panic(expected = "Error(Contract, #7)")]
fn test_unlinked_school_cannot_approve_application() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let school = Address::generate(&env);
    let rogue_school = Address::generate(&env);
    let student = Address::generate(&env);

    client.set_admin(&admin);
    client.register_school(&school, &BytesN::from_array(&env, &[7u8; 32]));

    let pool_id = client.create_pool_for_school(
        &school,
        &String::from_str(&env, "Linked Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &school,
        &100_000u64,
    );
    client.apply_to_pool(&pool_id, &student, &String::from_str(&env, "app"));

    // A school that is not linked to this pool must be rejected.
    client.approve_application(&pool_id, &rogue_school, &student, &true);
}

/// A student's funds cannot be claimed without that student's authorization.
#[test]
#[should_panic(expected = "InvalidAction")]
fn test_claim_funds_requires_student_auth() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let student = Address::generate(&env);
    let attacker = Address::generate(&env);
    let token = create_token(&env, 1_000_000i128, &contract_id);

    // `create_pool` does not require auth, so no mock is needed here.
    let pool_id = client.create_pool(
        &creator,
        &String::from_str(&env, "Pool"),
        &String::from_str(&env, "Test"),
        &1_000_000_000u128,
        &100_000u64,
    );

    // The attacker signs, but `claim_funds` requires the student's signature.
    client
        .mock_auths(&[MockAuth {
            address: &attacker,
            invoke: &MockAuthInvoke {
                contract: &contract_id,
                fn_name: "claim_funds",
                args: (student.clone(), pool_id, 100i128, token.clone()).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .claim_funds(&student, &pool_id, &100i128, &token);
}
