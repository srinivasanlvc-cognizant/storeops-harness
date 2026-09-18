# StoreOps Architecture & Boundary Rules

## 3-Layer Structure
Every module must strictly isolate concerns:
`Routes (HTTP/Validation)` -> `Service (Business Logic)` -> `Repository (In-Memory Data)`

## Non-Negotiable Rules
1. **Zero Cross-Module Repository Imports**: A service may only call another module's public Service interface for read-only checks.
2. **EventBus for Side Effects**: Triggering actions in sibling modules (e.g., creating an Alert on Task delay) MUST use `EventBus.emit()`.
3. **Staff Module Isolation**: `staff` repository/service mutating methods stay private. Other modules interact via `index.ts` read methods (`getStaffById`, `assertStaffActive`).
4. **Read-Only Reports**: The `reports` module aggregates data; it NEVER writes to or mutates state in other modules.