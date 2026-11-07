# Buyer Portal

[![CI](https://github.com/Sreinumder/simple_buyer_portal/actions/workflows/ci.yml/badge.svg)](https://github.com/Sreinumder/simple_buyer_portal/actions/workflows/ci.yml)

A full-stack real-estate portal with JWT authentication, buyer and seller roles,
property listings, and per-user favourites.

The point of the project is authorization: every favourite is scoped to the
authenticated user, seller-only actions are enforced on the server, and the
frontend never decides what a user is allowed to do.

## Features

- **Authentication** — register and log in with email and password; passwords
  are hashed with bcrypt, never stored or returned in plain text.
- **JWT access tokens** — signed with HS256 and an expiry; protected routes
  resolve the current user from the bearer token.
- **Buyer and seller roles** — sellers create listings and see only their own;
  buyers browse all listings and manage favourites.
- **Per-user favourites** — add or remove a property, list your favourites, and
  get the favourited properties. Queries are always filtered by user ID.
- **Validation and errors** — Pydantic request models, duplicate-email handling,
  clear 401/403/404/409 responses, and toast feedback in the UI.
- **Typed frontend** — React 19 + TypeScript with a shared API client, protected
  routes, loading states, and form validation.

## Stack

| Layer | Technology |
| --- | --- |
| Backend | FastAPI, SQLAlchemy 2, Pydantic 2, SQLite |
| Auth | python-jose (JWT), passlib + bcrypt |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Routing / UX | React Router 7, react-hot-toast |
| Tests | pytest, FastAPI TestClient, Ruff |
| CI | GitHub Actions (backend tests + lint, frontend lint + build) |

## Architecture

```
React SPA (Vite, :5173)
   │  fetch + Authorization: Bearer <JWT>
   ▼
FastAPI application (/api)
   ├── auth        register · login · me
   ├── properties  seller-only writes · role-filtered reads
   └── favourites  buyer-only · scoped by current user
   ▼
SQLAlchemy ORM ──► SQLite
```

Three tables:

- `users` — email, bcrypt hash, name, phone, role, unique email.
- `properties` — listing fields, `created_by_id`, timestamp.
- `favourites` — `(user_id, property_id)` with a unique constraint, timestamp.

## Quick start

Requirements: **Python 3.11+**, **Node 18+**, and **pnpm**.

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # set a real SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

- API: <http://127.0.0.1:8000>
- Swagger UI: <http://127.0.0.1:8000/docs>
- Health: <http://127.0.0.1:8000/api/health>

The SQLite database is created on startup at `backend/buyer_portal.db`.

### 2. Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local       # optional; defaults to the local API
pnpm dev
```

Open <http://localhost:5173>.

### Try the flow

1. Register a **seller** and create a property.
2. Log out, register a **buyer**, and log in.
3. Add the property to favourites and open **My favourites**.
4. Register a second buyer and confirm they cannot see the first buyer's list.

## Configuration

Backend (`backend/.env`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `SECRET_KEY` | `dev-only-change-me` | JWT signing key. Set a long random value. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Access-token lifetime. |
| `DATABASE_URL` | `sqlite:///backend/buyer_portal.db` | SQLAlchemy URL. |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed browser origins. |

Frontend (`frontend/.env.local`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api` | API base URL used by the client. |

## API

All routes are prefixed with `/api`.

| Method | Path | Auth | Role | Description |
| --- | --- | --- | --- | --- |
| `GET` | `/health` | — | any | Liveness probe. |
| `POST` | `/auth/register` | — | any | Create an account. Returns the public user. |
| `POST` | `/auth/login` | — | any | Exchange email/password for a JWT. |
| `GET` | `/auth/me` | Bearer | any | Current user profile. |
| `POST` | `/properties` | Bearer | seller | Create a listing. |
| `GET` | `/properties` | Bearer | any | Buyers see all listings; sellers see their own. |
| `GET` | `/favourites` | Bearer | buyer | Favourite rows for the current user. |
| `GET` | `/favourites/properties` | Bearer | buyer | Favourited property objects. |
| `POST` | `/favourites/{property_id}` | Bearer | buyer | Add a favourite (idempotent). |
| `DELETE` | `/favourites/{property_id}` | Bearer | buyer | Remove a favourite. |

Example:

```bash
# Register and log in
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Roj","email":"roj@example.com","phone_number":"9800000000","role":"buyer","password":"password123"}'

TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"roj@example.com","password":"password123"}' | jq -r .access_token)

curl http://127.0.0.1:8000/api/favourites -H "Authorization: Bearer $TOKEN"
```

## Security decisions

- Passwords are hashed with bcrypt; the response model exposes only public user
  fields.
- JWTs are signed with `SECRET_KEY` and carry an expiry. A missing, malformed, or
  expired token is rejected.
- Every favourites query includes `Favourite.user_id == current_user.id`, so a
  user cannot read or delete another user's data even with a valid ID.
- Role checks run on the server. Hiding a button in React is a UX choice, not a
  security boundary.
- A unique constraint on `(user_id, property_id)` keeps duplicate favourites out,
  and the add endpoint is idempotent.
- The duplicate-email race is caught as a database constraint violation and
  returned as `409`, not a `500`.

**Demo shortcut:** users choose their own role at registration. A real product
would verify sellers and provision roles server-side.

## Tests

Backend — 20 API tests, isolated SQLite file, no running server needed:

```bash
cd backend
pip install -r requirements-dev.txt
pytest
ruff check .
```

Covered: registration validation, password hashing, duplicate emails, login
failures, JWT-protected routes, seller-only creation, buyer/seller visibility,
favourites CRUD, idempotent adds, and cross-user isolation.

Frontend:

```bash
cd frontend
pnpm lint
pnpm build
```

## Project layout

```
backend/
  app/
    api/          auth, properties, favourites, router
    config.py     .env loading and settings
    database.py   engine, session, declarative base
    main.py       FastAPI app, CORS, lifespan
    models.py     users, properties, favourites
    schemas.py    request/response models
    security.py   bcrypt and JWT helpers
  tests/          API tests and fixtures
  requirements*.txt
frontend/
  src/
    components/   RequireAuth
    lib/          typed API client and token storage
    pages/        login, register, properties, favourites, new property
```

## What I'd do next

- Move to PostgreSQL with Alembic migrations.
- Replace long-lived bearer tokens with short-lived access tokens plus refresh
  tokens in `HttpOnly` cookies.
- Add property images, search, filtering, and pagination.
- Add seller verification and an admin approval step.
- Rate-limit login/registration and add account lockout.
- Add frontend component tests (Vitest + Testing Library) and a Playwright
  end-to-end flow.
- Containerize both services with Docker Compose.

## License

MIT — see [`LICENSE`](LICENSE).
