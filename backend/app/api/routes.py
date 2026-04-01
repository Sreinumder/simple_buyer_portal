from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.favourites import router as favourites_router
from app.api.properties import router as properties_router

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


router.include_router(auth_router)
router.include_router(properties_router)
router.include_router(favourites_router)
