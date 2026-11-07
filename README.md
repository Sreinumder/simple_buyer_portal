# Buyer Portal

[![CI](https://github.com/Sreinumder/simple_buyer_portal/actions/workflows/ci.yml/badge.svg)](https://github.com/Sreinumder/simple_buyer_portal/actions/workflows/ci.yml)

A small property listing app I built to practise authentication and
authorization. Buyers browse listings and save favourites. Sellers create and
manage their own listings.

The API is FastAPI with SQLAlchemy and SQLite. The frontend is React and
TypeScript, built with Vite.

## What it does

- Register and log in. Passwords are hashed with bcrypt and the API returns
  JWTs that expire.
- Sellers can create a listing, edit it, and delete it. They only see their own
  listings.
- Buyers can see every listing, open a detail page, and add or remove
  favourites. Favourites are always filtered by the logged-in user.
- Listings can be searched by name, location, or description, filtered by price,
  and sorted by date or price.
- Each listing can have a photo URL. No upload service is included.
- Deleting a listing also removes the favourites that point to it.

The role checks happen in the API. The frontend hides buttons, but it is not
the security boundary.

## Running it

You need Python 3.11+, Node 18+, and pnpm.

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

The database is created on startup at `backend/buyer_portal.db`. Swagger is at
<http://127.0.0.1:8000/docs>.

Frontend, in another terminal:

```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:5173>. Register a seller, create a listing, then
register a buyer in a private window and try the favourites flow.

If you have a database from an older checkout, delete `backend/buyer_portal.db`
before starting. There is no migration setup, so the new columns will not be
added to an existing file.

## Configuration

Backend variables live in `backend/.env`:

- `SECRET_KEY` signs the JWTs. Set a real random value outside local dev.
- `ACCESS_TOKEN_EXPIRE_MINUTES` defaults to 60.
- `DATABASE_URL` defaults to the SQLite file above.
- `CORS_ORIGINS` is a comma-separated list of allowed origins.

The frontend reads `VITE_API_BASE_URL`, which defaults to
`http://127.0.0.1:8000/api`.

## API

All routes are under `/api`.

| Method | Route | Who |
| --- | --- | --- |
| `GET` | `/health` | anyone |
| `POST` | `/auth/register` | anyone |
| `POST` | `/auth/login` | anyone |
| `GET` | `/auth/me` | logged in |
| `GET` | `/properties` | logged in |
| `POST` | `/properties` | sellers |
| `GET` | `/properties/{id}` | logged in, sellers only for their own |
| `PATCH` | `/properties/{id}` | the seller who owns it |
| `DELETE` | `/properties/{id}` | the seller who owns it |
| `GET` | `/favourites` | buyers |
| `GET` | `/favourites/properties` | buyers |
| `POST` | `/favourites/{property_id}` | buyers |
| `DELETE` | `/favourites/{property_id}` | buyers |

`GET /properties` accepts `q`, `min_price`, `max_price`, and `sort`
(`newest`, `price_asc`, `price_desc`).

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
ruff check .
```

The 32 API tests use a temporary SQLite file and do not need a running server.
They cover registration, password hashing, duplicate emails, login failures,
expired or invalid tokens, seller-only writes, listing ownership, search and
price filters, favourites, cross-user isolation, and cascading deletes.

Frontend checks:

```bash
cd frontend
pnpm lint
pnpm build
```

Both run in GitHub Actions along with the backend tests on Python 3.11 and
3.12.

## Notes

Users pick their own role at registration. A real product would verify sellers
and assign roles on the server. Tokens are stored in `localStorage` with a
session-storage fallback, which is fine for a demo but not the safest choice
for a production app.
