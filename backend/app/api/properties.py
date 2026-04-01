from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database import get_db
from app.models import Property, User, UserRole
from app.schemas import PropertyCreateRequest, PropertyOut

router = APIRouter(prefix="/properties", tags=["properties"])


@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
def create_property(
    payload: PropertyCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Property:
    if current_user.role != UserRole.SELLER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can create properties",
        )

    item = Property(
        name=payload.name,
        description=payload.description,
        location=payload.location,
        price=payload.price,
        created_by_id=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=list[PropertyOut])
def list_properties(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Property]:
    query = db.query(Property)

    if current_user.role == UserRole.SELLER:
        query = query.filter(Property.created_by_id == current_user.id)

    return query.order_by(Property.created_at.desc()).all()
