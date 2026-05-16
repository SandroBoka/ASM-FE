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

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
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

The application is being built around a layered architecture:

```txt
presentation / React UI
  -> application services and context
      -> API adapters
          -> HTTP client
              -> ASM backend
```

Current foundations:

- `AppProviders` wires global providers.
- `RouterProvider` defines application routes.
- `QueryClientProvider` prepares TanStack Query for server-state features.
- `httpClient` centralizes backend communication.
- `authApi` contains authentication-related backend endpoint calls.
- `authService` coordinates authentication flow between API calls and local session storage.
- `authStorage` stores the authentication session in `localStorage`.
- `authContext` exposes authentication state and actions to React components.

## Folder Responsibilities

The `src/app` folder contains the application shell. It owns the root React entry point, the top-level `App` component, global providers, routing, API adapters, application services, and feature folders.

The `src/app/api` folder contains backend-facing API adapters. `httpClient` centralizes low-level HTTP behavior, while endpoint-specific modules such as `authApi` describe concrete backend calls. React components should not call `fetch` directly.

The `src/app/features` folder contains feature-oriented UI and feature-local code. The current auth feature owns authentication types, local session storage helpers, React auth context, and temporary screens used to verify the authentication flow.

The `src/app/providers` folder contains global provider composition. This is where app-wide tools such as TanStack Query, authentication context, and router provider are connected.

The `src/app/router` folder contains route configuration. It maps URLs to feature pages and still contains placeholder routes for features that have not been implemented yet.

The `src/app/services` folder contains application services that coordinate higher-level flows. For example, `authService` connects auth API calls with session creation, session storage, and logout cleanup.

The `src/tests` folder contains Vitest setup and application tests. Test setup loads Testing Library matchers for DOM assertions.

## Authentication Flow

Authentication is split across several small layers:

- `authApi` sends login, logout, current-user, and registration requests to the backend.
- `authService` coordinates login, registration, logout, session creation, and session cleanup.
- `authStorage` stores the current auth session in `localStorage`.
- `authContext` exposes the current user and auth actions to React components through `useAuth`.
- `httpClient` attaches access tokens, refreshes expired sessions, retries authenticated requests once after `401`, and clears the session when refresh fails.

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
authenticated: false
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
src/tests/app.test.tsx
```

The planned test suite will cover the presentation layer, business/application layer, data access layer, and integration flows that connect the layers.
