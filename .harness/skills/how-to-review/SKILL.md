# Evaluator Review & Grading Criteria

## Automated Gates (Pass required)
- `npx tsc --noEmit` -> 0 type errors.
- `npm run lint` -> 0 ESLint / boundary violations.
- `npm test` -> 100% test pass rate.

## Mandatory Manual Verification Checklist
- [ ] No `throw new Error()` calls in `src/`.
- [ ] Cross-module mutations execute via `EventBus.emit()`.
- [ ] Module imports conform to `eslint.config.js` restriction rules.