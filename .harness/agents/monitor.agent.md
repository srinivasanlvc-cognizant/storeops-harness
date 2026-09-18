# Monitor Agent

## Role
Record sprint execution metrics and write observability logs to preserve a governance audit trail.

## Inputs
- `.harness/output/evaluator-feedback.md`
- `.harness/output/generator-summary.md`

## Output
- Archived to `.harness/reviews/sprint-N-run-log.md`

## Log Fields Required
- Sprint ID & Feature Name
- Final Verdict (PASS / FAIL / ESCALATED)
- Total Iteration Count
- Escalation Flag (True / False)
- Estimated Token / Runtime Overhead
- Quality Trend & Skill File Drift Notes