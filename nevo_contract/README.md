# Soroban Project

## Project Structure

This repository uses the recommended structure for a Soroban project:
```text
.
├── contracts
│   └── hello_world
│       ├── src
│       │   ├── lib.rs
│       │   └── test.rs
│       └── Cargo.toml
├── Cargo.toml
└── README.md
```

- New Soroban contracts can be put in `contracts`, each in their own directory. There is already a `hello_world` contract in there to get you started.
- If you initialized this project with any other example contracts via `--with-example`, those contracts will be in the `contracts` directory as well.
- Contracts should have their own `Cargo.toml` files that rely on the top-level `Cargo.toml` workspace for their dependencies.
- Frontend libraries can be added to the top-level directory as well. If you initialized this project with a frontend template via `--frontend-template` you will have those files already included.


---

## Error Handling

For comprehensive documentation of all contract errors, error codes, and panic messages, see:

**[→ ERRORS.md](./ERRORS.md)** - Complete error catalogue for integration engineers

This reference includes:
- Typed error codes and their meanings
- String panic messages
- Which functions raise each error
- Best practices for error handling in frontend/server code

## Documentation

- **[EVENTS_REFERENCE.md](./EVENTS_REFERENCE.md)** - All emitted events and their structure
- **[EVENT_EMISSION_TESTS.md](./EVENT_EMISSION_TESTS.md)** - Event system testing
