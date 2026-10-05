import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl, field_validator

class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "RESQ-X AI Disaster Response Platform"
    API_V1_STR: str = "/api"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v):
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "debug", "dev")
        return False
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./resqx.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    
    # AI & GIS Parameters
    AI_MODEL_PATH: str = "./ml/models/flood_seg_v1.onnx"
    AI_INFERENCE_DEVICE: str = "cpu"
    AI_CONFIDENCE_THRESHOLD: float = 0.65
    
    # External APIs
    GEMINI_API_KEY: str = ""
    COPICUS_API_KEY: str = ""
    SENTINEL_HUB_CLIENT_ID: str = ""
    SENTINEL_HUB_CLIENT_SECRET: str = ""
    
    # Default Coordinates for Chamoli / Rishikesh Uttarakhand Disaster Testbed
    DEFAULT_BASE_LAT: float = 30.0869
    DEFAULT_BASE_LON: float = 78.2676
    DEFAULT_SEARCH_RADIUS_KM: float = 50.0

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"

settings = Settings()
