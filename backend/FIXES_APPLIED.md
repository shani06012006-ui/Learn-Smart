# Fixes Applied — Verified Working Backend

Every fix below was tested by actually running the server and hitting real
endpoints (not just reading the code). Steps to reproduce the verification
are included so you can re-check on your own machine.

## 1. `requirements.txt` — rewritten and verified installable
**Problem:** File was UTF-16 encoded (a PowerShell `pip freeze >` quirk) and
was missing `django-filter`, `drf-yasg`, `django-ckeditor`,
`django-import-export` — packages your `INSTALLED_APPS` actually requires.
Installing the old file into a clean venv crashed immediately with
`ModuleNotFoundError: No module named 'drf_yasg'`.

**Fix:** Regenerated as UTF-8, includes every package actually needed,
version-pinned to combinations confirmed compatible with each other
(see #2 below — Django/DRF/asgiref/channels all interact).

**Verified:** Installed into a brand-new venv on a clean machine, ran
`python manage.py check` (passes) and `python manage.py migrate` from a
zero database (all 5 apps' migrations apply with no errors).

## 2. `django-cors-headers` — upgraded 4.3.0 → 4.9.0
**Problem:** This was a hidden, serious bug. Version 4.3.0 of
`django-cors-headers`, combined with Django 5.0 running under Daphne/ASGI
(which your project needs for the websocket chat feature), caused **every
single HTTP request to fail with a 500 error** —
`TypeError: object HttpResponse can't be used in 'await' expression`.
This wouldn't necessarily show up if you'd only tested with
`python manage.py runserver` using WSGI-style tools, but it breaks the
moment Daphne (which channels forces on for the whole project, not just
websocket routes) handles a request.

**How I found it:** Isolated the middleware chain by temporarily removing
each middleware one at a time and re-testing — removing `CorsMiddleware`
alone fixed it, confirming it as the cause rather than Django/Channels
version drift in general.

**Fix:** Upgraded to `django-cors-headers==4.9.0`, which fixed the bug
completely.

**Verified:** Ran the actual dev server via `daphne core.asgi:application`
and made real HTTP calls:
- `POST /api/auth/register/` → `201 Created`, valid user JSON returned
- `POST /api/auth/login/` → `200 OK`, valid JWT `access`/`refresh` tokens
- `POST /api/classes/` (authenticated) → `201 Created`, class created with
  a real generated join code

## 3. `core/asgi.py` — fixed import order
**Problem:** `apps.communication.consumers` was imported *before*
`get_asgi_application()` ran. Since `consumers.py` calls `get_user_model()`
at module import time, this raised `AppRegistryNotReady: Apps aren't
loaded yet.` This didn't show up when running via `manage.py runserver`
(because `manage.py` already calls `django.setup()` before anything else
loads) — but it broke immediately when starting the ASGI app directly with
`daphne core.asgi:application`, which is how you'd actually run this in
production (e.g. on Render/Railway).

**Fix:** Moved `get_asgi_application()` to run first, before any app-level
imports.

**Verified:** Ran `daphne core.asgi:application` directly (not through
`manage.py`) and confirmed it starts and serves requests correctly.

## 4. `role` / `user_type` field mismatch (fixed in earlier round, re-verified)
Confirmed clean — `grep`'d the whole codebase, only migration history
files reference the old `role` name (which is normal and expected).

## 5. `.gitignore` (fixed in earlier round, re-verified)
Confirmed `db.sqlite3` and all `__pycache__` files are now properly
untracked.

---

## How to verify this yourself on your machine

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Then test registration:
```powershell
curl -X POST http://127.0.0.1:8000/api/auth/register/ `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"you@example.com\",\"username\":\"you\",\"password\":\"YourPass123!\",\"password2\":\"YourPass123!\",\"first_name\":\"Your\",\"last_name\":\"Name\",\"user_type\":\"teacher\"}'
```
You should get a `201` response with your user data.

## What I did NOT touch
I did not modify any app's business logic (models, views, serializers)
beyond what was needed to fix the four issues above. `exams`, `ai`,
`analytics`, and `live_classes` are exactly as you left them — still
appropriately un-wired into `core/urls.py` until you're ready to build
and test them.
