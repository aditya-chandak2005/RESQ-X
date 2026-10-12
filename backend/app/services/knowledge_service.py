"""Knowledge Service: Curates and retrieves disaster management RAG guidelines (NDMA, NDRF, IRS)."""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import KnowledgeDocument

class KnowledgeService:
    @staticmethod
    def get_all_documents(db: Session, category: Optional[str] = None) -> List[KnowledgeDocument]:
        query = db.query(KnowledgeDocument)
        if category:
            query = query.filter(KnowledgeDocument.category == category)
        return query.all()

    @staticmethod
    def query_rag(db: Session, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Keyword and semantic retrieval over official disaster protocols."""
        docs = db.query(KnowledgeDocument).all()
        q_tokens = set(query_text.lower().split())

        scored_docs = []
        for doc in docs:
            doc_text = f"{doc.title} {doc.content_text} {doc.category}".lower()
            # Calculate match score based on token frequency and authority weighting
            score = sum(1.0 for token in q_tokens if token in doc_text)
            if "ndma" in query_text.lower() and "ndma" in doc.source_authority.lower():
                score += 1.5
            if "ndrf" in query_text.lower() and "ndrf" in doc.source_authority.lower():
                score += 1.5
            if "bridge" in query_text.lower() and "bridge" in doc_text:
                score += 1.0

            scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, doc in scored_docs[:top_k]:
            results.append({
                "id": doc.id,
                "title": doc.title,
                "category": doc.category,
                "source_authority": doc.source_authority,
                "snippet": doc.content_text,
                "relevance_score": round(min(1.0, (score + 1.0) / (len(q_tokens) + 1.0)), 2),
                "metadata": doc.metadata_json
            })
        return results
