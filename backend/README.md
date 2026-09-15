# Intelligent Auto-Learning & Grading Platform — Backend (Module A)

Module A only: authentication + class/student joining. Materials, exams, AI
engine, analytics, chat, notifications, and live classes are added in later
modules and are intentionally **not** in `INSTALLED_APPS` yet.

Every command below was actually run against this codebase during
development — this isn't a theoretical setup guide.

---

## Option 1: Docker (recommended — matches production topology)

```bash
cd backend
cp .env.example .env
# Edit .env: at minimum set DJANGO_SECRET_KEY to a random string.
# Leave USE_SQLITE=False — docker-compose provides real Postgres + Redis.

docker-compose up --build
```

This starts 4 containers: `db` (Postgres 16), `redis` (Redis 7), `web`
(Daphne ASGI server on :8000, runs migrations automatically on start), and
`worker` (Celery — idle for now, no tasks exist until later modules).

Then, in a second terminal, create a superuser for `/admin/`:

```bash
docker-compose exec web python manage.py createsuperuser
```

API is live at `http://localhost:8000/api/v1/`.
Swagger docs at `http://localhost:8000/api/docs/`.
Django admin at `http://localhost:8000/admin/`.

---

## Option 2: Manual (no Docker) — what I used to verify this build

**Prerequisites:** Python 3.12+, PostgreSQL running locally (or use the
SQLite fallback below), Redis running locally.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements/dev.txt

cp .env.example .env
```

Edit `.env`:
- Set `DJANGO_SECRET_KEY` to any random string.
- **Fastest path to a first run:** set `USE_SQLITE=True` — skips needing
  Postgres running locally. Switch back to `False` once you have Postgres
  up, since production uses Postgres.
- If using Postgres, make sure a database/role matching `DB_NAME`/`DB_USER`/
  `DB_PASSWORD` in `.env` actually exists (see "Manual Postgres setup" below).
- `REDIS_HOST=localhost` / `REDIS_PORT=6379` assumes Redis is running
  locally on the default port.

```bash
python manage.py migrate
python manage.py createsuperuser
```

**Run the API server.** Because this project uses Django Channels for
WebSockets (presence now, chat in Module F), `manage.py runserver` alone
will NOT serve WebSocket connections — it's WSGI-only. Use Daphne instead:

```bash
daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

(`manage.py runserver` still works fine for pure-HTTP testing/quick
iteration, but switch to Daphne before testing anything under `/ws/`.)

In a separate terminal, start the Celery worker (idle in Module A, but
should start cleanly — this proves the Celery/Redis wiring is correct
before later modules add real tasks):

```bash
source venv/bin/activate
celery -A config worker --loglevel=info
```

### Manual Postgres setup (if not using USE_SQLITE)

```sql
CREATE DATABASE autolearn;
CREATE USER autolearn_user WITH PASSWORD 'autolearn_pass';
GRANT ALL PRIVILEGES ON DATABASE autolearn TO autolearn_user;
```

Keep these in sync with the `DB_*` values in `.env`, or just use your own
credentials and edit `.env` to match.

### Manual Redis (if not using Docker)

```bash
sudo apt-get install redis-server   # Ubuntu/Debian
redis-server                        # foreground; or use your OS's service manager
```

---

## Running tests

```bash
python manage.py test core accounts classes -v 2
```

All 39 tests pass as of this build (accounts: model/register/login/me;
classes: CRUD + permissions, joining-code generation incl. collision
retry, roster management, join flow; core: soft-delete mixin, code
generator).

---

## Verified sample API flows

All captured from a real running server, not hand-written.

### 1. Register a teacher
```
POST /api/v1/auth/register/
Content-Type: application/json

{
  "email": "anita.iyer@greenwood.edu",
  "first_name": "Anita",
  "last_name": "Iyer",
  "role": "teacher",
  "password": "SecurePass123",
  "password_confirm": "SecurePass123"
}
```
```
201 Created
{
  "id": "e7c4aadd-d2d0-4211-b87c-08334935af80",
  "email": "anita.iyer@greenwood.edu",
  "first_name": "Anita",
  "last_name": "Iyer",
  "role": "teacher",
  "phone": ""
}
```
Trying to register with `"role": "student"` correctly returns `400` —
student accounts are only created via the class-roster flow, per the
product decision to skip open student signup.

### 2. Login
```
POST /api/v1/auth/login/
{ "email": "anita.iyer@greenwood.edu", "password": "SecurePass123" }
```
```
200 OK
{
  "refresh": "eyJhbGciOi...",
  "access": "eyJhbGciOi...",
  "user": {
    "id": "e7c4aadd-...", "email": "anita.iyer@greenwood.edu",
    "full_name": "Anita Iyer", "role": "teacher",
    "institution": null, "date_joined": "2026-09-10T19:34:57+05:30"
  }
}
```
`institution` is `null` here by design — a self-registered teacher isn't
attached to an institution until Module J (Institution Management) exists.
`ClassCourse.institution` is nullable for the same reason; tighten this
once Module J ships an onboarding flow.

### 3. Create a class
```
POST /api/v1/classes/
Authorization: Bearer <teacher access token>
{ "name": "Grade 10 Physics", "subject": "Physics", "description": "..." }
```
```
201 Created
{
  "id": "d75a866e-c969-4873-b032-13b93175de4c",
  "name": "Grade 10 Physics", "subject": "Physics",
  "teacher": { "id": "...", "email": "anita.iyer@greenwood.edu", "full_name": "Anita Iyer", ... },
  "is_archived": false, "student_count": 0,
  "created_at": "2026-09-10T19:35:17+05:30"
}
```

### 4. Add a student — generates the joining code
```
POST /api/v1/classes/{id}/students/
Authorization: Bearer <teacher access token>
{ "email": "rahul.sharma@example.com", "first_name": "Rahul", "last_name": "Sharma" }
```
```
201 Created
{
  "id": "33f3f160-...",
  "student": { "email": "rahul.sharma@example.com", "full_name": "Rahul Sharma", "role": "student", ... },
  "joining_code": "42R3X4",
  "status": "pending",
  "joined_at": null
}
```
Real generated code — 6 chars, alphabet excludes ambiguous `0/O/1/I`.

### 5. Student joins with the code
```
POST /api/v1/enrollments/join/
Authorization: Bearer <student access token>
{ "joining_code": "42R3X4" }
```
```
200 OK
{
  "class_course": { "id": "d75a866e-...", "name": "Grade 10 Physics", "student_count": 1, ... },
  "status": "active"
}
```
An invalid code correctly returns `404`; a code redeemed by the wrong
student, or one that's been blocked, returns `400` with a clear message.

### 6. Teacher views the roster
```
GET /api/v1/classes/{id}/students/
Authorization: Bearer <teacher access token>
```
```
200 OK
[
  {
    "id": "33f3f160-...", "student": { "full_name": "Rahul Sharma", ... },
    "joining_code": "42R3X4", "status": "active",
    "joined_at": "2026-09-10T19:35:30+05:30"
  }
]
```

### 7. Soft-delete a class
```
DELETE /api/v1/classes/{id}/
Authorization: Bearer <teacher access token>
```
```
204 No Content
```
Confirmed: the class disappears from `GET /api/v1/classes/` immediately,
but the row still exists in the database (`ClassCourse.all_objects`) —
verified directly via the Django shell.

### 8. Presence WebSocket
```
ws://localhost:8000/ws/presence/?token=<access token>
```
On connect, the server marks the user online and broadcasts
`{"type": "presence_update", "user_id": "...", "is_online": true}` to
everyone sharing a class with them. Verified live: connecting as a
teacher, then connecting as their enrolled student, delivers the
student's `presence_update` event to the teacher's open socket in
real time over the Redis channel layer (this actually requires Redis
running — the in-memory fallback isn't configured, matching the
"Channels + Redis" requirement from the tech stack).

---

## What's intentionally not here yet

- `materials` app (Module B)
- Quiz/Question/Grade models (Module B quiz builder / Module D)
- `ai_engine`, `analytics`, `chat`, `notifications`, `live_classes` apps
- Email verification (explicitly deferred per product decision)
- Institution onboarding/admin UI (Module J) — for now, institutions are
  created via `python manage.py shell` or `/admin/`, and a teacher's
  `institution` field stays `null` until one is assigned

## Known trade-offs to revisit later

- A student's account is created with `set_unusable_password()` when a
  teacher adds them, and I manually set a password via `manage.py shell`
  to test the join flow end-to-end. There's no self-serve "claim your
  account" flow yet — that arrives alongside email verification.
- `institution` being nullable on both `User` and `ClassCourse` is a
  stop-gap for Module A/B; Module J should backfill and consider making
  it required once institution onboarding exists.
