# Jest & Supertest Integration Guidelines

## Requirements
1. Every new API endpoint must have a corresponding test suite in `tests/`.
2. Assert HTTP status codes, response structure, AND underlying state changes.
3. Verify `EventBus` subscriptions fire when expected events are emitted.
4. Use `supertest(app)` for HTTP calls.