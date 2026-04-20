---
name: angular21-backend-contract
description: "Use when building or continuing an Angular 21 frontend against MercadoLaw Backend. Documents the real API surface, route patterns, authentication, error format, file upload rules, Stripe flows, pagination, and integration notes the frontend needs."
argument-hint: "What Angular 21 frontend flow or backend area do you need documented?"
---

# MercadoLaw Angular 21 Backend Contract

## Goal

Use this skill to understand exactly how the MercadoLaw backend should be consumed from an Angular 21 frontend. The focus is not on backend implementation details, but on the API contract, route structure, payload expectations, and integration rules that matter for the UI.

## Source of truth

The contract documented here is based on the live backend code under `src/MercadoLaw.API`, the shared application DTOs and commands, and the technical documentation in `docs/mercadolaw-api-tecnica.md`.

If code and documentation ever differ, prefer the controller and DTO definitions in the repo.

## Fast backend summary for Angular

- Base API version: `api/v1.0.0`
- Main runtime base: `https://localhost:7212` in local development
- Health endpoint: `GET /health`
- OpenAPI/Scalar: enabled only in Development
- JSON format: camelCase
- Date format: ISO-8601 UTC
- Auth model: no global ASP.NET auth middleware is configured; the main login flow uses an Appwrite Bearer token in the `Authorization` header
- Stripe webhook: backend-only integration; the Angular app should not call it directly
- CORS: controlled by `Cors:AllowedOrigins`

## Global integration rules

### Headers

- Send `Content-Type: application/json` for JSON bodies.
- Send `Authorization: Bearer <appwrite_jwt>` for `POST /auth/login`.
- Send `Content-Type: multipart/form-data` for avatar uploads.
- Send `Stripe-Signature` only for the Stripe webhook endpoint.

### Error handling

The backend returns structured errors through middleware for most failures.

Expected error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more validation errors occurred.",
    "status": 422,
    "timestamp": "2026-04-18T14:30:00Z",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "Invalid email format"
      }
    ]
  },
  "traceId": "00-..."
}
```

Frontend rule:

- Show validation messages from `details` when present.
- Treat `401` from login as missing token, not a generic auth failure.
- Treat `404` as entity not found or invalid Appwrite session depending on the endpoint.
- Treat `409` as a business conflict.
- Do not expect stack traces in client responses.

### Pagination contract

All generic CRUD list endpoints use the shared pagination request model.

- Query params: `page`, `pageSize`, `sortBy`, `sortDescending`, `search`
- Response shape: `items`, `page`, `pageSize`, `totalCount`, `totalPages`

Angular should map these responses to table and list components directly.

## Endpoint groups

### 1. Core functional endpoints

#### Health

- `GET /health`
- Purpose: simple availability probe
- Response example:

```json
{ "status": "healthy" }
```

#### Auth login

- `POST /api/v1.0.0/auth/login`
- Purpose: exchanges the Appwrite JWT for the app session payload used by the frontend shell
- Request body: none
- Required header: `Authorization: Bearer <token>`
- Success: `200` with `LoginResponseDto`
- Common failures:
  - `401` if the header is missing or malformed
  - `404` if the token is invalid or the Appwrite user cannot be resolved

Frontend note:

- Store the Appwrite token securely and send it only to this endpoint.
- Use the login response to initialize user profile, role, and navigation.

#### Users

- `GET /api/v1.0.0/users`
- `POST /api/v1.0.0/users`
- `PATCH /api/v1.0.0/users/{id}`
- `PATCH /api/v1.0.0/users/{id}/avatar`

Behavior:

- `GET` lists Appwrite users and also syncs them locally.
- `POST` creates a user in Appwrite.
- `PATCH /{id}` updates name and labels.
- `PATCH /{id}/avatar` uploads or replaces the avatar.

Avatar upload rules:

- Use `multipart/form-data`
- Field name: `file`
- Allowed mime types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 5 MB file payload, with a 6 MB request limit

Frontend note:

- Build this request with `FormData`, not JSON.
- Do not stringify the file payload.

#### Stripe payments

- `POST /api/v1.0.0/payments/stripe/payment-intents`
- `GET /api/v1.0.0/payments/stripe/{paymentId}/status`
- `POST /api/v1.0.0/payments/stripe/webhook`

Behavior:

- The payment-intent endpoint creates or reuses a local payment record and returns the Stripe intent data.
- The status endpoint reads the current Stripe/local payment state by local payment id.
- The webhook endpoint is for Stripe callbacks only and must receive the raw body plus `Stripe-Signature`.

Frontend note:

- Angular should only call the first two endpoints.
- Never call the webhook from the browser.
- Handle `409` as a valid business result for payment state conflicts.

### 2. Generic schema CRUD endpoints

These controllers inherit the same CRUD pattern.

Common routes:

- `GET /api/v1.0.0/{resource}`
- `GET /api/v1.0.0/{resource}/{id:guid}`
- `POST /api/v1.0.0/{resource}`
- `PUT /api/v1.0.0/{resource}/{id:guid}`
- `DELETE /api/v1.0.0/{resource}/{id:guid}`

Common responses:

- `GET list`: `200`
- `GET by id`: `200`, `404`
- `POST`: `201`, `409`, `422`
- `PUT`: `200`, `404`, `409`, `422`
- `DELETE`: `204`, `404`

Resources available in the backend:

- `/absence-types`
- `/app-users`
- `/clients`
- `/client-statuses`
- `/correspondences`
- `/correspondence-types`
- `/correspondence-statuses`
- `/document-categories`
- `/documents`
- `/document-versions`
- `/file-types`
- `/intakes`
- `/intake-sources`
- `/legal-case-action-types`
- `/legal-case-assignment-roles`
- `/legal-case-historys`
- `/legal-case-types`
- `/legal-cases`
- `/payment-methods`
- `/payment-statuses`
- `/payments`
- `/permissions`
- `/priority-levels`
- `/roles`
- `/statuses`
- `/task-action-types`
- `/task-checklists`
- `/task-historys`
- `/task-types`
- `/tasks`
- `/user-absences`

Frontend note:

- The schema endpoints are intended for generic CRUD screens and table/list views.
- Reuse a shared Angular data-access layer where possible.
- The route names are the contract; do not infer alternative singular/plural names in the frontend.

### 3. Composite-key association endpoints

#### Legal case assignments

- Base route: `GET/POST/PUT/DELETE /api/v1.0.0/legal-case-assignments`
- Detail route: `GET/PUT/DELETE /api/v1.0.0/legal-case-assignments/{legalCaseId}/{userId}/{legalCaseAssignmentRoleId}`
- Purpose: manage many-to-many relationships between cases, users, and assignment roles

#### User permissions

- Base route: `GET/POST/PUT/DELETE /api/v1.0.0/user-permissions`
- Detail route: `GET/PUT/DELETE /api/v1.0.0/user-permissions/{userId}/{permissionId}`
- Purpose: manage explicit permission grants for users

Frontend note:

- For these resources, the identity is the composite key, not a single GUID.
- UI components should build lookup URLs from the three key fields or two key fields respectively.

## Important frontend assumptions

### Authentication and authorization

- There is no global `UseAuthentication()` pipeline currently wired in the API.
- The frontend should not assume every endpoint is protected by the backend.
- If the UI depends on authorization, enforce it in the frontend navigation and in future backend changes explicitly.

### Dates and time zones

- Treat all date-time values as UTC unless the UI is explicitly handling a local-only date.
- Prefer date libraries or Angular date formatting that preserve UTC semantics for audit and payment flows.

### File uploads

- Use `multipart/form-data` with `FormData`.
- Do not set the `Content-Type` header manually for browser `FormData` uploads; let the browser add the boundary.

### Idempotency and retries

- Login is effectively a read/sync operation, but it has side effects on the backend user sync.
- Stripe payment intent creation can reuse an existing payment record.
- Webhook processing is idempotent and may return duplicate handling results.

### CORS

- If Angular runs on a different origin, that origin must be added to `Cors:AllowedOrigins` in backend config.

## Angular 21 implementation guidance

- Create one Angular service per backend area: auth, users, payments, schema resources.
- Centralize API base URL and version prefix in environment config.
- Use one HTTP interceptor for shared headers and one error interceptor for structured backend errors.
- Model API DTOs explicitly instead of using `any`.
- Wrap paged CRUD responses in reusable table/list adapters.
- Handle `PATCH /users/{id}/avatar` as a dedicated upload flow.
- Keep Stripe webhook logic out of the frontend; only display its effects through normal backend reads.

## What to check before building a screen

1. Identify the resource route and confirm whether it is generic CRUD or a special controller.
2. Check the request type: JSON, path params, query params, or multipart form upload.
3. Confirm whether the endpoint returns a paged response or a single DTO.
4. Map backend errors to the UI state: validation, conflict, missing entity, or server error.
5. Verify whether the endpoint has side effects such as Appwrite sync, payment creation, or file upload.

## Recommended reading order for frontend work

- `docs/mercadolaw-api-tecnica.md` for the long-form API reference
- `src/MercadoLaw.API/Controllers/AuthController.cs` for login behavior
- `src/MercadoLaw.API/Controllers/UsersController.cs` for user and avatar flows
- `src/MercadoLaw.API/Controllers/StripePaymentsController.cs` for payment flows
- `src/MercadoLaw.API/Controllers/CrudControllerBase.cs` for shared CRUD behavior
