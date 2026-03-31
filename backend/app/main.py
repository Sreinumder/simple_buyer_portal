from fastapi import FastAPI

from app.api.routes import router as api_router

app = FastAPI(title="Simple Buyer Portal API", version="0.1.0")
app.include_router(api_router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Simple Buyer Portal API is running"}
