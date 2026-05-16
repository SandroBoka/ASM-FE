# ASM-FE

Frontend application for the FER Information Systems course project, implemented as a React + TypeScript solution for the ASM auto service system.

The project uses Vite for the local development server and production build.

## Requirements

- Node.js 20 or newer
- `npm`
- Running ASM backend for features that use real API endpoints

## Technology Stack

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- lucide-react
- Vitest
- Testing Library
- MSW
- ESLint
- Prettier

## Installation

```bash
npm install
```

## Environment

Create a `.env.local` file in the project root:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_APP_LOCALE=hr
```

## Running the Application

```bash
npm run dev
```

The Vite development server will print the local application URL, usually:

```txt
http://localhost:5173
```

## Available Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm test
npm run test:watch
npm run check
npm run preview
```

`npm run check` formats the code, applies automatic ESLint fixes, runs TypeScript checks, and runs the test suite.

## Application Architecture

The frontend uses **Vertical Slice Architecture**.

The application is organized around business features instead of global technical layers. Each feature owns the code needed for that part of the system, such as UI, models, API calls, services, storage, hooks, and validation. Shared infrastructure stays outside feature folders.

Current high-level structure:

```txt
src/app/
  api/                 shared HTTP infrastructure
  components/ui/       reusable UI components
  features/            vertical feature slices
  localization/        i18next setup
  router/              route definitions and route guards
  App.tsx              provider composition and router mounting
  main.tsx             React entry point
  styles.css           global styles and design tokens
```

Current feature slices:

```txt
features/auth/
  api/                 auth backend calls
  context/             auth provider and context
  hooks/               auth React hooks
  models/              auth DTO and user types
  service/             auth application flow
  storage/             local auth session storage
  ui/                  login and registration pages

features/home/
  HomePage.tsx         temporary protected home screen
```

Shared infrastructure:

- `App.tsx` composes `QueryClientProvider`, `AuthProvider`, and `RouterProvider`.
- `router` defines public and protected routes.
- `AuthRoutes` centralizes route protection through `ProtectedRoute` and `GuestRoute`.
- `httpClient` centralizes backend communication.
- `localization/i18n` configures Croatian and English UI text.
- `components/ui` contains reusable form and feedback components.

Planned business slices:

```txt
features/services/       service catalog / sifrarnik usluga
features/reservations/   reservation master-detail screen
features/vehicles/       vehicle-related UI and dropdown data
```

## Folder Responsibilities

The `src/app` folder contains the frontend application. It owns the React entry point, application composition, routing, shared infrastructure, global styles, localization, reusable UI components, and feature slices.

The `src/app/api` folder contains shared backend infrastructure. `httpClient` centralizes low-level HTTP behavior. Feature-specific API modules live inside their feature slices, for example `features/auth/api/authApi.ts`.

The `src/app/components/ui` folder contains reusable visual components such as buttons, text fields, alerts, and form layout components. These components do not own business logic.

The `src/app/features` folder contains vertical slices. Each feature should keep its related UI, models, services, API adapters, hooks, storage, repositories, and validation close together.

The `src/app/localization` folder contains i18next configuration and translation resources. The default locale is Croatian.

The `src/app/router` folder contains route configuration and route guards. Protected application routes require an authenticated user, while login and registration are guest routes.

The `src/tests` folder mirrors important parts of the application structure and contains Vitest tests, test utilities, and global test setup.

## Authentication Flow

Implementation:

- `features/auth/api/authApi.ts` sends login, logout, current-user, and registration requests to the backend.
- `features/auth/service/authService.ts` coordinates login, registration, logout, session creation, and session cleanup.
- `features/auth/storage/authStorage.ts` stores the current auth session in `localStorage`.
- `features/auth/context/authContext.tsx` exposes the current user and auth actions through `AuthProvider`.
- `features/auth/hooks/useAuth.ts` provides a small hook for consuming auth context.
- `features/auth/ui/LoginPage.tsx` and `RegisterPage.tsx` contain the current auth screens.
- `api/httpClient.ts` attaches access tokens, refreshes expired sessions, retries authenticated requests once after `401`, and clears the session when refresh fails.

Backend routes currently used by the frontend auth foundation:

```txt
POST /persons/customers
POST /auth/login
POST /auth/logout
POST /auth/refresh
GET  /auth/me
```

Logout is sent as a public request with the refresh token in the body because the backend logout route does not require an authenticated user dependency.

## HTTP Client

The HTTP client:

- reads the backend base URL from `VITE_API_BASE_URL`
- sends JSON request bodies
- parses JSON responses
- supports `204 No Content`
- attaches the access token for authenticated requests
- refreshes the access token when the stored session is expired
- retries authenticated requests once after a `401`
- clears the local session when refresh fails
- throws an `ApiError` containing the HTTP status and backend response body

Public requests can opt out of authentication with:

```ts
authenticated: false;
```

## Formatting And Checks

Formatting is handled by Prettier. The current configuration uses:

- semicolons
- double quotes
- 4-space indentation
- trailing commas

The main verification command is:

```bash
npm run check
```

## Testing

Vitest is configured with the `jsdom` environment and Testing Library matchers.

Current test setup:

```txt
src/tests/setupTests.ts
src/tests/testUtils/renderAuthPage.tsx
src/tests/app/features/auth/ui/LoginPage.test.tsx
src/tests/app/features/auth/ui/RegisterPage.test.tsx
```

The test folder mirrors application structure where useful. Current auth tests cover login and registration UI behavior using a mocked auth context.

Planned tests for business features:

- presentation tests for pages, forms, and controllers
- business logic tests for services, use cases, and validation rules
- data access tests for API adapters, repositories, and local storage adapters
- integration tests proving that feature UI, business logic, and data access are connected

Even though the frontend uses Vertical Slice Architecture, each business slice should still expose testable presentation, business, and data-access responsibilities.
