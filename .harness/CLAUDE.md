# StoreOps Agentic Harness Orchestrator

## Entry Point Prompt Format
Invoke the harness using: `@planner <Feature description>`
Example: `@planner Add shift handover bulk update to activities`

## Orchestration Workflow
1. **Planner Phase**:
   - Reads `.harness/skills/app-context/` & `.harness/skills/architecture-principles/`.
   - Generates `.harness/output/spec.md` with `STATUS: AWAITING APPROVAL`.
   - Decomposes work into `.harness/output/sprint-1-contract.md`.
   - PAUSES for developer typing: `APPROVED`.

2. **Generator Phase**:
   - Reads sprint contract, `.harness/skills/coding-conventions/`, `.harness/skills/api-integration/`, and `.harness/skills/how-to-test/`.
   - Writes implementation code in `src/` and test suites in `tests/`.
   - Outputs `.harness/output/generator-summary.md`.

3. **Evaluator Phase**:
   - Reads code changes, `.harness/skills/how-to-review/`, and `.harness/skills/evaluation-criteria/`.
   - Runs deterministic automated checks: `npx tsc --noEmit`, `npm run lint`, and `npm test`.
   - Evaluates against StoreOps hard gates (module boundaries, typed errors, event bus usage).
   - Outputs `.harness/output/evaluator-feedback.md` with a verdict (`PASS`, `CONDITIONAL PASS`, `FAIL`).

4. **Routing & Loop Logic**:
   - **PASS**: Invokes Monitor agent, archives artifacts to `.harness/reviews/`, and completes sprint.
   - **FAIL / CONDITIONAL PASS**: Feeds `evaluator-feedback.md` back to Generator for retry (Max 3 iterations).
   - **MAX ITERATIONS EXCEEDED (3)**: Writes `.harness/output/escalation.md` and halts for developer intervention.

5. **Monitor Phase**:
   - Summarizes run metrics, token costs, and quality flags into `.harness/reviews/sprint-N-run-log.md`.