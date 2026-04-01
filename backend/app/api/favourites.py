from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models import Favourite, Property, User
from app.schemas import FavouriteOut, PropertyOut

router = APIRouter(prefix="/favourites", tags=["favourites"])


@router.get("", response_model=list[FavouriteOut])
def list_my_favourites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Favourite]:
    return (
        db.query(Favourite)
        .filter(Favourite.user_id == current_user.id)
        .order_by(Favourite.created_at.desc())
        .all()
    )


@router.post("/{property_id}", response_model=FavouriteOut, status_code=status.HTTP_201_CREATED)
def add_favourite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Favourite:
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Property not found")

    existing = (
        db.query(Favourite)
        .filter(Favourite.user_id == current_user.id, Favourite.property_id == property_id)
        .first()
    )
    if existing:
        return existing

    fav = Favourite(user_id=current_user.id, property_id=property_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favourite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    fav = (
        db.query(Favourite)
        .filter(Favourite.user_id == current_user.id, Favourite.property_id == property_id)
        .first()
    )
    if not fav:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favourite not found")

    db.delete(fav)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/properties", response_model=list[PropertyOut])
def list_my_favourited_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Property]:
    return (
        db.query(Property)
        .join(Favourite, Favourite.property_id == Property.id)
        .filter(Favourite.user_id == current_user.id)
        .order_by(Favourite.created_at.desc())
        .all()
    )
