from __future__ import annotations

import os
import tempfile
from collections.abc import Generator
from pathlib import Path

import pytest

# Configure the app before importing it: tests use an isolated SQLite file and a
# throwaway signing key.
TEST_DIR = Path(tempfile.mkdtemp(prefix="buyer-portal-tests-"))
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DIR / 'test.db'}"
os.environ["SECRET_KEY"] = "test-secret-key-not-for-production"

from fastapi.testclient import TestClient  # noqa: E402

from app import models  # noqa: E402,F401
from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def register_user(client: TestClient):
    def _register(
        email: str = "buyer@example.com",
        role: str = "buyer",
        password: str = "password123",
        name: str = "Test User",
        phone_number: str = "9800000000",
    ) -> dict:
        response = client.post(
            "/api/auth/register",
            json={
                "name": name,
                "email": email,
                "phone_number": phone_number,
                "role": role,
                "password": password,
            },
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _register


@pytest.fixture()
def token_for(client: TestClient):
    def _token(email: str, password: str = "password123") -> str:
        response = client.post(
            "/api/auth/login",
            json={"email": email, "password": password},
        )
        assert response.status_code == 200, response.text
        return response.json()["access_token"]

    return _token


@pytest.fixture()
def auth_headers(token_for):
    def _headers(email: str, password: str = "password123") -> dict[str, str]:
        return {"Authorization": f"Bearer {token_for(email, password)}"}

    return _headers
