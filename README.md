# Fortsolar Store WebApp

Fortsolar Store WebApp is the customer-facing commerce frontend for browsing solar products and packages, managing account sessions, and moving through store workflows such as favorites, cart, checkout, and account settings.

## Highlights

- Customer authentication with signed session cookies and refresh handling
- Email/password registration and optional Google sign-in
- Product and package catalog normalized from backend inventory endpoints
- Dedicated store routes for dashboard, products, packages, favorites, cart, checkout, and settings
- Shared API proxy for secure browser access to backend endpoints

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- React Hook Form + Zod
- Zustand
- Jest + ESLint

## Application Architecture

- `app/(onboarading_pages)` contains public auth routes such as login, signup, password reset, and verification.
- `app/store` contains the customer store experience.
- `app/api/auth/*` manages login, logout, refresh, registration, and Google auth.
- `app/api/proxy/[...endpoint]` forwards authenticated and anonymous API requests to the backend.
- `lib/store-catalog.ts` normalizes products and packages returned by the Fortsolar API into frontend-friendly catalog models.
- `components/features/pages` contains dashboard, package, product, and store-specific page UIs.

## Functional Coverage

The current app includes:

- account sign up, sign in, verification, forgot password, and reset password routes
- store dashboard routing
- product and package catalog pages
- product and package detail navigation
- favorites, cart, and checkout routes
- account settings and session persistence

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Access to the Fortsolar backend API

## Local Development

1. Copy the sample environment file:

   ```bash
   cp env.example .env.local
   ```

2. Update the values for your environment.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3226`.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `FORTSOLAR_API_BASE_URL` | Yes | Server-side Fortsolar API base URL. |
| `NEXT_PUBLIC_FORTSOLAR_API_BASE_URL` | Yes | Public API base URL used by browser-side flows. |
| `FORTSOLAR_STORE_SESSION_SECRET` | Yes | Secret used to sign store session cookies. Use a long random value. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Enables Google sign-in when provided. |

Compatibility note: the app also supports `NEXT_PUBLIC_BASE_URL`, `FORTSOLAR_SESSION_SECRET`, and `NEXT_PUBLIC_FORTSOLAR_SESSION_SECRET` as fallbacks in parts of the runtime. Prefer the store-specific variables above in production.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server on port `3226`. |
| `npm run build` | Build the production bundle. |
| `npm run start` | Start the production server. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run Jest tests once. |
| `npm run test:watch` | Run Jest in watch mode. |

## Directory Overview

```text
app/
  (onboarading_pages)/ Public auth routes
  store/               Customer store routes
  api/                 Auth and backend proxy routes
components/
  auth/                Session provider and auth plumbing
  features/pages/      Dashboard, product, package, and store screens
lib/
  api/                 Shared request helpers
  auth/                Cookie sessions and refresh flow
  store-catalog.ts     Catalog normalization and data loading
types/
  api.types.ts         Shared API contracts
```

## Quality Checks

Run these before shipping:

```bash
npm run lint
npm test
npm run build
```

## Deployment Notes

- Deploy as a standard Next.js server application.
- Set the server and public API base URLs to the same backend origin unless you have a deliberate split between browser and server traffic.
- Keep the store session secret server-only and rotate it through your deployment platform.
- Google sign-in should only be enabled after the correct callback origins and client credentials are configured.
