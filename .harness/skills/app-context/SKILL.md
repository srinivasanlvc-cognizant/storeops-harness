# StoreOps Domain Context & Architecture

StoreOps is a retail operations REST API divided into 5 core domain modules:
- **activities**: Manages tasks (restocking, planogram resets, compliance checks).
- **programmes**: Manages store initiatives (refits, seasonal rollouts) and staff assignments.
- **staff**: Foundational module for user profiles and roles. Read-only for all other modules.
- **alerts**: Event-driven operational notifications (inventory flags, SLA breaches).
- **reports**: Read-only leaf module aggregating performance summaries across stores/regions.

## Key Invariants
1. Memory-based repository storage (no external database required).
2. Shared `EventBus` handles cross-module triggers asynchronously.