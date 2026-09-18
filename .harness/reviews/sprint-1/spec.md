STATUS: AWAITING APPROVAL

# Feature Spec: Shift Handover Bulk Status Update for Activities

## 1. Problem Statement
Store staff currently update `Activity` status one record at a time via
`PATCH /api/activities/:id/status`. During a shift handover, a supervisor
needs to close out or flag many activities (restocking, planogram resets,
compliance checks) at once for the outgoing shift, without issuing one HTTP
request per activity and without a single bad record aborting the whole
handover. This feature adds a bulk endpoint that updates many activities in
one request, with per-item (partial) failure reporting, staff verification,
and an `activity.updated` domain event per successful update.

## 2. Scope

### In scope
- New endpoint `PATCH /api/activities/bulk-status` in the `activities` module.
- Accepts an array of `{ id, status, notes? }` updates.
- Each item is validated and applied independently — one bad item does not
  block the others ("partial failure handling").
- Each item's assigned staff member is re-verified as active via the `staff`
  module's read-only public API (`assertStaffActive`), consistent with the
  existing `createActivity` pattern.
- A new domain event `activity.updated` is published via `EventBus` for every
  item that is successfully updated.
- Response contains both the successfully updated `Activity` records and an
  itemized list of per-id errors.

### Out of scope (sprint 1)
- New `alerts` listener behavior for `activity.updated` (alerts module is not
  touched; it may subscribe to this event in a future sprint).
- Authentication/authorization (the codebase has no auth layer today; not
  introduced here).
- Un-blocking workflow beyond `BLOCKED -> DONE` (see Open Question 3).
- Changes to the existing single-item `PATCH /api/activities/:id/status`
  endpoint or its `ActivityStatus` transition table for `pending` /
  `in_progress` / `completed` / `cancelled` beyond the additive changes noted
  in section 5.

## 3. Endpoint Contract

**Route:** `PATCH /api/activities/bulk-status`
Mounted on the existing `activitiesRouter` (already attached at `/api/activities`
in `src/app.ts`). Registered as `activitiesRouter.patch('/bulk-status', ...)`.
This is a single path segment, so it does not collide with the existing
`patch('/:id/status', ...)` route (two segments) or the `get('/:id', ...)`
route (different HTTP method/purpose) — verified against
`src/activities/routes/activities.routes.ts`.

### Request body
```ts
type BulkActivityStatus = 'DONE' | 'BLOCKED';

interface BulkStatusUpdateItem {
  id: string;
  status: BulkActivityStatus;
  notes?: string;
}

// Body is a bare JSON array, matching the "array of updates" requirement.
type BulkStatusUpdateRequest = BulkStatusUpdateItem[];
```

### Response body (HTTP 200 — see Open Question 2 for status code discussion)
```ts
interface BulkStatusUpdateErrorItem {
  id: string;
  code: string;      // matches AppError.code convention, e.g. 'VALIDATION_ERROR', 'NOT_FOUND'
  message: string;
}

interface BulkStatusUpdateResult {
  updated: Activity[];             // full updated Activity records, existing shape
  errors: BulkStatusUpdateErrorItem[];
}
```

Every input item resolves to exactly one outcome: it appears in `updated`
(as the resulting `Activity`) or in `errors` (as `{ id, code, message }`). No
item is silently dropped.

### Request-level (whole-request) failures — HTTP 400 `VALIDATION_ERROR`
These abort before any item is processed, because they mean the request
itself cannot be interpreted as a bulk update at all:
- Body is not a JSON array.
- Body is an empty array (see Open Question 1).

### Item-level failures — reported in `errors`, HTTP status stays 200
These do not abort the request; the offending id is skipped and reported:
- `id` missing/blank, or `status` not one of `'DONE' | 'BLOCKED'`.
- No activity exists with the given `id` (`NOT_FOUND`).
- The requested status is not a legal transition from the activity's current
  status (`VALIDATION_ERROR`) — see section 5.
- The activity's `assignedStaffId` fails staff verification, i.e. staff
  record not found or `active: false` (`NOT_FOUND` / `VALIDATION_ERROR`,
  propagated verbatim from the staff module's `assertStaffActive`).

## 4. Module Boundary Compliance
- `activities.service` calls `assertStaffActive` (and, if needed,
  `getStaffById`) from `src/staff/index.ts` — the module's public, read-only
  API — exactly as `createActivity` already does today. **No import of
  `staff.repository` or any staff service internals.**
- `activities.service` continues to use only its own `activitiesRepository`
  for reads/writes (`findById`, `updateStatus`). No repository from another
  module is imported, per the "Zero Cross-Module Repository Imports" rule.
- The successful-update side effect visible to other modules (e.g. future
  `alerts` subscriptions) is delivered exclusively through
  `eventBus.publish('activity.updated', ...)` — no direct call into
  `alerts` or any other sibling module, per the "EventBus for Side Effects"
  rule.
- `reports` and `programmes` are untouched; this feature does not read or
  write their state.
- The bulk operation is still owned by `activities`' 3-layer structure:
  `activities.routes.ts` (HTTP + shape validation) ->
  `activities.service.ts` (per-item business rules, staff check, event
  publish) -> `activities.repository.ts` (in-memory read/update).

## 5. Business Rules / Behavior Detail

### Status values and transitions
The existing `ActivityStatus` type (`pending | in_progress | completed |
cancelled`, defined in `src/activities/activities.types.ts`) does not contain
`DONE` or `BLOCKED`. Per Open Question 3 below, the plan is to **additively**
extend `ActivityStatus` with the two new literal values exactly as specified
in the feature request:

```ts
export type ActivityStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'DONE'
  | 'BLOCKED';
```

and extend the existing `ALLOWED_TRANSITIONS` map in
`activities.service.ts` additively:

```ts
const ALLOWED_TRANSITIONS: Record<ActivityStatus, ActivityStatus[]> = {
  pending: ['in_progress', 'cancelled', 'DONE', 'BLOCKED'],
  in_progress: ['completed', 'cancelled', 'DONE', 'BLOCKED'],
  completed: [],
  cancelled: [],
  DONE: [],
  BLOCKED: ['DONE'],
};
```
This lets a supervisor mark any non-terminal activity `DONE` or `BLOCKED`
during handover, and lets a previously `BLOCKED` activity later be marked
`DONE` (also via this same bulk endpoint, one item at a time or in another
batch). Transitioning *out of* `BLOCKED` back to `in_progress`, or handling
`completed`/`cancelled`/`DONE` as still-open, is out of scope (Open Question 3).

### Notes field
`notes` is optional free text captured at handover time (e.g. "left half-done,
low stock on aisle 4"). It is persisted onto the `Activity` record as a new
optional field `notes?: string` (added to the `Activity` interface) and is
also included in the `activity.updated` event payload so subscribers (e.g. a
future alerts listener) can see the handover context without a follow-up
lookup.

### Per-item independence
Each item in the request array is processed as its own transaction against
the in-memory repository: lookup -> transition check -> staff check -> write
-> publish event. A failure at any step for item *N* only produces an entry
in `errors`; it has no effect on items processed before or after it in the
same request.

## 6. Events
A new domain event is added to `src/shared/events/types.ts`:
```ts
export interface ActivityUpdatedEvent {
  activityId: string;
  storeId: string;
  assignedStaffId: string;
  previousStatus: string;
  newStatus: string;
  notes?: string;
}
```
and registered in `DomainEventMap` as `'activity.updated': ActivityUpdatedEvent`,
alongside the existing `'activity.created'` and `'activity.statusChanged'`
entries (see `src/shared/events/types.ts`, `src/shared/events/eventBus.ts`,
`src/shared/events/index.ts`). It is published once per successfully-updated
item via `eventBus.publish('activity.updated', {...})`, following the exact
`publish`/`subscribe` API already used by `activities.service.ts` and
consumed by `src/alerts/listener/alerts.listener.ts`.

This is deliberately a **new, distinct event** from the existing
`'activity.statusChanged'` (fired only by the single-item PATCH endpoint)
rather than reusing/overloading it, because the feature request names
`activity.updated` explicitly. Both events may coexist; no existing listener
is changed. See Open Question 4.

## 7. Data Model Changes
`src/activities/activities.types.ts`:
- `ActivityStatus` gains `'DONE' | 'BLOCKED'` (additive).
- `Activity` gains optional `notes?: string`.
- New types: `BulkActivityStatus`, `BulkStatusUpdateItem`,
  `BulkStatusUpdateRequest`, `BulkStatusUpdateErrorItem`,
  `BulkStatusUpdateResult` (all additive; no existing type is renamed or
  removed).

`src/activities/repository/activities.repository.ts`:
- `updateStatus` needs to also accept/persist the optional `notes`, e.g.
  `updateStatus(id: string, status: ActivityStatus, notes?: string): Activity | undefined`.
  This is a backwards-compatible signature change (existing callers omit the
  third argument).

## 8. Open Questions / Assumptions (flagged for developer review before `APPROVED`)
1. **Empty array input**: assumed to be a request-level `400 VALIDATION_ERROR`
   ("request body must be a non-empty array") rather than a no-op `200` with
   empty `updated`/`errors`. Rationale: fails fast on a likely client bug.
   If the intended behavior is a silent no-op `200`, this is a one-line
   change in the acceptance criteria and service guard clause.
2. **HTTP status code for partial success**: assumed to always be `200 OK`,
   with success/failure communicated only inside the response body
   (`updated` / `errors`), for consistency with the rest of this codebase
   which has no existing use of `207 Multi-Status`. If the team prefers
   `207` for partial success and `200` only for all-succeeded, that is a
   route-layer change only.
3. **`DONE` / `BLOCKED` vs. existing lowercase statuses**: the feature
   request's wire format (`'DONE' | 'BLOCKED'`) doesn't match the existing
   `ActivityStatus` casing/style (`pending`, `in_progress`, ...). This plan
   adds them verbatim as new literals rather than silently mapping
   `DONE -> completed` / `BLOCKED -> cancelled`, to honor the literal
   contract in the feature request. This does introduce a mixed-case enum,
   which is a style inconsistency the developer may want to reconsider
   before approval. Related: whether `BLOCKED` should ever be reversible to
   `in_progress` is left out of scope for sprint 1 (only `BLOCKED -> DONE`
   is allowed).
4. **Staff verification failure is per-item, not request-level**: an inactive
   or unknown `assignedStaffId` on one activity does not block updates to
   other activities in the same request — this matches the "partial failure
   handling" requirement, but is called out explicitly since it differs from
   `createActivity`, where an inactive staff member blocks the entire
   (single-item) request.
5. **`notes` persistence**: assumed notes should be persisted on the
   `Activity` record (new `notes?: string` field) rather than being
   transient/write-only into the event payload. If notes should NOT be
   persisted to the record (e.g. only ever exist in an audit/event trail),
   the repository schema change in section 7 is unnecessary.
