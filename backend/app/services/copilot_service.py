"""Copilot Service: Disaster-specialized intelligence agent with database facts and RAG integration."""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.services.copilot.copilot import ResqCopilot
from backend.app.services.knowledge_service import KnowledgeService
from backend.app.models.models import CopilotQuery

class CopilotService:
    @staticmethod
    def ask(db: Session, disaster_id: int, query: str) -> Dict[str, Any]:
        # 1. Authoritative GIS & relational database facts
        answer_result = ResqCopilot.answer_query(db, disaster_id, query)
        
        # 2. RAG retrieval of official protocols (NDMA/NDRF)
        rag_citations = KnowledgeService.query_rag(db, query, top_k=2)

        # 3. Log query to copilot_queries table
        log = CopilotQuery(
            disaster_id=disaster_id,
            query_text=query,
            response_text=str(answer_result),
            retrieved_data_json={"citations": rag_citations}
        )
        db.add(log)
        db.commit()

        if isinstance(answer_result, dict):
            answer_result["official_citations"] = rag_citations
            return answer_result
        
        return {
            "response": answer_result,
            "citations": rag_citations
        }
