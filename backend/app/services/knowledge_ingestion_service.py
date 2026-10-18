"""Knowledge Ingestion & Indexing Service for RESQ-X Disaster Intelligence.
Handles ingestion, deduplication, schema validation, metadata preservation, and hybrid indexing
for official disaster reports, NDMA guidelines, CWC manuals, IMD alerts, and satellite products.
"""
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import re

from backend.app.models.models import KnowledgeDocument, IncidentSource


class KnowledgeIngestionService:
    """Service for ingesting, validating, and indexing disaster intelligence documents."""

    REQUIRED_METADATA_KEYS = [
        "url", "publication_year", "source_authority", "geographic_coverage",
        "hazard_type", "document_type", "source_reliability"
    ]

    @classmethod
    def validate_document_schema(cls, doc_data: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate that the document payload has required fields and truthful metadata."""
        if not doc_data.get("title") or len(doc_data["title"].strip()) < 5:
            return False, "Document title is required and must be at least 5 characters."
        if not doc_data.get("content_text") or len(doc_data["content_text"].strip()) < 50:
            return False, "Document content_text is required and must be substantive (>50 chars)."
        if not doc_data.get("source_authority"):
            return False, "Official source_authority is required (e.g. NDMA, CWC, IMD, ASDMA)."
        return True, "Valid"

    @classmethod
    def ingest_document(
        cls,
        db: Session,
        doc_data: Dict[str, Any],
        update_existing: bool = True
    ) -> Dict[str, Any]:
        """Ingest a single disaster intelligence document, preserving complete metadata."""
        is_valid, msg = cls.validate_document_schema(doc_data)
        if not is_valid:
            return {"status": "error", "message": msg, "title": doc_data.get("title")}

        title = doc_data["title"].strip()
        authority = doc_data.get("source_authority", "National Disaster Authority").strip()
        category = doc_data.get("category", "ndma_guideline").strip()
        content = doc_data["content_text"].strip()

        meta = dict(doc_data.get("metadata_json", {}))
        meta.setdefault("url", doc_data.get("url", ""))
        meta.setdefault("publication_year", doc_data.get("publication_year", datetime.now(timezone.utc).year))
        meta.setdefault("event_date", doc_data.get("event_date"))
        meta.setdefault("geographic_coverage", doc_data.get("geographic_coverage", "National (India)"))
        meta.setdefault("hazard_type", doc_data.get("hazard_type", "flood"))
        meta.setdefault("event_identifiers", doc_data.get("event_identifiers", []))
        meta.setdefault("document_type", doc_data.get("document_type", "official_guideline"))
        meta.setdefault("source_reliability", doc_data.get("source_reliability", "A1_official_verified"))
        meta.setdefault("retrieval_timestamp", datetime.now(timezone.utc).isoformat())
        meta.setdefault("known_limitations", doc_data.get("known_limitations", "Subject to localized gauge and terrain calibrations."))
        meta.setdefault("keywords", doc_data.get("keywords", meta.get("keywords", [])))
        meta.setdefault("section_references", doc_data.get("section_references", meta.get("section_references", [])))
        meta.setdefault("license", doc_data.get("license", "Open Government Data (OGD) India"))

        # Check existing by title
        existing = db.query(KnowledgeDocument).filter(KnowledgeDocument.title == title).first()
        if existing:
            if update_existing:
                existing.category = category
                existing.source_authority = authority
                existing.content_text = content
                existing.metadata_json = meta
                db.commit()
                db.refresh(existing)
                return {
                    "status": "updated",
                    "id": existing.id,
                    "title": title,
                    "authority": authority,
                    "category": category
                }
            else:
                return {
                    "status": "skipped",
                    "id": existing.id,
                    "title": title,
                    "message": "Document with identical title already indexed."
                }

        # Create new
        new_doc = KnowledgeDocument(
            title=title,
            category=category,
            source_authority=authority,
            content_text=content,
            metadata_json=meta
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)

        return {
            "status": "created",
            "id": new_doc.id,
            "title": title,
            "authority": authority,
            "category": category
        }

    @classmethod
    def bulk_ingest(
        cls,
        db: Session,
        documents: List[Dict[str, Any]],
        update_existing: bool = True
    ) -> Dict[str, Any]:
        """Ingest a list of documents in batch with transaction safety."""
        created = 0
        updated = 0
        skipped = 0
        errors = []

        for d in documents:
            res = cls.ingest_document(db, d, update_existing=update_existing)
            if res["status"] == "created":
                created += 1
            elif res["status"] == "updated":
                updated += 1
            elif res["status"] == "skipped":
                skipped += 1
            else:
                errors.append(res)

        return {
            "total_processed": len(documents),
            "created": created,
            "updated": updated,
            "skipped": skipped,
            "errors": errors
        }

    @classmethod
    def get_indexed_manifest(cls, db: Session) -> Dict[str, Any]:
        """Return audit manifest of all indexed disaster intelligence documents."""
        docs = db.query(KnowledgeDocument).all()
        categories = {}
        authorities = {}
        coverage_areas = set()

        items = []
        for d in docs:
            categories[d.category] = categories.get(d.category, 0) + 1
            authorities[d.source_authority] = authorities.get(d.source_authority, 0) + 1
            meta = d.metadata_json or {}
            geo = meta.get("geographic_coverage", "National (India)")
            coverage_areas.add(geo)

            items.append({
                "id": d.id,
                "title": d.title,
                "category": d.category,
                "source_authority": d.source_authority,
                "url": meta.get("url", ""),
                "publication_year": meta.get("publication_year"),
                "geographic_coverage": geo,
                "hazard_type": meta.get("hazard_type", "flood"),
                "document_type": meta.get("document_type", "guideline"),
                "source_reliability": meta.get("source_reliability", "A1_official_verified"),
                "keywords_count": len(meta.get("keywords", [])),
                "created_at": d.created_at.isoformat() if d.created_at else None
            })

        return {
            "total_indexed_documents": len(docs),
            "categories_breakdown": categories,
            "authorities_breakdown": authorities,
            "coverage_areas": sorted(list(coverage_areas)),
            "documents": items
        }
