# Learn Smart — Frontend (Step 1: Auth + Protected Routing)

React + Vite + Redux Toolkit (RTK Query) + Tailwind CSS + MSW.

Everything in this step was verified with real Playwright browser tests
against a running dev server — not just "should work" — see the bottom of
this file for exactly what was checked.

---

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # defaults are already correct for mock mode
npm run dev
```

Open `http://localhost:5173`. You'll land on `/login`.

**Demo accounts (mock mode):**
| Role    | Email                          | Password    |
|---------|--------------------------------|-------------|
| Teacher | anita.iyer@greenwood.edu       | password123 |
| Teacher | vikram.rao@greenwood.edu       | password123 |
| Student | rahul.sharma@example.com       | password123 |
| Student | meera.nair@example.com         | password123 |

(Also shown directly on the login page.)

---

## How mock mode works

Everything hinges on one env var in `.env`:

```
VITE_USE_MOCKS=true
```

When `true`, `main.jsx` starts an MSW service worker before the app
renders. The worker intercepts every `/api/v1/...` request made by RTK
Query and routes it to a handler in `src/mocks/handlers/`, which reads
and writes fake data in `src/mocks/data/`. No component, hook, or RTK
Query slice knows or cares that this is happening — they're written
exactly as they will be against the real backend.

### Flipping to the real backend later

```
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

That's it — no component changes. Two things to know:

1. **CORS**: with mocks off, requests go directly to the Django server's
   own origin, so `django-cors-headers` on the backend needs
   `CORS_ALLOWED_ORIGINS` to include `http://localhost:5173` (already in
   the backend's `.env.example` from Module A).
2. In mock mode specifically, `apiSlice.js` forces the RTK Query base URL
   to a **relative** path (`/api/v1`) rather than `VITE_API_BASE_URL`.
   This isn't a workaround to remove later — it's required because MSW's
   browser worker only intercepts same-origin requests (a relative path
   resolves against the page's own origin; an absolute URL to a different
   port bypasses the worker entirely). Real mode uses the absolute URL
   normally. You don't need to touch this — it's automatic based on
   `VITE_USE_MOCKS`.

---

## Project structure (relevant to this step)

```
src/
  app/store.js              Redux store
  store/api/apiSlice.js     Root RTK Query slice + auto token-refresh-on-401
  store/api/authApi.js      Auth endpoints (register/login/logout/me)
  store/slices/authSlice.js Client-side session state
  hooks/useAuth.js          Session bootstrap + login/logout
  routes/ProtectedRoute.jsx Redirects to /login if not authenticated
  routes/RoleRoute.jsx      Redirects to the user's own dashboard if wrong role
  features/auth/            Login + Register pages
  features/teacher/dashboard/  Placeholder landing page (Step 2 builds here)
  features/student/dashboard/  Placeholder landing page (Step 3 builds here)
  components/ui/            Button, Input, Badge, Spinner, Modal, Table
  components/layout/        Navbar, Sidebar, TeacherLayout, StudentLayout
  components/feedback/      LoadingState, EmptyState, ErrorState, ErrorBoundary
  mocks/
    data/users.js           Seed accounts (the only place mock user data lives)
    data/session.js         Fake-JWT issuance/validation (self-contained tokens)
    handlers/authHandlers.js  MSW handlers for all 5 auth endpoints
    browser.js               MSW worker setup
```

Sidebar nav items for modules that don't exist yet (Classes, Materials, AI
Insights, etc.) are visibly present but greyed out with a "Module B" /
"Module E" tag — so the shared layout primitive is already proven out
before those pages are built, per the brief.

---

## API contract implemented in this step

Matches the real Module A backend exactly:

| Endpoint | Method | Notes |
|---|---|---|
| `/api/v1/auth/register/` | POST | Teacher/admin only — student role returns a field error |
| `/api/v1/auth/login/` | POST | Returns `{ access, refresh, user }` |
| `/api/v1/auth/token/refresh/` | POST | Used automatically by `apiSlice.js` on any 401 |
| `/api/v1/auth/logout/` | POST | Blacklists the refresh token |
| `/api/v1/auth/me/` | GET / PATCH | `role` is read-only, silently stripped on PATCH |

Error shapes match the real backend's custom exception handler:
- Field validation: `{ "error": { "detail": { "field": ["message"] }, "status_code": 400 } }`
- Simple errors: `{ "detail": "message" }`

---

## Known mock-only limitations (won't matter once real backend is wired)

- Registered users and their data live in a plain in-memory array
  (`mocks/data/users.js`). They persist across client-side (SPA) navigation
  within the same page load, but **reset on a hard page reload** — this
  matches how any mock without a real database would behave, and doesn't
  affect the tested flows (which navigate via React Router, not hard reloads).
- Access/refresh tokens, by contrast, **do** survive a hard reload — they're
  self-contained (the user id is encoded directly in the token string,
  similar to how a real JWT payload works) specifically so the
  "stay logged in after refreshing the page" flow could be tested honestly.

---

## What was actually verified (Playwright, against a live dev server)

1. Visiting `/` while logged out redirects to `/login`
2. Visiting a protected route (`/teacher`) while logged out redirects to `/login`
3. Wrong password shows an inline error, stays on `/login`
4. Correct teacher login redirects to `/teacher`, dashboard shows the real name
5. Sidebar renders teacher nav with future-module items visibly disabled
6. Navbar shows the logged-in user's name and role badge
7. **Reloading the page keeps the session** (token persists, `/auth/me/` re-validates it)
8. Logout redirects to `/login`; a student login redirects to `/student`;
   a student manually navigating to `/teacher` is redirected back to `/student`
9. Register: success message + redirect to login; duplicate email shows a
   field-level error
10. Mobile viewport (390×844): login page, dashboard, and the mobile
    sidebar drawer (hamburger menu) all render correctly

One real bug was caught and fixed during this verification: the initial
mock token store used in-memory Maps, which reset on a full page reload
even though `localStorage` didn't — meaning "stay logged in after
refresh" silently failed. Fixed by making tokens self-contained instead
of relying on server-side-style session lookups.

`npm run build` and `npm run lint` (oxlint) both pass clean.

---

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server on :5173
npm run build     # production build
npm run lint      # oxlint
npm run preview   # preview the production build locally
```
