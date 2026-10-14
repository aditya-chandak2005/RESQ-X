"""LLM Provider Abstraction: Pluggable AI backend with Gemini integration & Grounded Deterministic Engine.
Supports bounded timeouts, fallback handling, and explicit status reporting.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import os
import httpx
from datetime import datetime, timezone
from backend.app.core.config import settings

class BaseLLMProvider(ABC):
    @abstractmethod
    def is_configured(self) -> bool:
        """Check if provider has active credentials."""
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return provider human-readable identifier."""
        pass

    @abstractmethod
    def generate(self, prompt: str, system_prompt: str, timeout_seconds: float = 8.0) -> Optional[str]:
        """Generate response with bounded timeout."""
        pass

class GeminiProvider(BaseLLMProvider):
    """Official Google Gemini API provider via direct HTTPS REST endpoint."""
    def __init__(self):
        self.api_key = (
            getattr(settings, "GEMINI_API_KEY", "") or
            os.getenv("GEMINI_API_KEY", "") or
            os.getenv("GOOGLE_API_KEY", "")
        ).strip()
        self.model_name = "gemini-2.5-flash"
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 10)

    def get_provider_name(self) -> str:
        return f"Google Gemini ({self.model_name})"

    def generate(self, prompt: str, system_prompt: str, timeout_seconds: float = 8.0) -> Optional[str]:
        if not self.is_configured():
            return None

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"System Directive: {system_prompt}\n\nUser Query: {prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1024,
                "topP": 0.8
            }
        }

        try:
            with httpx.Client(timeout=timeout_seconds) as client:
                resp = client.post(
                    f"{self.endpoint}?key={self.api_key}",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
                return None
        except Exception as e:
            print(f"Gemini API request failed: {e}")
            return None

class LLMManager:
    """Manages active LLM provider selection and safe fallback."""
    _gemini = GeminiProvider()

    @classmethod
    def get_active_provider(cls) -> BaseLLMProvider:
        return cls._gemini

    @classmethod
    def is_external_llm_active(cls) -> bool:
        return cls._gemini.is_configured()

    @classmethod
    def get_provider_status(cls) -> Dict[str, Any]:
        is_active = cls._gemini.is_configured()
        return {
            "provider": cls._gemini.get_provider_name() if is_active else "Deterministic Grounded Synthesis Engine",
            "is_configured": is_active,
            "engine_mode": "generative_augmented" if is_active else "grounded_telemetry_rag",
            "required_env": "GEMINI_API_KEY",
            "status_notice": (
                "Gemini AI active for conversational expansion."
                if is_active
                else "External LLM not configured. Responses are computed directly from verified PostGIS database records and NDMA knowledge documents. To enable generative synthesis, add GEMINI_API_KEY in .env."
            )
        }
