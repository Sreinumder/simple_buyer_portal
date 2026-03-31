# Simple Buyer Portal - Take-Home Assessment

This project is a minimal full-stack implementation for the TechKraft Junior Full-Stack Engineer take-home assignment.

Stack:

- Frontend: React + TypeScript + Vite (package manager: pnpm)
- Backend: FastAPI + SQLAlchemy + SQLite (Python virtual environment)

If you want deep implementation rationale (why each command, why pnpm, why each backend package), read:

- `documentation.md`

## Project Goals

This app is designed to satisfy these requirements:

1. User registration and login with secure password storage.
2. Authenticated buyer dashboard.
3. Per-user favourites list (add/remove properties).
4. User isolation so users can only access their own favourites.
5. Basic validation and error handling.

## Current Project Structure

```text
simple_buyer_portal/
  backend/
    app/
      api/
      main.py
    requirements.txt
    .env.example
  frontend/
    src/
    package.json
```

## Quick Start

### 1. Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs at:

- http://localhost:5173

### 2. Backend

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
cd backend
uvicorn app.main:app --reload --port 8000
```

Backend runs at:

- http://127.0.0.1:8000
- health check: http://127.0.0.1:8000/api/health
- interactive API docs: http://127.0.0.1:8000/docs

## Environment Variables

Create `backend/.env` from `backend/.env.example` and set:

```env
SECRET_KEY=replace-with-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite:///./buyer_portal.db
```

## Development Workflow

1. Start backend first.
2. Start frontend.
3. Implement backend APIs in small vertical slices:

- register
- login
- get current user
- list favourites
- add favourite
- remove favourite

4. Integrate frontend UI after each backend slice.

## Suggested Submission Checklist

1. Registration works and prevents duplicate email.
2. Login returns token/session and rejects wrong password.
3. Dashboard shows user name and role.
4. Favourites can be added/removed.
5. User A cannot access User B favourites.
6. Error messages are readable and actionable.
7. README includes run instructions and sample flow.

## Example End-to-End Flow (Target)

1. Sign up with name, email, password.
2. Login with email/password.
3. Open dashboard.
4. Like a property.
5. Verify property appears in "My Favourites".
6. Unlike property and verify removal.

## Notes

- Do not store raw passwords.
- Use hashed passwords (`passlib` + `bcrypt`).
- Keep auth checks on server side (frontend checks alone are not enough).
- Scope all favourites queries by authenticated user id.
