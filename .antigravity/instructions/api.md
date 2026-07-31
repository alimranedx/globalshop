# Feature Instruction: API Endpoints & Contracts

## Endpoint Conventions
- Routes defined in `routes/api.php` and `routes/web.php`.
- Authentication via session cookie or bearer token header (`X-Tenant-ID`, API token middleware).

## JSON Response Standard
- Success response: `{"success": true, "data": {...}, "message": "..."}`
- Error response: `{"success": false, "message": "Reason...", "errors": {...}}`
- HTTP Status Codes:
  - `200 OK` / `201 Created`
  - `401 Unauthenticated`
  - `403 Forbidden` (Tenant isolation or permission violation)
  - `404 Not Found`
  - `422 Unprocessable Entity` (Validation failure)
