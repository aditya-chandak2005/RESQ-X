# RESQ-X System Architecture

## Architecture Overview

```
                                      ┌─────────────────────────────────────────┐
                                      │             REACT FRONTEND              │
                                      │   (Tactical HUD / Leaflet / Recharts)   │
                                      └────────────────────┬────────────────────┘
                                                           │ HTTP / REST
                                                           ▼
                                      ┌─────────────────────────────────────────┐
                                      │             FASTAPI BACKEND             │
                                      │       (/api/v1 - OpenAPI / Pydantic)    │
                                      └────────────────────┬────────────────────┘
                                                           │
          ┌───────────────────────┬────────────────────────┼───────────────────────┬───────────────────────┐
          ▼                       ▼                        ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Satellite & SAR  │    │ AI Segmentation  │    │ GIS & OpenStreet │    │ Priority Scoring │    │ Dynamic Reroute  │
│ Service (S1/S2)  │    │ Engine (PyTorch) │    │ Map Intersector  │    │ MCDA (0-100)     │    │ & Graph Engine   │
└──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘    └──────────────────┘
                                                           │
                                                           ▼
                                      ┌─────────────────────────────────────────┐
                                      │       POSTGRESQL + POSTGIS / SQLITE     │
                                      │ (Spatial Indexes, Geometries, Missions) │
                                      └─────────────────────────────────────────┘
```

## Service Descriptions

1. **Satellite Ingestion Abstraction**: Wraps Copernicus Open Access API and Sentinel Hub. Loads dual-pol SAR (VV/VH) and optical bands.
2. **AI Segmentation**: Performs Lee speckle noise suppression, thresholding, and deep learning inference fine-tuned on Kuro Siwo.
3. **Damage Engine**: Calculates spatial topological intersection with OpenStreetMap buildings, roads, and bridges.
4. **NetworkX Graph Engine**: Maintains dynamic road network topology. Nodes represent road junctions, response bases, and settlements; edges represent traversable road segments and bridges.
5. **Explainable Rescue Priority Engine**: Calculates normalized 0-100 MCDA priority scores with natural language explainability logs.
6. **Dynamic Rerouting Loop**: Automatically marks edges as severed when field teams submit incident reports, detects compromised missions, and computes alternate evacuation vectors.
7. **RESQ Copilot**: Grounded question-answering assistant querying relational tables directly to prevent model hallucination.
