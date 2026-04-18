---
name: mercado-law-api
description: Documentacion tecnica de la API REST de MercadoLaw Backend en .NET 9, incluyendo estructura, endpoints, manejo de errores, autenticacion y ejemplos de uso.
argument-hint: "Proporciona una documentacion tecnica detallada de la API REST de MercadoLaw Backend, incluyendo estructura general, endpoints disponibles, manejo de errores, autenticacion, estados y flujos principales, consideraciones especiales y ejemplos de uso. La documentacion debe ser clara y util para desarrolladores backend, frontend, QA y DevOps que interactuan con la API."
---

# Documentacion Tecnica API MercadoLaw

## 1. Introduccion

### Proposito de la API

MercadoLaw Backend expone una API REST en .NET 9 para:

- Gestion de catalogos y entidades operativas (clientes, casos, tareas, documentos, pagos, etc.).
- Integracion con Appwrite para usuarios, autenticacion y sincronizacion de datos de usuario.
- Integracion con Stripe para creacion de PaymentIntents y procesamiento de webhooks.
- Trazabilidad de errores con formato estandar y `traceId`.

### Publico objetivo

- Backend: mantenimiento y evolucion de endpoints.
- Frontend: consumo de contratos JSON.
- QA: definicion de pruebas funcionales y de errores.
- DevOps: configuracion, seguridad y despliegue.

### Principios generales

- Estilo REST con JSON.
- Versionado por URL: `/api/v1.0.0`.
- OpenAPI disponible en entorno Development.
- Convenciones de respuesta con manejo centralizado de errores.

## 2. Informacion general

### Base URL

- Desarrollo local: `https://localhost:7212`
- Base path versionado: `/api/v1.0.0`

### Versionado del API

- Version fija en rutas actuales: `v1.0.0`.
- No se observa versionado por header o query param.

### Formato de fechas y horas

- `DateTime` se serializa como ISO-8601 UTC (ej: `2026-04-18T14:30:00Z`).
- `DateOnly` se serializa como `yyyy-MM-dd`.

### Convenciones de nombres

- JSON en `camelCase` en respuestas de error serializadas por middleware.
- DTOs definidos como `record` en `MercadoLaw.Application`.
- Rutas REST usan kebab-case para recursos schema (`/payment-statuses`, `/task-action-types`, etc.).

### Manejo de nulls y campos opcionales

- Campos `?` en contratos son opcionales y pueden ser `null`.
- Campos nullable comunes:
  - `legalCaseId`, `intakeId`, `description`, `oldValue`, `newValue`, `avatarUrl`, etc.
- `details` en errores solo se incluye en validaciones (422).

## 3. Autenticacion y autorizacion

### Tipo de autenticacion usada

La API no tiene autenticacion/autorizacion global ASP.NET Core (`AddAuthentication`/`UseAuthentication` no estan registrados).

Flujos actuales:

- `POST /api/v1.0.0/auth/login`: requiere `Authorization: Bearer <jwt_appwrite>` para consultar cuenta en Appwrite.
- `POST /api/v1.0.0/payments/stripe/webhook`: requiere header `Stripe-Signature` para validar webhook.
- El resto de endpoints no tienen restriccion de autorizacion a nivel controlador.

### Headers requeridos por endpoint

- General JSON:
  - `Content-Type: application/json` (cuando hay body JSON).
- Login:
  - `Authorization: Bearer <jwt>` (obligatorio).
- Stripe webhook:
  - `Stripe-Signature: <firma_stripe>` (obligatorio).
- Avatar upload:
  - `Content-Type: multipart/form-data`.

### Ejemplo request autenticado (login)

```http
POST /api/v1.0.0/auth/login HTTP/1.1
Host: localhost:7212
Authorization: Bearer eyJhbGciOi...
```

### Respuestas ante credenciales faltantes o invalidas

- Login sin token: `401` con body no estandar:

```json
{ "error": "Token no proporcionado." }
```

- Login con token invalido (fallo en Appwrite): termina como `404 NOT_FOUND` por excepcion de dominio en servicio Appwrite.

## 4. Manejo de errores

### Formato estandar de error

Para errores procesados por middleware:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Uno o mas errores de validacion ocurrieron.",
    "status": 422,
    "timestamp": "2026-04-18T14:30:00Z",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "El formato de email es invalido."
      }
    ]
  },
  "traceId": "00-abc-123"
}
```

### Codigos HTTP usados

- `200 OK`: consultas y actualizaciones exitosas.
- `201 Created`: altas exitosas.
- `204 No Content`: eliminaciones exitosas.
- `400 Bad Request`: errores de negocio (`DomainException`).
- `401 Unauthorized`: login sin bearer token (respuesta puntual del controlador).
- `404 Not Found`: entidad no encontrada.
- `409 Conflict`: conflictos de negocio/estado.
- `422 Unprocessable Entity`: validaciones FluentValidation.
- `500 Internal Server Error`: errores no controlados.

### Diferencia entre errores

- Validacion (`422`): formato/obligatoriedad de campos; incluye `details`.
- Negocio (`400`/`409`): reglas del dominio, conflictos de estado o configuracion.
- Sistema (`500`): excepciones no mapeadas.

### Ejemplos reales

- Firma Stripe invalida: `400` con `code=INVALID_STRIPE_SIGNATURE`.
- Referencia de pago ya existente con estado reutilizable: se responde `200` con `reused=true` (no error).
- Falta de `payment_status` con code `pending`: `409`.

## 5. Endpoints

## 5.1 Endpoints funcionales (Auth, Users, Stripe)

### Endpoint: Login Appwrite

- Nombre funcional: Login por JWT Appwrite
- Metodo HTTP: `POST`
- URL completa: `/api/v1.0.0/auth/login`
- Proposito: Obtiene perfil de usuario y menu de navegacion por rol.
- Reglas de negocio:
  - Extrae JWT desde header `Authorization`.
  - Consulta Appwrite `account`.
  - Sincroniza usuario en base local (`app_user`, `user_preference`).
- Headers requeridos: `Authorization: Bearer <jwt>`.
- Path/query params: no aplica.
- Request body: no aplica.
- Responses:
  - `200`: `LoginResponseDto`.
  - `401`: token ausente.
  - `404`: token invalido/no encontrado en Appwrite.
  - `500`: error interno.
- Ejemplo `200`:

```json
{
  "user": {
    "id": "appwrite_user_id",
    "name": "Nombre Usuario",
    "email": "user@dominio.com",
    "role": "admin",
    "phone": null,
    "avatarUrl": null,
    "preferences": { "language": "es", "theme": "light" }
  },
  "navItems": []
}
```

- Idempotencia: si (lectura/sincronizacion).

### Endpoint: Listar usuarios Appwrite

- Metodo: `GET`
- URL: `/api/v1.0.0/users`
- Proposito: Lista usuarios de Appwrite y sincroniza a base local.
- Response `200`: `IEnumerable<AppUserDto>`.

### Endpoint: Crear usuario Appwrite

- Metodo: `POST`
- URL: `/api/v1.0.0/users`
- Body (`CreateUserCommand`):
  - `name` (obligatorio, max 128)
  - `email` (obligatorio, email valido)
  - `labels` (opcional)
- Responses:
  - `201`: `AppUserDto`
  - `422`: validacion
  - `500`: error interno

### Endpoint: Actualizar usuario Appwrite

- Metodo: `PATCH`
- URL: `/api/v1.0.0/users/{id}`
- Body (`UpdateUserCommand`):
  - `id` (se sobreescribe desde path)
  - `name` (obligatorio)
  - `labels` (opcional)
- Responses: `200`, `404`, `500`.

### Endpoint: Actualizar avatar de usuario

- Metodo: `PATCH`
- URL: `/api/v1.0.0/users/{id}/avatar`
- Headers: `Content-Type: multipart/form-data`
- Form-data:
  - `file` (obligatorio)
- Reglas:
  - MIME permitido: `image/jpeg`, `image/png`, `image/webp`
  - Tamano maximo archivo: 5MB (request limit 6MB)
- Responses:
  - `200`: `UserDto`
  - `400`: sin archivo
  - `500`: tipo/tamano invalido en handler (actualmente no mapeado a 4xx)

### Endpoint: Crear Stripe PaymentIntent

- Metodo: `POST`
- URL: `/api/v1.0.0/payments/stripe/payment-intents`
- Body (`CreateStripePaymentIntentCommand`):
  - `externalReference` (obligatorio, max 150)
  - `amount` (obligatorio, > 0)
  - `currency` (obligatorio, ISO3)
  - `reportedByUserId` (obligatorio)
  - `paymentMethodId` (obligatorio)
  - `legalCaseId` (opcional)
  - `intakeId` (opcional)
  - `notes` (opcional)
  - Regla: debe existir `legalCaseId` o `intakeId`.
- Responses:
  - `200`: `CreateStripePaymentIntentResponse`
  - `409`: conflictos de estado/configuracion
  - `422`: validacion
  - `500`: error interno
- Efecto colateral:
  - Crea o reutiliza registro `payment`.
  - Incrementa `attemptCount`.
  - Define `idempotencyKey` y persiste datos de Stripe.

### Endpoint: Consultar estado pago Stripe

- Metodo: `GET`
- URL: `/api/v1.0.0/payments/stripe/{paymentId}/status`
- Params:
  - `paymentId` GUID
- Responses:
  - `200`: `StripePaymentStatusResponse`
  - `404`: pago inexistente

### Endpoint: Webhook Stripe

- Metodo: `POST`
- URL: `/api/v1.0.0/payments/stripe/webhook`
- Headers:
  - `Stripe-Signature` obligatorio
- Body:
  - payload raw JSON de Stripe
- Responses:
  - `200`: `ProcessStripeWebhookResponse`
  - `400`: firma invalida (`INVALID_STRIPE_SIGNATURE`)
  - `422`: payload/firma faltantes
- Reglas:
  - Idempotencia por `provider_event_id`.
  - Si evento duplicado, responde `duplicate=true`.

## 5.2 Endpoints Schema CRUD (principal)

### Plantilla comun CRUD (31 recursos)

Para cada recurso schema (excepto composite keys, ver abajo) se exponen:

- `GET /api/v1.0.0/{resource}`
- `GET /api/v1.0.0/{resource}/{id:guid}`
- `POST /api/v1.0.0/{resource}`
- `PUT /api/v1.0.0/{resource}/{id:guid}`
- `DELETE /api/v1.0.0/{resource}/{id:guid}`

#### Query parameters comunes (GET list)

`PaginationRequest`:

- `page` (default 1)
- `pageSize` (default 20)
- `sortBy` (opcional)
- `sortDescending` (default false)
- `search` (opcional)

#### Response comun lista

`PagedResponse<T>`:

- `items`
- `page`
- `pageSize`
- `totalCount`
- `totalPages`

#### Respuestas comunes CRUD

- `GET list`: `200`, `500`
- `GET by id`: `200`, `404`, `500`
- `POST`: `201`, `409`, `422`, `500`
- `PUT`: `200`, `404`, `409`, `422`, `500`
- `DELETE`: `204`, `404`, `500`

### Recursos schema y contratos Create/Update

| Recurso                     | Ruta base                                 | Create/Update body                                                                                                                                 |
| --------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Absence Types               | `/api/v1.0.0/absence-types`               | `code`, `name`                                                                                                                                     |
| App Users                   | `/api/v1.0.0/app-users`                   | `idAw?`, `roleId`, `firstName`, `lastName`, `email`, `phone?`, `address?`, `isActive`                                                              |
| Client Statuses             | `/api/v1.0.0/client-statuses`             | `code`, `name`                                                                                                                                     |
| Clients                     | `/api/v1.0.0/clients`                     | `clientStatusId`, `fullName`, `email?`, `phone?`, `identificationNumber?`, `address?`, `city?`, `state?`, `zipCode?`, `country?`, `dateOfBirth?`   |
| Correspondence Statuses     | `/api/v1.0.0/correspondence-statuses`     | `code`, `name`                                                                                                                                     |
| Correspondence Types        | `/api/v1.0.0/correspondence-types`        | `code`, `name`                                                                                                                                     |
| Correspondences             | `/api/v1.0.0/correspondences`             | `legalCaseId?`, `userId?`, `correspondenceTypeId`, `correspondenceStatusId`, `trackingNumber?`, `sender?`, `receiver?`, `sentAt?`, `receivedAt?`   |
| Document Categories         | `/api/v1.0.0/document-categories`         | `code`, `name`                                                                                                                                     |
| Documents                   | `/api/v1.0.0/documents`                   | `uploadedBy`, `name`, `fileTypeId`, `documentCategoryId`                                                                                           |
| Document Versions           | `/api/v1.0.0/document-versions`           | `documentId`, `versionNumber`, `filePath`, `createdBy`                                                                                             |
| File Types                  | `/api/v1.0.0/file-types`                  | `code`, `name`, `maxSize`                                                                                                                          |
| Intake Sources              | `/api/v1.0.0/intake-sources`              | `code`, `name`                                                                                                                                     |
| Intakes                     | `/api/v1.0.0/intakes`                     | `clientId`, `legalCaseId?`, `sourceId?`, `formDataSummary?`                                                                                        |
| Legal Case Action Types     | `/api/v1.0.0/legal-case-action-types`     | `code`, `name`                                                                                                                                     |
| Legal Case Assignment Roles | `/api/v1.0.0/legal-case-assignment-roles` | `code`, `name`                                                                                                                                     |
| Legal Case Histories        | `/api/v1.0.0/legal-case-historys`         | `legalCaseId`, `legalCaseActionTypeId`, `userId?`, `description`, `oldValue?`, `newValue?`                                                         |
| Legal Case Types            | `/api/v1.0.0/legal-case-types`            | `code`, `name`                                                                                                                                     |
| Legal Cases                 | `/api/v1.0.0/legal-cases`                 | `clientId`, `legalCaseTypeId`, `statusId`, `priorityId`, `expedientNumber`, `title`, `description?`, `openedAt`, `closedAt?`                       |
| Payment Methods             | `/api/v1.0.0/payment-methods`             | `code`, `name`                                                                                                                                     |
| Payment Statuses            | `/api/v1.0.0/payment-statuses`            | `code`, `name`                                                                                                                                     |
| Payments                    | `/api/v1.0.0/payments`                    | `legalCaseId?`, `intakeId?`, `reportedByUserId`, `amountReceived`, `paymentDate`, `paymentMethodId`, `paymentStatusId`, `receiptNumber?`, `notes?` |
| Permissions                 | `/api/v1.0.0/permissions`                 | `code`, `description?`                                                                                                                             |
| Priority Levels             | `/api/v1.0.0/priority-levels`             | `code`, `name`, `sortOrder`                                                                                                                        |
| Roles                       | `/api/v1.0.0/roles`                       | `code`, `name`, `description?`                                                                                                                     |
| Statuses                    | `/api/v1.0.0/statuses`                    | `code`, `name`, `type`                                                                                                                             |
| Task Action Types           | `/api/v1.0.0/task-action-types`           | `code`, `name`                                                                                                                                     |
| Task Checklists             | `/api/v1.0.0/task-checklists`             | `taskId`, `itemText`, `completed`, `checkedBy?`, `completedAt?`                                                                                    |
| Task Histories              | `/api/v1.0.0/task-historys`               | `taskId`, `taskActionTypeId`, `performedBy?`, `description`, `oldValue?`, `newValue?`                                                              |
| Task Types                  | `/api/v1.0.0/task-types`                  | `code`, `name`                                                                                                                                     |
| Tasks                       | `/api/v1.0.0/tasks`                       | `legalCaseId`, `assignedTo?`, `taskTypeId`, `title`, `description?`, `dueDate?`, `statusId`, `priorityId`                                          |
| User Absences               | `/api/v1.0.0/user-absences`               | `userId`, `absenceTypeId`, `startDate`, `endDate`, `reason?`, `isApproved`                                                                         |

### Endpoints de llaves compuestas

#### Legal Case Assignments

- Ruta base: `/api/v1.0.0/legal-case-assignments`
- Endpoints:
  - `GET /legal-case-assignments`
  - `GET /legal-case-assignments/{legalCaseId}/{userId}/{legalCaseAssignmentRoleId}`
  - `POST /legal-case-assignments`
  - `PUT /legal-case-assignments/{legalCaseId}/{userId}/{legalCaseAssignmentRoleId}`
  - `DELETE /legal-case-assignments/{legalCaseId}/{userId}/{legalCaseAssignmentRoleId}`
- Body create: `legalCaseId`, `userId`, `legalCaseAssignmentRoleId`
- Body update: `assignedAt`
- Responses: `200/201/204/404/422/500`

#### User Permissions

- Ruta base: `/api/v1.0.0/user-permissions`
- Endpoints:
  - `GET /user-permissions`
  - `GET /user-permissions/{userId}/{permissionId}`
  - `POST /user-permissions`
  - `PUT /user-permissions/{userId}/{permissionId}`
  - `DELETE /user-permissions/{userId}/{permissionId}`
- Body create: `userId`, `permissionId`, `isGranted` (default true)
- Body update: `isGranted`
- Responses: `200/201/204/404/422/500`

## 6. Entidades y modelos

### Modelos principales

- `AppUser`: usuario interno sincronizado con Appwrite; incluye `avatarUrl` y `avatarFileId`.
- `Client`: cliente del despacho.
- `LegalCase`: caso legal principal (`expedientNumber`, `statusId`, `priorityId`).
- `Task`: tarea operativa asociada a caso.
- `Payment`: pago con campos de proveedor externo (Stripe) y control de idempotencia.
- `Document` y `DocumentVersion`: documento y versionado.
- `Correspondence`: comunicaciones ligadas a caso/usuario.
- `UserAbsence`: ausencias de usuario.

### Relaciones importantes

- `Client` 1:N `LegalCase`
- `LegalCase` 1:N `Task`, `Payment`, `Correspondence`
- `Document` 1:N `DocumentVersion`
- `LegalCaseAssignment` (N:N con metadata de rol entre caso y usuario)
- `UserPermission` (N:N entre usuario y permiso)

### Campos derivados/calculados

- `PagedResponse.totalPages` se calcula por `ceil(totalCount/pageSize)`.
- En login, `role` se deriva del primer label de Appwrite (fallback `user`).
- En Stripe, `reused=true` cuando se reutiliza PaymentIntent ya persistido.

## 7. Estados y flujos

### Pagos (Stripe)

Estados internos mapeados por webhook:

- `payment_intent.succeeded` -> `approved`
- `payment_intent.payment_failed` -> `rejected`
- `payment_intent.canceled` -> `rejected`
- `payment_intent.processing` -> `pending`
- `payment_intent.requires_action` -> `pending`
- `charge.refunded` -> mantiene `approved` y actualiza `refundedAmount`

Estados finales recomendados:

- Finales: `approved`, `rejected`
- Transitorios: `pending`

### Casos y tareas

- Casos y tareas usan catalogos (`status`, `priority_level`) y no imponen maquina de estados en controlador.
- Reglas de transicion dependen de datos enviados por cliente y constraints de BD.

### Eventos que cambian estado

- Creacion/actualizacion de entidades via CRUD.
- Webhook Stripe sobre `payment`.
- Edicion de checklists (`completed`, `completedAt`, `checkedBy`).

## 8. Consideraciones especiales

### Idempotencia

- Stripe PaymentIntent:
  - Usa `idempotencyKey` persistida por pago (`stripe:payment:{paymentId}`).
  - Reintentos pueden devolver el mismo intent (`reused=true`).
- Webhooks:
  - Deduplicacion por `provider_event_id`.

### Webhooks

- Endpoint: `POST /api/v1.0.0/payments/stripe/webhook`
- Debe enviarse `Stripe-Signature`.
- Se almacena hash SHA-256 del payload para trazabilidad.

### Reintentos y concurrencia

- En webhook, ante conflicto al guardar, se responde como duplicado procesado para evitar doble efecto.
- `attemptCount` de pagos aumenta en cada intento de crear intent.

### Seguridad y datos sensibles

- No exponer stack traces al cliente (solo server-side logs).
- Configurar secretos:
  - `Appwrite:ApiKey`
  - `Stripe:SecretKey`
  - `Stripe:WebhookSecret`
- Actualmente no hay autorizacion global aplicada a recursos CRUD.

### Limitaciones conocidas

- Inconsistencia de formato de error en `AuthController` (401 manual no estandar).
- En avatar upload, invalidaciones de MIME/tamano lanzan `InvalidOperationException` y hoy terminan en `500`.
- Inconsistencia nominal en rutas: `legal-case-historys`, `task-historys`.

## 9. Ejemplos de uso

### Flujo 1: Pago Stripe completo

1. Crear intent

```http
POST /api/v1.0.0/payments/stripe/payment-intents
Content-Type: application/json

{
  "externalReference": "INV-2026-0001",
  "amount": 150.25,
  "currency": "USD",
  "reportedByUserId": "11111111-1111-1111-1111-111111111111",
  "paymentMethodId": "22222222-2222-2222-2222-222222222222",
  "legalCaseId": "33333333-3333-3333-3333-333333333333",
  "intakeId": null,
  "notes": "Pago inicial"
}
```

2. Consultar estado

```http
GET /api/v1.0.0/payments/stripe/{paymentId}/status
```

3. Stripe envia webhook

```http
POST /api/v1.0.0/payments/stripe/webhook
Stripe-Signature: t=...,v1=...
```

### Flujo 2: CRUD legal cases

1. Crear caso (`POST /api/v1.0.0/legal-cases`)
2. Obtener por id (`GET /api/v1.0.0/legal-cases/{id}`)
3. Actualizar (`PUT /api/v1.0.0/legal-cases/{id}`)
4. Listar paginado (`GET /api/v1.0.0/legal-cases?page=1&pageSize=20`)
5. Eliminar (`DELETE /api/v1.0.0/legal-cases/{id}`)

### Casos de error comunes

- `422 VALIDATION_ERROR`: campos obligatorios vacios, email invalido, currency no ISO3.
- `404 NOT_FOUND`: recurso inexistente.
- `409 CONFLICT`: estado/referencia no compatible para operacion.
- `500 INTERNAL_SERVER_ERROR`: excepcion no mapeada.

## OpenAPI / Swagger / Scalar

- OpenAPI se expone en Development via `app.MapOpenApi()`.
- Referencia interactiva via Scalar en Development.
- Se recomienda mantener ejemplos por endpoint en anotaciones para mejorar consumo externo.

## Notas de consistencia

- Existen rutas con pluralizacion no convencional: `legal-case-historys`, `task-historys`.
- Existen dos estilos de error en runtime:
  - Estandar middleware (`ApiErrorResponse`).
  - Respuesta manual en login cuando falta token (`{ error: ... }`).
