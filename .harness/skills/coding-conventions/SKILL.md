# Coding Conventions & Typed Error Contract

## Typed Error Hierarchy
All business errors MUST throw subclasses of `AppError` (found in `src/shared/errors`). Never throw raw `Error()` or HTTP errors directly in routes/services.

- `ValidationError` (400) -> Invalid request payload / parameters.
- `NotFoundError` (404) -> Requested entity missing.
- `ConflictError` (409) -> Business state conflict.
- `ForbiddenError` (403) -> Permission / active status failure.

## TypeScript Strictness
- Zero `any` types; define explicit request params, body, and response interfaces.
- Express route handlers must catch errors or delegate to `next(err)`.