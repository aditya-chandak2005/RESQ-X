"""Knowledge Service: Disaster management RAG search, document indexing & protocol retrieval.
Grounds responses in official NDMA, NDRF, NIDM, CWC, WHO & Sphere guidelines.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import re

from backend.app.models.models import KnowledgeDocument
from backend.app.services.rag.knowledge_base_data import HAZARD_PROTOCOLS, RAG_KNOWLEDGE_DOCUMENTS

class KnowledgeService:
    @staticmethod
    def seed_knowledge_database(db: Session) -> int:
        """Seed official disaster knowledge documents into database if not already populated."""
        existing_titles = {d.title for d in db.query(KnowledgeDocument.title).all()}
        added_count = 0

        for doc_def in RAG_KNOWLEDGE_DOCUMENTS:
            if doc_def["title"] not in existing_titles:
                new_doc = KnowledgeDocument(
                    title=doc_def["title"],
                    category=doc_def.get("category", "ndma_guideline"),
                    source_authority=doc_def.get("source_authority", "National Disaster Management Authority (NDMA)"),
                    content_text=doc_def["content_text"],
                    metadata_json={
                        "url": doc_def.get("url", ""),
                        "publication_year": doc_def.get("publication_year", 2020),
                        "keywords": doc_def.get("metadata_json", {}).get("keywords", []),
                        "section_references": doc_def.get("metadata_json", {}).get("section_references", []),
                        "license": doc_def.get("metadata_json", {}).get("license", "Open Government Data (OGD) India")
                    }
                )
                db.add(new_doc)
                added_count += 1

        if added_count > 0:
            db.commit()
        return added_count

    @staticmethod
    def get_all_documents(db: Session, category: Optional[str] = None) -> List[KnowledgeDocument]:
        """Retrieve all indexed disaster knowledge documents from DB."""
        # Ensure base documents are seeded
        KnowledgeService.seed_knowledge_database(db)
        query = db.query(KnowledgeDocument)
        if category and category.lower() != "all":
            query = query.filter(KnowledgeDocument.category == category)
        return query.all()

    @staticmethod
    def get_protocols_catalog() -> List[Dict[str, Any]]:
        """Return library of disaster emergency hazard protocols with complete fields."""
        return HAZARD_PROTOCOLS

    @staticmethod
    def get_protocol_detail(topic_id: str) -> Dict[str, Any]:
        """Return detail for a specific hazard protocol by ID."""
        t_clean = topic_id.lower().replace("-", "_").strip()
        for p in HAZARD_PROTOCOLS:
            if p["id"].lower() == t_clean or t_clean in p["name"].lower() or t_clean in p["title"].lower():
                return p
        return HAZARD_PROTOCOLS[0]

    @staticmethod
    def query_rag(db: Session, query_text: str, top_k: int = 3, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Hybrid keyword, semantic token, and authority-weighted retrieval over official disaster protocols."""
        KnowledgeService.seed_knowledge_database(db)
        docs = db.query(KnowledgeDocument).all()
        if not docs:
            return []

        # Stopwords to filter out
        STOPWORDS = {'what', 'are', 'the', 'rules', 'for', 'in', 'to', 'is', 'of', 'and', 'a', 'an', 'which', 'how', 'when', 'who', 'with', 'from', 'this', 'that', 'can', 'should', 'about'}
        clean_query = re.sub(r'[^\w\s]', ' ', query_text.lower())
        q_tokens = [t for t in clean_query.split() if len(t) > 2 and t not in STOPWORDS]
        
        if not q_tokens:
            return []

        scored_docs = []
        for doc in docs:
            doc_text = f"{doc.title} {doc.content_text} {doc.category} {doc.source_authority}".lower()
            meta = doc.metadata_json or {}
            keywords = [k.lower() for k in meta.get("keywords", [])]

            score = 0.0
            matched_terms = []

            for token in q_tokens:
                if token in doc_text:
                    if token in doc.title.lower():
                        score += 3.0
                    else:
                        score += 1.0
                    matched_terms.append(token)

                if any(token in kw for kw in keywords):
                    score += 2.0

            # Exact phrase bonus
            if query_text.lower().strip() in doc_text:
                score += 4.0

            # Category filter match
            if category and category.lower() != "all" and doc.category.lower() == category.lower():
                score += 2.0

            # Authority weighting
            if "ndma" in query_text.lower() and "ndma" in doc.source_authority.lower():
                score += 1.5
            if "ndrf" in query_text.lower() and "ndrf" in doc.source_authority.lower():
                score += 1.5
            if "who" in query_text.lower() and "who" in doc.source_authority.lower():
                score += 1.5
            if "cwc" in query_text.lower() and "cwc" in doc.source_authority.lower():
                score += 1.5

            # Require meaningful score and token coverage threshold
            min_coverage = 0.5 if len(q_tokens) >= 3 else 0.4
            token_coverage = len(matched_terms) / len(q_tokens) if q_tokens else 0
            if (score >= 3.0 and token_coverage >= min_coverage) or (len(q_tokens) == 1 and score >= 2.0):
                snippet = KnowledgeService._extract_best_passage(doc.content_text, q_tokens)
                scored_docs.append({
                    "id": doc.id,
                    "title": doc.title,
                    "category": doc.category,
                    "source_authority": doc.source_authority,
                    "url": meta.get("url", "https://ndma.gov.in"),
                    "publication_year": meta.get("publication_year", 2020),
                    "section_references": meta.get("section_references", []),
                    "snippet": snippet,
                    "matched_terms": matched_terms,
                    "relevance_score": round(min(1.0, score / (len(q_tokens) * 2.0 + 1.0)), 3),
                    "raw_score": score
                })

        scored_docs.sort(key=lambda x: x["raw_score"], reverse=True)
        return scored_docs[:top_k]

    @staticmethod
    def _extract_best_passage(full_text: str, tokens: List[str]) -> str:
        """Extract the most relevant paragraph or sentence window matching the search tokens."""
        paragraphs = [p.strip() for p in full_text.split('\n') if len(p.strip()) > 30]
        if not paragraphs:
            return full_text[:300] + "..."

        scored_paras = []
        for para in paragraphs:
            p_lower = para.lower()
            p_score = sum(1 for t in tokens if t in p_lower)
            scored_paras.append((p_score, para))

        scored_paras.sort(key=lambda x: x[0], reverse=True)
        best = scored_paras[0][1]
        if len(best) > 350:
            return best[:350] + "..."
        return best

    @staticmethod
    def search_knowledge_base(
        db: Session,
        query: str,
        category: Optional[str] = None,
        top_k: int = 4
    ) -> Dict[str, Any]:
        """Perform end-to-end natural language search over disaster management knowledge."""
        q_clean = query.strip()
        if not q_clean:
            return {
                "query": query,
                "status": "error",
                "message": "Query string cannot be empty.",
                "answer": "Please provide a disaster management topic, hazard protocol, or question to search.",
                "matched_documents": [],
                "matched_protocols": [],
                "total_results": 0
            }

        # 1. Retrieve matching RAG documents
        matched_docs = KnowledgeService.query_rag(db, q_clean, top_k=top_k, category=category)

        # 2. Check matching Hazard Protocols from catalog
        STOPWORDS = {'what', 'are', 'the', 'rules', 'for', 'in', 'to', 'is', 'of', 'and', 'a', 'an', 'which', 'how', 'when', 'who', 'with', 'from', 'this', 'that', 'can', 'should', 'about'}
        clean_words = [w for w in re.sub(r'[^\w\s]', ' ', q_clean.lower()).split() if len(w) > 2 and w not in STOPWORDS]

        matched_protocols = []
        if clean_words:
            for proto in HAZARD_PROTOCOLS:
                p_text = f"{proto['title']} {proto['category']} {proto['description']} {' '.join(proto['precursors'])} {' '.join(proto['immediate_dos'])}".lower()
                matches = sum(1 for w in clean_words if w in p_text)
                if matches >= 2 or any(w in proto['id'] or w in proto['name'].lower() for w in clean_words):
                    matched_protocols.append(proto)

        if not matched_docs and not matched_protocols:
            return {
                "query": query,
                "status": "insufficient_evidence",
                "answer": (
                    f"### ℹ️ No Indexed Disaster Management Guidance Found\n\n"
                    f"No relevant indexed guidelines or operational protocols were found matching **\"{query}\"**.\n\n"
                    f"- **Database Scope**: The knowledge base indexes national disaster guidelines from the **NDMA**, **NDRF**, **NIDM**, **CWC**, and **WHO/Sphere Standards**.\n"
                    f"- **Recommended Queries**: Try searching for **'GLOF mitigation'**, **'swift water rescue SOP'**, **'hypothermia treatment'**, **'bridge scour inspection'**, **'helicopter landing zone criteria'**, or **'dyke breach response'**."
                ),
                "matched_documents": [],
                "matched_protocols": [],
                "total_results": 0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "suggested_queries": [
                    "What are the immediate Do's and Don'ts for flash floods?",
                    "How to treat hypothermia in flood casualties?",
                    "What are the specifications for helicopter landing zones?",
                    "How is bridge scour measured after a flood?"
                ]
            }

        # 3. Construct grounded response from retrieved content
        answer_parts = []
        answer_parts.append(f"### 📖 Grounded Disaster Guidance: {query}\n")

        if matched_docs:
            primary_doc = matched_docs[0]
            answer_parts.append(f"**Primary Authority**: {primary_doc['source_authority']} ({primary_doc['publication_year']})\n")
            answer_parts.append(f"*{primary_doc['title']}*\n\n")
            answer_parts.append(f"{primary_doc['snippet']}\n\n")

            if len(matched_docs) > 1:
                answer_parts.append("#### Key Operational Protocols:\n")
                for doc in matched_docs[1:]:
                    answer_parts.append(f"- **{doc['title']}** ({doc['source_authority']}): {doc['snippet']}\n")

        elif matched_protocols:
            proto = matched_protocols[0]
            answer_parts.append(f"**Hazard Protocol**: {proto['title']} ({proto['category']})\n\n")
            answer_parts.append(f"{proto['description']}\n\n")
            if proto.get('immediate_dos'):
                answer_parts.append("**Immediate DO's (Life Safety):**\n")
                for d in proto['immediate_dos'][:3]:
                    answer_parts.append(f"  ✅ {d}\n")
            if proto.get('immediate_donts'):
                answer_parts.append("\n**Immediate DO NOT's:**\n")
                for d in proto['immediate_donts'][:3]:
                    answer_parts.append(f"  ❌ {d}\n")

        # Citations list
        citations = []
        for d in matched_docs:
            citations.append({
                "title": d["title"],
                "authority": d["source_authority"],
                "url": d["url"],
                "publication_year": d["publication_year"],
                "section": ", ".join(d["section_references"]) if d["section_references"] else "General Guidance",
                "relevance": d["relevance_score"]
            })

        for p in matched_protocols[:2]:
            for s in p.get("sources", []):
                citations.append({
                    "title": s["title"],
                    "authority": s["authority"],
                    "url": s["url"],
                    "publication_year": s.get("publication_date", "2021"),
                    "section": s.get("section", "Standard Protocol"),
                    "relevance": 0.95
                })

        return {
            "query": query,
            "status": "success",
            "answer": "".join(answer_parts),
            "matched_documents": matched_docs,
            "matched_protocols": matched_protocols,
            "citations": citations,
            "total_results": len(matched_docs) + len(matched_protocols),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "suggested_queries": [
                "What are the immediate Do's and Don'ts?",
                "What are the Search and Rescue deployment protocols?",
                "What medical triage procedures apply here?",
                "Which official sources document these standards?"
            ]
        }
