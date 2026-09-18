# Sprint 1 Contract: Shift Handover Bulk Status Update for Activities

Reference spec: `.harness/output/spec.md` (STATUS: AWAITING APPROVAL).
This sprint delivers `PATCH /api/activities/bulk-status` end to end
(types -> repository -> service -> routes -> events -> tests), entirely
within the `activities` module, calling `staff`'s public read-only API only.

## Task Breakdown

### 1. Types — `src/activities/activities.types.ts`
- Extend `ActivityStatus` union with `'DONE' | 'BLOCKED'` (additive).
- Add optional `notes?: string` to `Activity`.
- Add `BulkActivityStatus = 'DONE' | 'BLOCKED'`.
- Add `BulkStatusUpdateItem { id: string; status: BulkActivityStatus; notes?: string }`.
- Add `BulkStatusUpdateErrorItem { id: string; code: string; message: string }`.
- Add `BulkStatusUpdateResult { updated: Activity[]; errors: BulkStatusUpdateErrorItem[] }`.

### 2. Events — `src/shared/events/types.ts`, `eventBus.ts`, `index.ts`
- Add `ActivityUpdatedEvent { activityId: string; storeId: string; assignedStaffId: string; previousStatus: string; newStatus: string; notes?: string }`.
- Register `'activity.updated': ActivityUpdatedEvent` in `DomainEventMap`.
- Export `ActivityUpdatedEvent` from `src/shared/events/index.ts` alongside the other event types.
- No change to `eventBus.ts` internals required (generic `publish`/`subscribe` already supports any key in `DomainEventMap`).

### 3. Repository — `src/activities/repository/activities.repository.ts`
- Change `updateStatus(id: string, status: ActivityStatus): Activity | undefined` to
  `updateStatus(id: string, status: ActivityStatus, notes?: string): Activity | undefined`,
  merging `notes` into the stored record only when provided (existing single-item
  `PATCH /:id/status` caller passes no third argument and is unaffected).

### 4. Service — `src/activities/service/activities.service.ts`
- Extend `ALLOWED_TRANSITIONS` per spec section 5 (`pending`/`in_progress` ->
  add `'DONE'`, `'BLOCKED'`; `BLOCKED` -> `['DONE']`; `DONE` -> `[]`).
- Add `export function bulkUpdateActivityStatus(items: BulkStatusUpdateItem[]): BulkStatusUpdateResult`:
  - Throw `ValidationError` if `items` is not an array or is an empty array
    (request-level failure, per spec Open Question 1).
  - For each item, in order, in a try/catch:
    1. Validate `id` is a non-empty string and `status` is `'DONE' | 'BLOCKED'`;
       else push `{ id: item.id ?? '', code: 'VALIDATION_ERROR', message: ... }` to `errors` and continue.
    2. `getActivityById(item.id)` (throws `NotFoundError` if missing).
    3. Check `ALLOWED_TRANSITIONS[activity.status].includes(item.status)`; else throw `ValidationError`.
    4. `assertStaffActive(activity.assignedStaffId)` (imported from `../../staff`, the module's public API — **never** import `staff.repository` or `staff.service` directly).
    5. `activitiesRepository.updateStatus(item.id, item.status, item.notes)`.
    6. `eventBus.publish('activity.updated', { activityId, storeId, assignedStaffId, previousStatus, newStatus: item.status, notes: item.notes })`.
    7. Push the updated `Activity` to `updated`.
    - Catch block: if the caught error is an `AppError` (from `../../shared/errors`), push `{ id: item.id, code: err.code, message: err.message }` to `errors` and continue to the next item; otherwise rethrow (unexpected/programmer error should still surface as a 500, not be swallowed).
  - Return `{ updated, errors }`.

### 5. Routes — `src/activities/routes/activities.routes.ts`
- Add `activitiesRouter.patch('/bulk-status', asyncHandler(async (req, res) => { res.status(200).json(activitiesService.bulkUpdateActivityStatus(req.body)); }))`.
- Register this route before/independent of `'/:id/status'` — no ordering conflict since `'/bulk-status'` is a single path segment and `'/:id/status'` requires two; confirmed against current router definitions.

### 6. Tests — `tests/activities.test.ts` (extend existing describe block or add a nested `describe('bulk-status')`)
- Cover all acceptance criteria below using `supertest` against `createApp()`, matching existing test helper patterns (`createStaffMember`, `uniqueEmail`).
- Also extend `tests/moduleBoundaries.test.ts` only if `bulkUpdateActivityStatus` is accidentally exported from `src/activities/index.ts` — it must **not** be (the public `index.ts` stays read-only: `getActivityById`, `listActivities` only).

## Acceptance Criteria (GIVEN / WHEN / THEN)

### AC1 — Full success: all items updated, all events emitted
- **GIVEN** an active staff member `S1` in store `store-bulk-1`, and two activities `A1` (status `pending`, `assignedStaffId: S1`) and `A2` (status `in_progress`, `assignedStaffId: S1`) created via `POST /api/activities`.
- **WHEN** the client sends `PATCH /api/activities/bulk-status` with body
  `[{ "id": "A1", "status": "DONE" }, { "id": "A2", "status": "BLOCKED", "notes": "waiting on delivery" }]`.
- **THEN** the response status is `200`; the response body is
  `{ updated: [ {...A1, status: "DONE"}, {...A2, status: "BLOCKED", notes: "waiting on delivery"} ], errors: [] }`;
  `GET /api/activities/A1` subsequently returns `status: "DONE"` and
  `GET /api/activities/A2` returns `status: "BLOCKED"` with `notes: "waiting on delivery"`;
  exactly two `activity.updated` events are published on the `EventBus`, one per activity, each with the correct `previousStatus`/`newStatus`/`notes`.

### AC2 — Partial failure: mix of valid and invalid ids, itemized errors alongside successful updates
- **GIVEN** an active staff member `S1` with one activity `A1` (status `pending`, `assignedStaffId: S1`) created via `POST /api/activities`, and no activity exists with id `"missing-id"`.
- **WHEN** the client sends `PATCH /api/activities/bulk-status` with body
  `[{ "id": "A1", "status": "DONE" }, { "id": "missing-id", "status": "DONE" }]`.
- **THEN** the response status is `200`; the response body's `updated` array contains exactly one entry (`A1`, now `status: "DONE"`); the response body's `errors` array contains exactly one entry `{ id: "missing-id", code: "NOT_FOUND", message: <contains "missing-id"> }`; `GET /api/activities/A1` reflects `status: "DONE"`; exactly one `activity.updated` event is published (for `A1` only).

### AC3 — Staff verification failure for one item does not block others
- **GIVEN** two active staff members `S1` and `S2`, activity `A1` (status `pending`, `assignedStaffId: S1`) and activity `A2` (status `pending`, `assignedStaffId: S2`), and `S2` is then deactivated via `DELETE /api/staff/S2`.
- **WHEN** the client sends `PATCH /api/activities/bulk-status` with body
  `[{ "id": "A1", "status": "DONE" }, { "id": "A2", "status": "DONE" }]`.
- **THEN** the response status is `200`; `updated` contains exactly `A1` with `status: "DONE"`; `errors` contains exactly one entry for `id: "A2"` with `code: "VALIDATION_ERROR"` (propagated from `assertStaffActive`, mirroring the message used by the existing "staff is not active" check); `GET /api/activities/A2` still shows its original `status: "pending"` (unchanged); exactly one `activity.updated` event is published, for `A1` only.

### AC4 — Invalid status value / malformed item is a per-item error, not a request-level failure
- **GIVEN** an active staff member `S1` with activity `A1` (status `pending`, `assignedStaffId: S1`).
- **WHEN** the client sends `PATCH /api/activities/bulk-status` with body
  `[{ "id": "A1", "status": "FINISHED" }]` (an unsupported status value).
- **THEN** the response status is `200`; `updated` is `[]`; `errors` contains exactly one entry `{ id: "A1", code: "VALIDATION_ERROR", message: <mentions the allowed status values "DONE"/"BLOCKED"> }`; `GET /api/activities/A1` still shows `status: "pending"` (unchanged); no `activity.updated` event is published.

### AC5 — Malformed request body (not an array) is a request-level validation error
- **GIVEN** no special setup is required (the request never reaches per-item processing).
- **WHEN** the client sends `PATCH /api/activities/bulk-status` with body `{ "id": "A1", "status": "DONE" }` (a single object, not an array).
- **THEN** the response status is `400`; the response body is `{ error: { code: "VALIDATION_ERROR", message: <indicates the body must be an array> } }`; no activity is modified; no `activity.updated` event is published.

### AC6 — Empty array input is a request-level validation error
- **GIVEN** no special setup is required.
- **WHEN** the client sends `PATCH /api/activities/bulk-status` with body `[]`.
- **THEN** the response status is `400`; the response body is `{ error: { code: "VALIDATION_ERROR", message: <indicates the array must not be empty> } }`; no `activity.updated` event is published.
  (Per spec Open Question 1: if the developer instead wants an empty array to be a no-op `200` with `{ updated: [], errors: [] }`, this criterion's expected status/body flips to `200` / `{ updated: [], errors: [] }` — flagged for confirmation at `APPROVED` time.)

### AC7 — Illegal status transition is a per-item error, not a request-level failure
- **GIVEN** an active staff member `S1` with activity `A1` created via `POST /api/activities` and then transitioned to `completed` via `PATCH /api/activities/A1/status` with `{ "status": "in_progress" }` followed by `{ "status": "completed" }` (a terminal status with no further allowed transitions).
- **WHEN** the client sends `PATCH /api/activities/bulk-status` with body `[{ "id": "A1", "status": "DONE" }]`.
- **THEN** the response status is `200`; `updated` is `[]`; `errors` contains exactly one entry `{ id: "A1", code: "VALIDATION_ERROR", message: <mentions cannot transition from "completed"> }`; `GET /api/activities/A1` still shows `status: "completed"`; no `activity.updated` event is published.

## Definition of Done
- `npx tsc --noEmit` passes with no new errors.
- `npm run lint` passes with no new violations.
- `npm test` passes, including new tests for AC1–AC7 above and all pre-existing tests (including `tests/moduleBoundaries.test.ts`).
- `src/activities/index.ts` still exports only `getActivityById`, `listActivities`, and types — `bulkUpdateActivityStatus` is NOT added to that public read-only surface.
- No import of `src/staff/repository/*` or `src/staff/service/*` (only `src/staff` i.e. `src/staff/index.ts`) anywhere in the new code.
- No direct call from `activities` into `alerts` (or any other module) — the only cross-module side-effect channel used is `eventBus.publish('activity.updated', ...)`.
