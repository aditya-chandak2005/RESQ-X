from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from backend.app.core.config import settings
from backend.app.db.init_db import init_database
from backend.app.api.endpoints import disasters, missions, intelligence, operations, incidents, geocoding

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables and baseline testbed data on startup
    init_database()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="Emergency Disaster Response, Damage Mapping & Rescue Intelligence Platform for Multimodal AI Hackathon 2026",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev and local demo access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "online",
        "platform": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "database": "connected",
        "version": "1.0.0"
    }

# Include API Routers
app.include_router(disasters.router, prefix=f"{settings.API_V1_STR}/disasters", tags=["Disasters & GIS"])
app.include_router(missions.router, prefix=f"{settings.API_V1_STR}/missions", tags=["Rescue Missions & Teams"])
app.include_router(intelligence.router, prefix=f"{settings.API_V1_STR}", tags=["Intelligence & Simulations"])
app.include_router(intelligence.router, prefix=f"{settings.API_V1_STR}/intelligence", tags=["Intelligence & Simulations"])
app.include_router(operations.router, prefix=f"{settings.API_V1_STR}", tags=["Operations & Reports"])
app.include_router(incidents.router, prefix=f"{settings.API_V1_STR}", tags=["Historical Incidents & Archive"])
app.include_router(geocoding.router, prefix=f"{settings.API_V1_STR}", tags=["Geocoding & Places"])

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
