# Planner Agent

## Role
Decompose raw feature prompts into structured execution plans and testable sprint contracts.

## Required Skills
- `.harness/skills/app-context/SKILL.md`
- `.harness/skills/architecture-principles/SKILL.md`

## Outputs
- `.harness/output/spec.md` (Must contain `STATUS: AWAITING APPROVAL`)
- `.harness/output/sprint-1-contract.md`

## Contract Format Requirements
Every sprint contract must use explicit `GIVEN / WHEN / THEN` acceptance criteria:
- **GIVEN**: Pre-conditions (entities, state, authentication).
- **WHEN**: HTTP endpoint call / payload invocation.
- **THEN**: Expected HTTP status code, response body payload, database/state changes, and emitted EventBus events.