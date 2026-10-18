"""Ingestion service package for official Indian feeds and real-time processing."""
from backend.app.services.ingestion.source_registry import SourceStatusRegistry
from backend.app.services.ingestion.cap_parser import CapParser
from backend.app.services.ingestion.pipeline_engine import (
    pipeline_engine,
    PipelineEngine,
    register_sse_client,
    unregister_sse_client,
)

__all__ = [
    "SourceStatusRegistry",
    "CapParser",
    "pipeline_engine",
    "PipelineEngine",
    "register_sse_client",
    "unregister_sse_client",
]
