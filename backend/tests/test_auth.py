from __future__ import annotations

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.models import User


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_register_returns_public_user(client: TestClient, register_user) -> None:
    user = register_user(email="alice@example.com")

    assert user["email"] == "alice@example.com"
    assert user["role"] == "buyer"
    assert "id" in user
    assert "hashed_password" not in user
    assert "password" not in user


def test_password_is_hashed_in_database(client: TestClient, register_user) -> None:
    register_user(email="hash@example.com", password="supersecret123")

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == "hash@example.com").one()

    assert user.hashed_password != "supersecret123"
    assert user.hashed_password.startswith("$2")


def test_duplicate_email_is_rejected(client: TestClient, register_user) -> None:
    register_user(email="duplicate@example.com")

    response = client.post(
        "/api/auth/register",
        json={
            "name": "Someone Else",
            "email": "duplicate@example.com",
            "phone_number": "9811111111",
            "role": "buyer",
            "password": "password123",
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered"


def test_short_password_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Short Pass",
            "email": "short@example.com",
            "phone_number": "9800000000",
            "role": "buyer",
            "password": "short",
        },
    )

    assert response.status_code == 422


def test_login_and_me(client: TestClient, register_user, auth_headers) -> None:
    register_user(email="login@example.com", name="Login User")

    response = client.get("/api/auth/me", headers=auth_headers("login@example.com"))

    assert response.status_code == 200
    body = response.json()
    assert body["email"] == "login@example.com"
    assert body["name"] == "Login User"


def test_login_wrong_password_is_rejected(client: TestClient, register_user) -> None:
    register_user(email="wrong@example.com")

    response = client.post(
        "/api/auth/login",
        json={"email": "wrong@example.com", "password": "not-the-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid credentials"


def test_me_requires_a_token(client: TestClient) -> None:
    response = client.get("/api/auth/me")
    assert response.status_code in (401, 403)


def test_me_rejects_invalid_token(client: TestClient) -> None:
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert response.status_code == 401
