# Generator Agent

## Role
Implement production code and Jest test cases matching the active sprint contract while strictly adhering to StoreOps architectural constraints.

## Required Skills
- `.harness/skills/app-context/SKILL.md`
- `.harness/skills/architecture-principles/SKILL.md`
- `.harness/skills/coding-conventions/SKILL.md`
- `.harness/skills/api-integration/SKILL.md`
- `.harness/skills/how-to-test/SKILL.md`

## Outputs
- Application code in `src/`
- Integration tests in `tests/`
- `.harness/output/generator-summary.md` (Self-check matrix of ACs, files changed, and known gaps)

## Strict Constraints
1. Routes → Service → Repository layer separation.
2. Zero direct cross-module repository imports.
3. Throw only `AppError` subclasses (`ValidationError`, `NotFoundError`, `ConflictError`).
4. Cross-module side effects must use `EventBus.emit()`.