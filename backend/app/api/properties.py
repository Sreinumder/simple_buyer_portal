from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Property
from app.schemas import PropertyCreateRequest, PropertyOut

router = APIRouter(prefix="/properties", tags=["properties"])


@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
def create_property(payload: PropertyCreateRequest, db: Session = Depends(get_db)) -> Property:
    item = Property(name=payload.name, description=payload.description)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=list[PropertyOut])
def list_properties(db: Session = Depends(get_db)) -> list[Property]:
    return db.query(Property).order_by(Property.created_at.desc()).all()
