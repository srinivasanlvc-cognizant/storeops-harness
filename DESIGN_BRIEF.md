# StoreOps Harness Design Brief

## Section A: Intent Decomposition
The bulk activity update feature (`PATCH /api/activities/bulk-status`) was decomposed by the **Planner Agent** into `spec.md` and `sprint-1-contract.md`.
- **Sprint Boundaries**: Isolated to bulk activity state transitions (`DONE`, `BLOCKED`), notes persistence, and staff verification.
- **Acceptance Criteria**: Formatted as strict `GIVEN / WHEN / THEN` constructs ensuring testable HTTP status codes (`200 OK`), response payloads (`{ updated, errors }`), and asynchronous `EventBus` side effects (`activity.updated`).

## Section B: Governance Framework
- **Feedforward Context**: Agents read 6 modular skill files in `.harness/skills/` before acting, enforcing 3-layer architecture (`Routes` -> `Service` -> `Repository`), `AppError` hierarchy usage, and module boundaries.
- **Audit Trail**: Every completed sprint archives `spec.md`, `sprint-1-contract.md`, `generator-summary.md`, `evaluator-feedback.md`, and `sprint-1-run-log.md` in `.harness/reviews/` to maintain an immutable audit trail.

## Section C: Non-Determinism Strategy
To convert variable LLM output into deterministic decisions, the **Evaluator Agent** enforces non-negotiable **Hard Gates**:
1. **Tool Verification**: `npx tsc --noEmit` (0 errors), `npm run lint` (0 rule violations), and `npm test` (100% test pass rate).
2. **Architecture Hard Gates**: Zero direct cross-module repository imports and zero raw `throw new Error()` instances.
3. **Escalation Path**: Unresolved build or boundary failures trigger an escalation notice after a maximum of 3 iterations.

## Section D: Architectural Decision Log
- **Decision 1**: Enforce memory-based repository storage without database dependencies to keep unit test suites fast (<25s) and deterministic.
- **Decision 2**: Route cross-module notifications exclusively through an in-memory `EventBus` to prevent tight coupling between `activities` and `alerts`.