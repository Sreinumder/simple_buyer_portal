from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models import Property, User, UserRole
from app.schemas import PropertyCreateRequest, PropertyOut, PropertyUpdateRequest

router = APIRouter(prefix="/properties", tags=["properties"])


def ensure_seller(current_user: User) -> None:
    if current_user.role != UserRole.SELLER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can manage properties",
        )


def get_owned_property(property_id: int, db: Session, current_user: User) -> Property:
    prop = db.get(Property, property_id)
    if not prop or prop.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )
    return prop


@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: PropertyCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Property:
    ensure_seller(current_user)

    item = Property(
        name=payload.name,
        description=payload.description,
        location=payload.location,
        price=payload.price,
        image_url=payload.image_url,
        created_by_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=list[PropertyOut])
def list_properties(
    q: str | None = Query(default=None, max_length=100),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    sort: Literal["newest", "price_asc", "price_desc"] = "newest",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Property]:
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_price cannot be greater than max_price",
        )

    query = db.query(Property)

    if current_user.role == UserRole.SELLER:
        query = query.filter(Property.created_by_id == current_user.id)

    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Property.name.ilike(term),
                Property.location.ilike(term),
                Property.description.ilike(term),
            )
        )

    if min_price is not None:
        query = query.filter(Property.price >= min_price)
    if max_price is not None:
        query = query.filter(Property.price <= max_price)

    if sort == "price_asc":
        query = query.order_by(Property.price.asc(), Property.id.asc())
    elif sort == "price_desc":
        query = query.order_by(Property.price.desc(), Property.id.asc())
    else:
        query = query.order_by(Property.created_at.desc(), Property.id.desc())

    return query.all()


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Property:
    prop = db.get(Property, property_id)
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    # Sellers only work with their own listings; buyers can view any listing.
    if current_user.role == UserRole.SELLER and prop.created_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )
    return prop


@router.patch("/{property_id}", response_model=PropertyOut)
def update_property(
    property_id: int,
    payload: PropertyUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Property:
    ensure_seller(current_user)
    prop = get_owned_property(property_id, db, current_user)

    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if not changes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update",
        )

    for field, value in changes.items():
        setattr(prop, field, value)

    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    ensure_seller(current_user)
    prop = get_owned_property(property_id, db, current_user)

    db.delete(prop)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
