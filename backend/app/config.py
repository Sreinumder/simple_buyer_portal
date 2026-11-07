from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent

# Load backend/.env for local development. Real deployments should set the
# variables in the process environment instead.
load_dotenv(BACKEND_DIR / ".env")


def _default_database_url() -> str:
    return f"sqlite:///{BACKEND_DIR / 'buyer_portal.db'}"


SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-change-me")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
DATABASE_URL = os.getenv("DATABASE_URL") or _default_database_url()

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
