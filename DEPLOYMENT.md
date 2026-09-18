# StoreOps Deployment & Demonstration Proof

## Local Execution Instructions
1. Install dependencies: `npm install`
2. Build TypeScript project: `npx tsc`
3. Start REST API server: `npm start` (Runs on `http://localhost:3000`)

## Demonstration API Call
Execute `PATCH /api/activities/bulk-status` to test the newly generated harness feature:

```bash
curl -X PATCH http://localhost:3000/api/activities/bulk-status \
  -H "Content-Type: application/json" \
  -d '{
    "updates": [
      { "id": "act-101", "status": "DONE", "notes": "Completed shift handover restocking" },
      { "id": "act-102", "status": "BLOCKED", "notes": "Awaiting department manager sign-off" }
    ]
  }'
```  
### Expected Response (`200 OK`)
```json
{
  "updated": [
    { "id": "act-101", "status": "DONE", "notes": "Completed shift handover restocking" },
    { "id": "act-102", "status": "BLOCKED", "notes": "Awaiting department manager sign-off" }
  ],
  "errors": []
}
```




