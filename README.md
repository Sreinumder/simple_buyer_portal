# Simple Buyer Portal - Take-Home Assessment

This project is a minimal full-stack implementation for the TechKraft Junior Full-Stack Engineer take-home assignment.

Stack:

- Frontend: React + TypeScript + Vite (package manager: pnpm)
- Backend: FastAPI + SQLAlchemy + SQLite (Python virtual environment)

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

## Prerequisites

Before you begin, ensure these are installed on your system:

- **Python 3.8+** with `pip`
- **Node.js 18+** with `npm`
- **pnpm** (install globally: `npm install -g pnpm`)
- **sqlite3** (usually bundled with Python/OS)

**Verify your installation:**

```bash
python3 --version   # Should be 3.8 or higher
pip --version       # Should be present
node --version      # Should be 18+
npm --version       # Should be 8+
pnpm --version      # Should be 8+
```

If any are missing, install them for your OS:

- **macOS:** `brew install python3 node`
- **Ubuntu/Debian:** `sudo apt install python3 python3-pip nodejs`
- **Arch Linux:** `sudo pacman -S python nodejs`

Then install pnpm globally:

```bash
npm install -g pnpm
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start Backend Server

```bash
cd backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

Backend runs at:

- API: http://127.0.0.1:8000
- Health check: http://127.0.0.1:8000/api/health
- Interactive docs: http://127.0.0.1:8000/docs

**Database note:** The SQLite database is automatically created on first startup at `backend/app/buyer_portal.db`. No manual setup needed.

### 3. Frontend Setup (in a new terminal)

```bash
cd frontend
pnpm install
```

### 4. Start Frontend Dev Server

```bash
cd frontend
pnpm dev
```

Frontend runs at: http://localhost:5173

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
