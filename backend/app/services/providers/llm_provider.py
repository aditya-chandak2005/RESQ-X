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
        self.model_name = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash") or "gemini-2.5-flash"
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        self.temperature = getattr(settings, "GEMINI_TEMPERATURE", 0.2)
        self.default_timeout = getattr(settings, "GEMINI_TIMEOUT_SECONDS", 8.0)

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 10)

    def get_provider_name(self) -> str:
        return f"Google Gemini ({self.model_name})"

    def generate(self, prompt: str, system_prompt: str, timeout_seconds: Optional[float] = None) -> Optional[str]:
        if not self.is_configured():
            return None

        timeout = timeout_seconds if timeout_seconds is not None else self.default_timeout

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"System Directive:\n{system_prompt}\n\nEvidence & User Query:\n{prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": self.temperature,
                "maxOutputTokens": 2048,
                "topP": 0.85
            }
        }

        try:
            with httpx.Client(timeout=timeout) as client:
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
                elif resp.status_code == 429:
                    print(f"Gemini API rate limit reached (HTTP 429). Falling back to grounded synthesis engine.")
                else:
                    print(f"Gemini API returned HTTP {resp.status_code}: {resp.text[:200]}")
                return None
        except httpx.TimeoutException:
            print(f"Gemini API timed out after {timeout}s. Falling back to deterministic grounded synthesis.")
            return None
        except Exception as e:
            print(f"Gemini API request failed: {e}. Falling back to deterministic grounded synthesis.")
            return None


class DeterministicGroundedProvider(BaseLLMProvider):
    """Fallback zero-hallucination deterministic grounded provider."""
    def is_configured(self) -> bool:
        return True

    def get_provider_name(self) -> str:
        return "Deterministic Grounded Synthesis Engine"

    def generate(self, prompt: str, system_prompt: str, timeout_seconds: float = 0.0) -> Optional[str]:
        # Always yields to deterministic template synthesis directly
        return None


class LLMManager:
    """Manages active LLM provider selection, environment configuration, and safe fallback."""
    _gemini = GeminiProvider()
    _deterministic = DeterministicGroundedProvider()

    @classmethod
    def get_configured_provider_type(cls) -> str:
        return (getattr(settings, "COPILOT_LLM_PROVIDER", "gemini") or "gemini").lower()

    @classmethod
    def get_active_provider(cls) -> BaseLLMProvider:
        prov_type = cls.get_configured_provider_type()
        if prov_type in ("deterministic", "grounded", "local"):
            return cls._deterministic
        return cls._gemini

    @classmethod
    def is_external_llm_active(cls) -> bool:
        prov_type = cls.get_configured_provider_type()
        if prov_type in ("deterministic", "grounded", "local"):
            return False
        return cls._gemini.is_configured()

    @classmethod
    def get_provider_status(cls) -> Dict[str, Any]:
        prov_type = cls.get_configured_provider_type()
        is_active = cls.is_external_llm_active()
        active_provider = cls.get_active_provider()
        
        return {
            "provider": active_provider.get_provider_name() if is_active else "Deterministic Grounded Synthesis Engine",
            "is_configured": is_active,
            "engine_mode": "generative_augmented" if is_active else "grounded_telemetry_rag",
            "model_name": getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash") if is_active else "Rule-based RAG",
            "required_env": "GEMINI_API_KEY",
            "provider_type": prov_type,
            "status_notice": (
                f"Active generative model: {active_provider.get_provider_name()} with temperature={getattr(settings, 'GEMINI_TEMPERATURE', 0.2)}."
                if is_active
                else "External LLM not configured or set to deterministic mode. Responses are computed directly from verified PostGIS database records, Sentinel-1 SAR models, and indexed NDMA/CWC technical guidelines. Set GEMINI_API_KEY in .env to enable generative augmentation."
            )
        }

    @classmethod
    def get_disaster_system_prompt(cls) -> str:
        """Domain-specialized prompt enforcing strict evidence grounding, correct presentation, and zero fabrication."""
        return (
            "You are the RESQ-X Advanced Disaster Intelligence Copilot, a domain-specialized senior disaster management research analyst, "
            "RAG architect, and GIS specialist for India's disaster management authorities (NDMA, SDMA, CWC, IMD).\n\n"
            "MANDATORY OPERATIONAL DIRECTIVES:\n"
            "1. GROUNDING & NUMERICAL ACCURACY: Never invent coordinates, casualties, flooded areas, bridge counts, or dates. "
            "Every statistic must be derived directly from the provided evidence telemetry. If data is unavailable, state the gap clearly.\n"
            "2. PROVENANCE & DATES: Strictly preserve the distinction between an event's occurrence date, an official report's publication date, "
            "and a satellite dataset's acquisition/observation date.\n"
            "3. CATEGORIZATION: Explicitly distinguish officially reported facts (ASDMA, CWC, NDMA), satellite SAR observations (Sentinel-1), "
            "deterministic GIS graph measurements (NetworkX topological cutoffs), and model-based estimates (LandScan exposure, triage priority).\n"
            "4. RESPONSE STRUCTURE: For analytical questions, always organize output with clear markdown headings:\n"
            "   - ### Executive Summary\n"
            "   - ### Geographic and Temporal Scope\n"
            "   - ### Detailed Findings (with Markdown tables for comparisons and chronological sequences)\n"
            "   - ### Evidence and Sources (citing issuing authority, year, working URLs, and section)\n"
            "   - ### Analysis and Interpretation (hydrological triggers, pre-event conditions, infrastructure vulnerabilities)\n"
            "   - ### Limitations and Uncertainty (missing sensors, cloud cover, pending field inspections)\n"
            "   - ### Next Useful Actions (actionable recommendations for authorities and tactical teams)\n"
            "5. NO UNGROUNDED SPECULATION: Never present model inferences as certified casualty tolls or official damage decrees.\n"
            "6. ACTIVE WARNINGS VS HISTORY: Distinguish current real-time alerts (Red/Orange/Yellow) from past historical events."
        )
