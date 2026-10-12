"""Operations API router exposing Official Alerts, News, Knowledge RAG, SITREP PDF, and Validation."""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from backend.app.db.session import get_db
from backend.app.schemas.schemas import (
    OfficialAlertResponse,
    OfficialAlertCreate,
    NewsItemResponse,
    KnowledgeDocumentResponse,
    KnowledgeQueryRequest,
    SituationReportResponse,
)
from backend.app.services.official_alert_service import OfficialAlertService
from backend.app.services.news_service import NewsService
from backend.app.services.knowledge_service import KnowledgeService
from backend.app.services.report_service import ReportService
from backend.app.services.validation_service import ValidationService
from backend.app.services.satellite_service import SatelliteService
from backend.app.services.population_exposure_service import PopulationExposureService

router = APIRouter()

# ----------------- 1. Official Alerts -----------------
@router.get("/alerts", response_model=List[OfficialAlertResponse], tags=["Official Alerts & News"])
def get_official_alerts(
    disaster_id: Optional[int] = None,
    alert_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve verified official emergency alerts (NDMA SACHET, IMD, CWC)."""
    service = OfficialAlertService()
    return service.get_alerts(db, disaster_id=disaster_id, alert_level=alert_level)

@router.post("/alerts", response_model=OfficialAlertResponse, tags=["Official Alerts & News"])
def create_official_alert(
    payload: OfficialAlertCreate,
    db: Session = Depends(get_db)
):
    """Publish an authoritative emergency alert."""
    service = OfficialAlertService()
    return service.create_alert(
        db=db,
        disaster_id=payload.disaster_id or 1,
        authority=payload.authority,
        alert_level=payload.alert_level,
        headline=payload.headline,
        instruction=payload.instruction,
        source_url=payload.source_url,
        hours_valid=payload.hours_valid or 24
    )

@router.post("/alerts/sync", tags=["Official Alerts & News"])
def sync_official_alerts(disaster_id: int = 1, db: Session = Depends(get_db)):
    """Sync live bulletins from NDMA SACHET, IMD, and CWC feeds."""
    service = OfficialAlertService()
    count = service.sync_live_alerts(db, disaster_id)
    return {"status": "success", "new_alerts_synced": count}

# ----------------- 2. Disaster News -----------------
@router.get("/news", response_model=List[NewsItemResponse], tags=["Official Alerts & News"])
def get_disaster_news(
    disaster_id: Optional[int] = None,
    verification: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve disaster-only verified news wire items with verification badges."""
    service = NewsService()
    return service.get_news(db, disaster_id=disaster_id, verification=verification)

@router.post("/news/sync", tags=["Official Alerts & News"])
def sync_disaster_news(disaster_id: int = 1, db: Session = Depends(get_db)):
    """Sync news items from official news wire feeds (PIB, DD News)."""
    service = NewsService()
    count = service.sync_live_feeds(db, disaster_id)
    return {"status": "success", "new_articles_synced": count}

# ----------------- 3. Knowledge & RAG -----------------
@router.get("/knowledge", response_model=List[KnowledgeDocumentResponse], tags=["Disaster RAG & Knowledge"])
def get_knowledge_documents(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve curated disaster SOPs and guidelines (NDMA, NDRF, IRS)."""
    return KnowledgeService.get_all_documents(db, category=category)

@router.post("/knowledge/query", tags=["Disaster RAG & Knowledge"])
def query_knowledge_rag(
    payload: KnowledgeQueryRequest,
    db: Session = Depends(get_db)
):
    """Semantic & keyword RAG retrieval over disaster protocols."""
    citations = KnowledgeService.query_rag(db, payload.query, top_k=payload.top_k or 3)
    return {
        "query": payload.query,
        "results_count": len(citations),
        "citations": citations
    }

# ----------------- 4. Situation Reports & PDF Export -----------------
@router.get("/reports", response_model=List[SituationReportResponse], tags=["Situation Reports & PDF"])
def list_situation_reports(disaster_id: int = 1, db: Session = Depends(get_db)):
    """List archived and drafted situation reports."""
    return ReportService.get_situation_reports(db, disaster_id)

@router.get("/reports/{disaster_id}/pdf", tags=["Situation Reports & PDF"])
def export_situation_report_pdf(disaster_id: int, db: Session = Depends(get_db)):
    """Generate and stream an official, downloadable situation report PDF (SITREP)

    compiled using ReportLab with NDMA/IRS formatting, tables of damage, and verified metrics.
    """
    try:
        pdf_bytes = ReportService.generate_pdf_report(db, disaster_id)
        filename = f"RESQX_SITREP_INCIDENT_{disaster_id:02d}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/pdf"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

# ----------------- 5. Validation Benchmark -----------------
@router.get("/validation/benchmark", tags=["Model Validation"])
def get_model_validation_benchmark(disaster_id: int = 1, db: Session = Depends(get_db)):
    """Retrieve independent post-hoc model validation metrics vs Sen1Floods11 and Copernicus EMS (EMSR927).

    Strict compliance: EMSR927 is NEVER used as training/input data; only for independent validation.
    """
    return ValidationService.get_benchmark_comparison(db, disaster_id)

# ----------------- 6. Satellite Scenes -----------------
@router.get("/satellite/{disaster_id}/scenes", tags=["Satellite Intelligence"])
def get_satellite_scenes(disaster_id: int, db: Session = Depends(get_db)):
    """Search and discover Sentinel-1 SAR and Sentinel-2 optical scenes with calibration parameters."""
    service = SatelliteService()
    return service.discover_scenes(db, disaster_id)

# ----------------- 7. Population Exposure -----------------
@router.get("/population/{disaster_id}/exposures", tags=["Population Exposure"])
def get_population_exposures(disaster_id: int, db: Session = Depends(get_db)):
    """Retrieve settlement population exposure estimates with uncertainty intervals."""
    return PopulationExposureService.get_exposures(db, disaster_id)
