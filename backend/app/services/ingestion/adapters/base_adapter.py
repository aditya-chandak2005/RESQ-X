"""Abstract Base Adapter for RESQ-X Data Ingestion Layer."""
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Tuple, Optional


class BaseSourceAdapter(ABC):
    """Abstract interface for all Indian and international disaster intelligence adapters."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique provider identifier (e.g., 'ndma_sachet')."""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name."""
        pass

    @property
    @abstractmethod
    def endpoint(self) -> str:
        """Target official endpoint or RSS/REST URL."""
        pass

    @abstractmethod
    def fetch_alerts(self) -> Tuple[List[Dict[str, Any]], float, Optional[str]]:
        """Fetch and parse live alerts/records from this source.

        Returns:
            Tuple of (records_list, latency_ms, error_message_or_None)
        """
        pass
