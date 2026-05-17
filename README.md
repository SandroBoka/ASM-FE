# ASM-FE

Frontend application for the FER Information Systems course project. The app is a React + TypeScript client for an auto service management system, covering customer reservations and employee workflows.

The project uses Vite for local development and production builds, TanStack Query for server state, React Router for navigation, and Vitest with Testing Library for UI tests.

## Requirements

- Node.js 20 or newer
- npm
- Running ASM backend for real API data

## Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_APP_LOCALE=hr
```

`VITE_API_BASE_URL` points to the backend API. If it is not set, the frontend falls back to `http://127.0.0.1:8000`.

`VITE_APP_LOCALE` controls the UI language. The app currently contains Croatian and English translations, with Croatian as the fallback.

## Running

Start the development server:

```bash
npm run dev
```

Vite will print the local URL, usually:

```txt
http://localhost:5173
```

## Scripts

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

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- i18next and react-i18next
- React Hook Form and Zod
- lucide-react
- Vitest
- Testing Library
- MSW
- ESLint
- Prettier

## Application Structure

The frontend is organized with vertical feature slices. Shared infrastructure lives in `src/app`, while each business area owns its UI, hooks, API adapter, and models.

```txt
src/app/
  api/                 shared HTTP client
  components/ui/       reusable UI primitives
  features/            vertical feature slices
  localization/        i18next resources and setup
  router/              routes, layout, and guards
  App.tsx              provider composition
  main.tsx             React entry point
  styles.css           global styles and design tokens

src/tests/
  app/features/        UI tests grouped by feature
  testUtils/           shared render helpers
  setupTests.ts        Vitest setup
```

Current feature slices:

```txt
features/auth/                 login, logout, session storage, customer registration
features/home/                 role-aware home dashboard and quick actions
features/services/             service catalog CRUD for employees, read-only browsing for customers
features/vehicles/             customer vehicle CRUD
features/appointments/         employee appointment management
features/reservations/         customer reservations and employee processing
features/appointmentChanges/   customer appointment change requests and employee decisions
features/notifications/        customer notifications and read state
features/persons/              customer and employee lookup helpers
```

## Routing

Public routes:

```txt
/login
/register
```

Authenticated routes:

```txt
/                         home
/services                 service catalog
/reservations             reservation list
/reservations/new         new reservation
/reservations/:id         reservation details
/reservations/:id/edit    edit pending reservation
/vehicles                 customer vehicle management
```

Customer-only route:

```txt
/notifications
```

Employee-only routes:

```txt
/pending-reservations     pending reservation and appointment-change requests
/admin/appointments       appointment management
```

The navigation adapts to the signed-in user type. Customers see vehicles and notifications; employees see pending work and appointment administration.

## Main Workflows

### Authentication

- Customers can register.
- Users can sign in and sign out.
- Auth sessions are saved in local storage.
- The HTTP client refreshes expired access tokens with the refresh token and retries authenticated requests once after a `401`.

### Services

- Customers can browse the service catalog.
- Employees can create, edit, delete, and search services.
- Services include name, description, duration, and price.

### Vehicles

- Customers can manage their own vehicles.
- Vehicle forms validate year ranges.
- Employee users see an access message instead of customer vehicle editing.

### Appointments

- Employees can view appointment slots, filter by status, and filter by an exact date.
- Admin and manager employees can add, edit, and delete non-booked appointments.
- Adding a single appointment keeps the existing manual date/time/status flow.
- The "full working day free" option creates one-hour free slots from `08:00` to `20:00` instead of creating one long appointment.

### Reservations

- Customers can create reservations by selecting a vehicle, appointment, service rows, mileage, and problem description.
- The form calculates total service duration and price.
- Reservation creation is blocked when selected services exceed the selected appointment duration.
- Customers can edit reservations while they are still pending.
- Employees can view pending reservations, approve or reject them with an optional comment, and mark approved reservations as completed.

### Appointment Change Requests

- Customers can propose a new free appointment for an existing reservation.
- Employees can accept or reject pending appointment-change requests.
- Pending reservation and change request counts are shown in the employee navigation.

### Notifications

- Customers can view notifications.
- Unread notification count is shown in navigation.
- Notifications can be marked as read.

## HTTP Client

`src/app/api/httpClient.ts` centralizes backend communication.

It:

- reads `VITE_API_BASE_URL`
- sends and receives JSON
- supports `204 No Content`
- attaches the bearer access token for authenticated requests
- refreshes expired sessions with `/auth/refresh`
- retries authenticated requests once after a `401`
- clears local auth state when refresh fails
- throws `ApiError` with HTTP status and backend response body

Public requests can opt out of authentication:

```ts
authenticated: false;
```

## Testing

Vitest runs in the `jsdom` environment with Testing Library matchers.

Current tests cover:

- login and registration pages
- service form and service catalog page
- vehicle form and vehicle management page
- appointment form and appointment administration page
- new reservation flow
- edit reservation flow
- reservation list and reservation details
- pending reservation processing
- appointment change proposal UI
- notifications page

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Formatting And Checks

Prettier is configured with:

- semicolons
- double quotes
- 4-space indentation
- trailing commas

Recommended verification before submitting work:

```bash
npm run check
```
