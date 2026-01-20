# Nomadic Gym Life

Nomadic Gym Life is a mobile-first fitness tracker with preset workout plans, nutrition tracking, and an exercise library designed for van life and gym flexibility. It keeps training simple, structured, and easy to follow from any device.

## Developer Overview

The app is a React frontend backed by Sanity CMS. All create/update/delete actions run through Firebase Functions, while reads stay in the client. Hosting is on Firebase with `/api/**` rewrites to the functions service.

# Nomadic Gym Life — Dev Notes

These notes describe how to work with the root app, backend artifacts, Firebase Functions, and Sanity Studio.

## Root App (React)

### Local dev
1) Install dependencies
```bash
npm install
```

2) Set env vars
- `.env` (for production build values)
- `.env.development` (local dev, points API to Firebase emulator)

Example:
```
REACT_APP_SANITY_PROJECT_ID=...
REACT_APP_SANITY_DATASET=production
REACT_APP_SANITY_READ_TOKEN=...
REACT_APP_SANITY_API_VERSION=2024-01-01
```

```
REACT_APP_API_BASE=http://localhost:5001/nomadic-fitness/us-central1
```

3) Run the app
```bash
npm start
```

### Production build
```bash
npm run build
```

The build outputs to `build/`, and Firebase Hosting deploys that directory.

## Backend (OpenAPI + Mirage)

### OpenAPI
- Source of truth: `backend/openapi/openapi.yaml`
- Use this file for endpoint shapes and validation contracts.

### Mirage (local mock server)
- Files: `backend/mirage/server.ts`, `backend/mirage/seeds.ts`
- Use for local mock API when you are not running Firebase Functions.

## Firebase Functions (CUD + Sanity writes)

### Local dev
1) Install
```bash
cd functions
npm install
```

2) Env vars
Create `functions/.env`:
```
SANITY_PROJECT_ID=...
SANITY_DATASET=production
SANITY_WRITE_TOKEN=...
SANITY_API_VERSION=2024-01-01
```

3) Build
```bash
npm run build
```

4) Run emulators from repo root
```bash
firebase emulators:start
```

The app calls `/api/...` which routes to the `api` function via Hosting rewrites.

### Deploy Functions
```bash
firebase deploy --only functions
```

## Firebase Hosting

Hosting serves the React build and rewrites `/api/**` to the `api` function.

Deploy hosting:
```bash
firebase deploy --only hosting
```

Deploy both:
```bash
firebase deploy --only hosting,functions
```

## Sanity Studio

### Local dev
```bash
cd studio
npm install
npm run dev
```

### Schema
- Schemas live in `studio/schemaTypes/index.ts`
- Use these to keep Sanity in sync with `openapi.yaml` and the frontend data shape.

### Import data
There is a prepared import file at repo root:
- `sanity-import.ndjson`

Example import command (run from `studio/`):
```bash
npx sanity dataset import ../sanity-import.ndjson production --replace
```

## Notes
- `/api/**` is routed to Firebase Functions in production by `firebase.json`.
- Local dev uses `REACT_APP_API_BASE` to hit the Functions emulator directly.
