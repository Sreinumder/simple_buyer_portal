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


def test_buyer_can_view_property_detail(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")
    register_user(email="buyer@example.com", role="buyer")
    property_id = create_property(client, auth_headers("seller@example.com"))["id"]

    response = client.get(
        f"/api/properties/{property_id}", headers=auth_headers("buyer@example.com")
    )

    assert response.status_code == 200
    assert response.json()["id"] == property_id


def test_seller_cannot_view_another_sellers_property(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller-one@example.com", role="seller")
    register_user(email="seller-two@example.com", role="seller")
    property_id = create_property(client, auth_headers("seller-one@example.com"))["id"]

    response = client.get(
        f"/api/properties/{property_id}",
        headers=auth_headers("seller-two@example.com"),
    )

    assert response.status_code == 404


def test_unknown_property_returns_404(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="buyer@example.com", role="buyer")

    response = client.get(
        "/api/properties/999999", headers=auth_headers("buyer@example.com")
    )

    assert response.status_code == 404


def test_seller_can_update_own_property(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")
    headers = auth_headers("seller@example.com")
    property_id = create_property(client, headers)["id"]

    response = client.patch(
        f"/api/properties/{property_id}",
        json={"price": 9000000.0, "location": "Lalitpur", "image_url": "https://example.com/flat.jpg"},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["price"] == 9000000.0
    assert body["location"] == "Lalitpur"
    assert body["image_url"] == "https://example.com/flat.jpg"
    # Untouched fields keep their original values.
    assert body["name"] == PROPERTY["name"]


def test_buyer_cannot_update_or_delete_property(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")
    register_user(email="buyer@example.com", role="buyer")
    property_id = create_property(client, auth_headers("seller@example.com"))["id"]
    buyer_headers = auth_headers("buyer@example.com")

    update = client.patch(
        f"/api/properties/{property_id}",
        json={"price": 1.0},
        headers=buyer_headers,
    )
    delete = client.delete(f"/api/properties/{property_id}", headers=buyer_headers)

    assert update.status_code == 403
    assert delete.status_code == 403


def test_seller_cannot_update_another_sellers_property(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller-one@example.com", role="seller")
    register_user(email="seller-two@example.com", role="seller")
    property_id = create_property(client, auth_headers("seller-one@example.com"))["id"]

    response = client.patch(
        f"/api/properties/{property_id}",
        json={"price": 1.0},
        headers=auth_headers("seller-two@example.com"),
    )

    assert response.status_code == 404


def test_update_without_fields_returns_400(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")
    headers = auth_headers("seller@example.com")
    property_id = create_property(client, headers)["id"]

    response = client.patch(
        f"/api/properties/{property_id}", json={}, headers=headers
    )

    assert response.status_code == 400


def test_seller_can_delete_own_property_and_favourites(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")
    register_user(email="buyer@example.com", role="buyer")
    seller_headers = auth_headers("seller@example.com")
    buyer_headers = auth_headers("buyer@example.com")
    property_id = create_property(client, seller_headers)["id"]
    client.post(f"/api/favourites/{property_id}", headers=buyer_headers)

    response = client.delete(f"/api/properties/{property_id}", headers=seller_headers)

    assert response.status_code == 204
    assert client.get(f"/api/properties/{property_id}", headers=buyer_headers).status_code == 404
    assert client.get("/api/favourites", headers=buyer_headers).json() == []
    assert client.get("/api/favourites/properties", headers=buyer_headers).json() == []


def test_property_search_filters_and_sorting(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")
    register_user(email="buyer@example.com", role="buyer")
    seller_headers = auth_headers("seller@example.com")
    buyer_headers = auth_headers("buyer@example.com")

    create_property(client, seller_headers, name="Cheap Flat", location="Kathmandu", price=5000000.0)
    create_property(client, seller_headers, name="Family House", location="Lalitpur", price=15000000.0)
    create_property(client, seller_headers, name="Budget Room", location="Bhaktapur", price=2500000.0)

    search = client.get("/api/properties?q=lalitpur", headers=buyer_headers)
    assert [p["name"] for p in search.json()] == ["Family House"]

    price_range = client.get(
        "/api/properties?min_price=4000000&max_price=10000000", headers=buyer_headers
    )
    assert [p["name"] for p in price_range.json()] == ["Cheap Flat"]

    cheapest = client.get("/api/properties?sort=price_asc", headers=buyer_headers)
    assert [p["price"] for p in cheapest.json()] == [2500000.0, 5000000.0, 15000000.0]

    dearest = client.get("/api/properties?sort=price_desc", headers=buyer_headers)
    assert [p["price"] for p in dearest.json()] == [15000000.0, 5000000.0, 2500000.0]


def test_invalid_price_range_is_rejected(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="buyer@example.com", role="buyer")

    response = client.get(
        "/api/properties?min_price=100&max_price=10",
        headers=auth_headers("buyer@example.com"),
    )

    assert response.status_code == 400


def test_image_url_must_be_http(
    client: TestClient, register_user, auth_headers
) -> None:
    register_user(email="seller@example.com", role="seller")

    response = client.post(
        "/api/properties",
        json={**PROPERTY, "image_url": "not-a-url"},
        headers=auth_headers("seller@example.com"),
    )

    assert response.status_code == 422
