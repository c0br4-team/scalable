# MercadoLaw Frontend

Angular 21 standalone application for legal workflow management. The app integrates Appwrite authentication, a REST backend, and a json-server mock API for local development.

## Core Features

- Standalone Angular architecture with lazy-loaded feature routes.
- Auth flow with route protection:
  - `guestGuard` for guest-only pages (`/login`).
  - `authGuard` for protected areas (`/dashboard`, `/calendar`, `/cases`, `/profile`, `/users`).
- Appwrite-based session handling and JWT issuance, with automatic token refresh on HTTP 401.
- Dashboard module for authenticated landing view.
- Calendar and activities module:
  - Activity CRUD.
  - Advanced filters (status, type, priority, assignee, date ranges, overdue/upcoming, title search).
  - Checklist items management.
  - Assignees management.
  - Attachments management.
  - Activity history timeline.
- Cases module:
  - Cases list.
  - Case detail route (`/cases/:id`).
- Users module:
  - User listing.
  - Create and update users through API.
- Profile module:
  - User profile page.
  - Avatar upload flow (multipart) with client-side validation.
- Internationalization:
  - English and Spanish translations via `@ngx-translate`.
  - Language preference persisted in local storage.
- Shared UX services:
  - Global loading state via HTTP interceptor.
  - Toast notifications system (positions, durations, actions).
  - Dynamic breadcrumbs from route data.
- PWA support enabled in production with Angular Service Worker.

## Tech Stack

- Angular 21 (standalone + signals).
- TypeScript 5.9.
- RxJS 7.
- Appwrite SDK.
- `@ngx-translate/core` + `@ngx-translate/http-loader`.
- Angular Service Worker.
- Tailwind CSS (v4 toolchain present).
- Vitest for unit testing through Angular test builder.
- json-server for local mock backend.

## Scripts

- `npm start`: Run Angular dev server.
- `npm run build`: Build application.
- `npm run build:prod`: Build with production configuration.
- `npm test`: Run unit tests.
- `npm run mock`: Run json-server mock API on port 3000.
- `npm run dev`: Run frontend and mock API concurrently.

## Project Structure

```text
.
|- angular.json
|- ngsw-config.json
|- package.json
|- mock/
|  |- db.json
|  |- middleware.cjs
|  |- routes.json
|- public/
|  |- assets/
|  |  |- i18n/
|  |     |- en.json
|  |     |- es.json
|  |- icons/
|- src/
|  |- app/
|  |  |- app.config.ts
|  |  |- app.routes.ts
|  |  |- core/
|  |  |  |- auth/
|  |  |  |  |- guards/
|  |  |  |  |- models/
|  |  |  |  |- services/
|  |  |  |- http/services/
|  |  |  |- interceptors/
|  |  |  |- navigation/
|  |  |  |- notifications/
|  |  |  |- services/
|  |  |- features/
|  |  |  |- auth/
|  |  |  |- calendar/
|  |  |  |  |- components/
|  |  |  |  |- models/
|  |  |  |  |- pages/
|  |  |  |  |- services/
|  |  |  |- cases/
|  |  |  |  |- components/
|  |  |  |  |- models/
|  |  |  |  |- pages/
|  |  |  |  |- services/
|  |  |  |- dashboard/
|  |  |  |- profile/
|  |  |  |- users/
|  |  |- layouts/
|  |  |  |- app-layout/
|  |  |  |- auth-layout/
|  |  |- shared/
|  |     |- design-system/
|  |     |- ui/
|  |- environments/
|     |- environment.ts
|     |- environment.prod.ts
```

## Routing Overview

- Public routes:
  - `/login`
  - `/reset-password`
- Protected routes:
  - `/dashboard`
  - `/calendar`
  - `/cases`
  - `/cases/:id`
  - `/profile`
  - `/users`

## Environment Notes

- Development API base URL is configured in `src/environments/environment.ts`.
- Production API base URL is configured in `src/environments/environment.prod.ts`.
- Appwrite endpoint, project ID, and app URL are also environment-driven.

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run frontend and mock API together:

   ```bash
   npm run dev
   ```

3. Open the app at `http://localhost:4200`.
