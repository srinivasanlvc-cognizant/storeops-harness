# StoreOps API

REST API for retail store operations management, built with Node.js + TypeScript (strict mode).

## Modules

Each module is layered as **Routes → Service → Repository**, with in-memory storage:

- `staff` — foundational module. Other modules may only *read* staff data (`getStaffById`, `listStaff`, `staffExists`, `assertStaffActive` via `src/staff/index.ts`). Create/update/deactivate stay internal to the module.
- `activities` — store tasks assigned to staff. Validates the assignee is active staff. Publishes `activity.created` / `activity.statusChanged` domain events.
- `programmes` — store-level initiatives owned by staff. Publishes `programme.created` / `programme.statusChanged` domain events.
- `alerts` — reacts only to the shared event bus (`src/shared/events`), never imports another module's internals directly. Exposes read/acknowledge endpoints.
- `reports` — read-only aggregator over staff/activities/programmes/alerts public APIs. Nothing depends on it.

Module boundaries (no circular imports, staff read-only, alerts via event bus only) are enforced with ESLint's `no-restricted-imports` (see `eslint.config.js`) and checked for cycles with `madge` (`npm run check-cycles`).

## Errors

All services/routes throw typed errors from `src/shared/errors` (`ValidationError`, `NotFoundError`, `ConflictError`, `ForbiddenError`), each extending the abstract `AppError` (`code`, `message`, `statusCode`). A single Express error-handling middleware (`src/shared/http/errorHandler.ts`) maps these to JSON responses; anything else becomes a generic 500.

## Scripts

```bash
npm install
npm run dev          # tsx watch
npm run build        # tsc -> dist
npm start             # run compiled server
npm run typecheck
npm run lint
npm run check-cycles  # madge circular-import check
npm test
npm run verify        # typecheck + lint + check-cycles + test
```

## API surface

- `POST/GET /api/staff`, `GET/PATCH/DELETE /api/staff/:id`
- `POST/GET /api/activities`, `GET /api/activities/:id`, `PATCH /api/activities/:id/status`
- `POST/GET /api/programmes`, `GET /api/programmes/:id`, `PATCH /api/programmes/:id/status`
- `GET /api/alerts`, `GET /api/alerts/:id`, `PATCH /api/alerts/:id/acknowledge`
- `POST /api/reports/generate`, `GET /api/reports`, `GET /api/reports/:id`
- `GET /health`
