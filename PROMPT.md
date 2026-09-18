@planner Add shift handover bulk update to activities.

Feature requirements:
1. Endpoint: `PATCH /api/activities/bulk-status`
2. Request Body: Array of activity status updates `[{ id: string, status: 'DONE' | 'BLOCKED', notes?: string }]`
3. Behavior: Update multiple operational activities in a single request with partial failure handling.
4. Returns: Updated activity records along with any itemized errors for failed activity IDs.
5. Events: Emit `activity.updated` event via EventBus for each successfully updated task.
6. Module rules: Verify assigned staff members using the read-only staff module API.