"""Copilot Service: Disaster-specialized intelligence agent with database facts and RAG integration."""
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.services.copilot.copilot import ResqCopilot
from backend.app.models.models import CopilotQuery

class CopilotService:
    @staticmethod
    def ask(
        db: Session,
        disaster_id: int,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Process natural language question through grounded tools and RAG pipeline."""
        answer_result = ResqCopilot.answer_query(db, disaster_id, query, conversation_history)

        # Log query to copilot_queries table safely
        try:
            log = CopilotQuery(
                disaster_id=disaster_id,
                query_text=query,
                response_text=answer_result.get("response", "")[:1000],
                retrieved_data_json={
                    "sources": answer_result.get("sources", []),
                    "data_used": answer_result.get("data_used", {}),
                    "status": answer_result.get("answer_status", "success")
                }
            )
            db.add(log)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Copilot query logging note: {e}")

        return answer_result

    @staticmethod
    def get_quick_review(db: Session, disaster_id: int, review_type: str = "executive") -> Dict[str, Any]:
        """Generate structured quick review modules for high-speed decision making."""
        return ResqCopilot.get_quick_review(db, disaster_id, review_type)

    @staticmethod
    def get_quick_queries(db: Session, disaster_id: int) -> List[Dict[str, Any]]:
        """Retrieve dynamic context-aware quick queries based on active incident data availability."""
        return ResqCopilot.get_context_aware_quick_queries(db, disaster_id)
