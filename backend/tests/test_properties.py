from __future__ import annotations

from fastapi.testclient import TestClient

PROPERTY = {
    "name": "Sunny Flat",
    "description": "Two bedrooms near the ring road.",
    "location": "Kathmandu",
    "price": 12500000.0,
}


def create_property(
    client: TestClient,
    headers: dict[str, str],
    **overrides: object,
) -> dict:
    response = client.post(
        "/api/properties",
        json={**PROPERTY, **overrides},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_seller_can_create_property(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")

    property_body = create_property(client, auth_headers("seller@example.com"))

    assert property_body["name"] == "Sunny Flat"
    assert property_body["created_by_id"] > 0


def test_buyer_cannot_create_property(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="buyer@example.com", role="buyer")

    response = client.post(
        "/api/properties",
        json=PROPERTY,
        headers=auth_headers("buyer@example.com"),
    )

    assert response.status_code == 403


def test_anonymous_cannot_create_property(client: TestClient) -> None:
    response = client.post("/api/properties", json=PROPERTY)
    assert response.status_code in (401, 403)


def test_invalid_property_is_rejected(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")

    response = client.post(
        "/api/properties",
        json={**PROPERTY, "price": 0},
        headers=auth_headers("seller@example.com"),
    )

    assert response.status_code == 422


def test_buyer_sees_all_properties_and_seller_sees_own(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller-one@example.com", role="seller")
    register_user(email="seller-two@example.com", role="seller")
    register_user(email="buyer@example.com", role="buyer")

    create_property(client, auth_headers("seller-one@example.com"), name="Flat One")
    create_property(client, auth_headers("seller-two@example.com"), name="Flat Two")

    seller_view = client.get(
        "/api/properties", headers=auth_headers("seller-one@example.com")
    )
    buyer_view = client.get(
        "/api/properties", headers=auth_headers("buyer@example.com")
    )

    assert seller_view.status_code == 200
    assert [p["name"] for p in seller_view.json()] == ["Flat One"]
    assert {p["name"] for p in buyer_view.json()} == {"Flat One", "Flat Two"}
