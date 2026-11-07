from __future__ import annotations

from fastapi.testclient import TestClient

from tests.test_properties import create_property


def test_buyer_can_add_list_and_remove_favourite(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")
    register_user(email="buyer@example.com", role="buyer")
    buyer_headers = auth_headers("buyer@example.com")

    property_body = create_property(client, auth_headers("seller@example.com"))
    property_id = property_body["id"]

    added = client.post(f"/api/favourites/{property_id}", headers=buyer_headers)
    assert added.status_code == 201
    assert added.json()["property_id"] == property_id

    listed = client.get("/api/favourites", headers=buyer_headers)
    assert [f["property_id"] for f in listed.json()] == [property_id]

    properties = client.get("/api/favourites/properties", headers=buyer_headers)
    assert [p["id"] for p in properties.json()] == [property_id]

    removed = client.delete(f"/api/favourites/{property_id}", headers=buyer_headers)
    assert removed.status_code == 204

    empty = client.get("/api/favourites", headers=buyer_headers)
    assert empty.json() == []


def test_adding_the_same_favourite_twice_is_idempotent(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")
    register_user(email="buyer@example.com", role="buyer")
    buyer_headers = auth_headers("buyer@example.com")
    property_id = create_property(client, auth_headers("seller@example.com"))["id"]

    client.post(f"/api/favourites/{property_id}", headers=buyer_headers)
    client.post(f"/api/favourites/{property_id}", headers=buyer_headers)

    listed = client.get("/api/favourites", headers=buyer_headers)
    assert len(listed.json()) == 1


def test_users_cannot_see_or_delete_each_others_favourites(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")
    register_user(email="buyer-one@example.com", role="buyer")
    register_user(email="buyer-two@example.com", role="buyer")
    buyer_one = auth_headers("buyer-one@example.com")
    buyer_two = auth_headers("buyer-two@example.com")

    property_id = create_property(client, auth_headers("seller@example.com"))["id"]
    client.post(f"/api/favourites/{property_id}", headers=buyer_one)

    assert client.get("/api/favourites", headers=buyer_two).json() == []
    assert client.get("/api/favourites/properties", headers=buyer_two).json() == []

    delete_attempt = client.delete(
        f"/api/favourites/{property_id}", headers=buyer_two
    )
    assert delete_attempt.status_code == 404

    # Buyer one's favourite is untouched.
    assert len(client.get("/api/favourites", headers=buyer_one).json()) == 1


def test_seller_cannot_use_favourites(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")

    response = client.get(
        "/api/favourites", headers=auth_headers("seller@example.com")
    )

    assert response.status_code == 403


def test_favouriting_unknown_property_returns_404(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="buyer@example.com", role="buyer")

    response = client.post(
        "/api/favourites/999999",
        headers=auth_headers("buyer@example.com"),
    )

    assert response.status_code == 404


def test_removing_unknown_favourite_returns_404(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="buyer@example.com", role="buyer")

    response = client.delete(
        "/api/favourites/999999",
        headers=auth_headers("buyer@example.com"),
    )

    assert response.status_code == 404
