# RESQ-X
### AI-Powered Disaster Response, Damage Mapping & Rescue Intelligence Platform
**Multimodal AI Hackathon 2026 — Track B: Mapping Flood Damage from Space**

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20TypeScript%20%7C%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20Tactical%20HUD-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet%20Interactive-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![NetworkX](https://img.shields.io/badge/Topology-NetworkX%20Graph-blue)](https://networkx.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Project Overview

**RESQ-X** is an end-to-end tactical disaster response intelligence platform built to bridge the gap between spaceborne satellite observations and boots-on-the-ground emergency rescue execution.

When catastrophic flash floods, dam bursts, or glacial lake outburst floods (GLOF) strike, first responders face critical blind spots: destroyed river bridges, inundated highways, severed hospital corridors, and cut-off mountain villages.

RESQ-X ingests **Copernicus Sentinel-1 SAR** and **Sentinel-2 optical** imagery, runs a deep learning flood segmentation pipeline (`RESQ-Net-SARv2`), overlays **OpenStreetMap** infrastructure, constructs a dynamic **NetworkX topological road graph**, detects **isolated settlements**, computes **explainable multi-factor rescue priority rankings (0–100)**, generates **safe primary and alternate evacuation vectors**, and provides a **closed-loop dynamic rerouting feedback engine** for field teams.

```
       OBSERVE                     UNDERSTAND                     ASSESS
┌────────────────────┐     ┌──────────────────────┐     ┌───────────────────────┐
│ Sentinel-1 C-SAR   │ ──► │ AI Flood Segmentation│ ──► │ OSM Buildings/Bridges │
│ Sentinel-2 Optical │     │ (Kuro-Siwo Fine-tune)│     │ Damage & Water Depth  │
└────────────────────┘     └──────────────────────┘     └───────────────────────┘
                                                                   │
                                                                   ▼
       REPORT                        ACT                         PLAN
┌────────────────────┐     ┌──────────────────────┐     ┌───────────────────────┐
│ Grounded Copilot   │ ◄── │ Field Feedback Loop  │ ◄── │ Rescue Priority MCDA  │
│ Official SITREP    │     │ Dynamic Re-routing   │     │ Alternate Routes      │
└────────────────────┘     └──────────────────────┘     └───────────────────────┘
```

---

## 2. Core Architecture & Stages

### 2.1 Before Disaster: Preparedness & Vulnerability Atlas
- Pre-disaster susceptibility modeling using **Copernicus 30m Digital Elevation Model (DEM)** slope gradient, valley drainage density, and critical infrastructure proximity.
- Classifies terrain into: `LOW RISK`, `MODERATE RISK`, `HIGH RISK`, and `CRITICAL VULNERABILITY`.
- *Scientific Disclaimer: This module provides susceptibility analysis and does NOT predict the exact temporal trigger of future events.*

### 2.2 Historical Archive & Multi-District Search ("Explore Disasters")
- **Assam-First & Pan-India Disaster Archive**: Search historical and active emergency events by ordinary place names (districts, sub-divisions, rivers, or landmarks) without requiring lat/long coordinates.
- **Provider-Independent Geocoding**: Multi-tier resolution leveraging a curated offline registry (Survey of India / ASDMA), fallback to Photon/OSM, bounding-box calculation, and **proactive ambiguity detection** (e.g. distinguishing *Kamrup Metropolitan* vs *Kamrup Rural*).
- **Multi-Source Provenance Citations**: Every historical record is backed by verifiable citations from **Copernicus Emergency Management Service (EMS)**, **Assam State Disaster Management Authority (ASDMA)**, **Central Water Commission (CWC)**, and **NDMA**.
- **Honest Data Availability Matrix**: Rigorously reports whether satellite scenes, flood extent, infrastructure exposure, or population models are `verified`, `available`, or `unavailable`—strictly precluding fabricated zero values for unanalyzed sectors.
- **Drill / Simulation Transparency**: Synthetic testbeds (such as Guwahati Silsako flash flood drills) are visibly tagged as `DEMO DATA` to distinguish them from verified historical disasters.

### 2.3 During & After Disaster: Tactical Intelligence Pipeline
1. **Acquire Satellite Scenes**: Pre-event reference and post-disaster SAR/Optical acquisitions.
2. **AI Flood Segmentation**: Dual-polarization (`VV` + `VH`) specular reflection detection with Lee speckle filtering.
3. **Vector Polygonization**: Flood boundary contours with severity gradients (`Critical`, `High`, `Medium`, `Low`).
4. **Infrastructure Exposure**: Spatial intersection with buildings, road segments, and river bridge spans.
5. **Topological Graph Connectivity**: NetworkX graph computation to identify isolated settlements cut off from hospitals and command bases.
6. **Rescue Priority MCDA Scoring**: Transparent 0–100 composite ranking with full natural-language explainability logs.
7. **Resource Triage**: Decision-support asset allocation (SAR teams, Zodiac boats, ALS ambulances, air drops).
8. **Dynamic Rerouting Feedback**: Real-time event propagation when field teams report collapsed bridges or blocked segments, automatically recalculating detour vectors and updating mission ETAs.
9. **RESQ AI Copilot**: Live question-answering strictly grounded in database metrics (zero hallucinated numbers).
10. **Official SITREP Generation**: One-page exportable situation report for operational briefings.

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Tactical Command Center Dark Theme), Leaflet & React-Leaflet, Lucide Icons, Recharts.
- **Backend**: Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn.
- **Database**: PostgreSQL + PostGIS (with portable SQLite fallback for rapid offline development).
- **Spatial & Topology**: NetworkX (dynamic road networks & isolation analysis), Shapely (geometric intersections), NumPy, SciPy (Lee speckle filter).
- **Machine Learning**: PyTorch segmentation architecture trained on Kuro Siwo / Sen1Floods11.
- **Containerization**: Docker, Docker Compose, Nginx.

---

## 4. Benchmark Scenario: Chamoli Glacial Outburst Sector

RESQ-X is pre-loaded with an authentic high-fidelity testbed based on the **Chamoli Glacial Outburst & Flash Flood** (Dhauliganga & Alaknanda river basins):
- **Satellite Data**: Sentinel-1 SAR Dual-Polarization (`VV/VH`) & Sentinel-2 MSI MultiSpectral.
- **Affected Region**: Raini Village, Tapovan Hydropower Site, Joshimath, Helang, Suraithota.
- **Critical Bridge Washout**: Bridge B-17 (Raini Dhauliganga Span) completely collapsed.
- **Active Missions**: NDRF Team Alpha-1, SDRF Bravo-3, ITBP Quick Reaction Unit.
- **Dynamic Reroute**: Automated diversion via Upper North Ridgeline Ridge Trail (Safety Index: 88.5%).

---

## 5. Strict Scientific Rules & Anti-Hallucination Standards

1. **Independent Validation Separation**:
   - `Copernicus EMS EMSR927` is reserved **exclusively for validation benchmarks** (IoU: `0.854`, F1: `0.918`).
   - EMSR927 is **strictly forbidden** from being used in AI training or model input.
2. **Zero Fabricated Satellite Data**:
   - Every satellite scene, acquisition date, sensor identifier, and cloud coverage percentage is explicitly documented.
3. **Transparent Uncertainty Labeling**:
   - Every bridge and building includes confidence scores and verification statuses (e.g. `potentially affected — requires field verification`).
4. **Grounded AI Copilot**:
   - RESQ Copilot never fabricates numbers. All answers directly retrieve live metrics from database tables and NetworkX graph state.
5. **Decision-Support Designation**:
   - All resource suggestions and priority scores are labeled as *decision-support recommendations* for human command triage.

---

## 6. Installation & Quick Start

### Prerequisites
- Python 3.11+ (Python 3.13 tested)
- Node.js 18+ (Node.js v24 tested)
- npm 10+
- Git

### 6.1 Clone & Setup Repository
```bash
git clone https://github.com/aditya-chandak/resq-x-disaster-response.git
cd RESQ-X
```

### 6.2 Backend Setup
```bash
# Setup virtual environment
python -m venv backend/.venv

# Activate on Windows PowerShell:
.\backend\.venv\Scripts\Activate.ps1
# Or on Linux/macOS:
# source backend/.venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Initialize database and seed benchmark testbed
python -m backend.app.db.init_db

# Run FastAPI backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API documentation is live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 6.3 Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 7. Running with Docker Compose

To launch the complete stack with PostgreSQL, PostGIS, FastAPI, and Nginx:
```bash
docker compose up --build
```
- Frontend: [http://localhost](http://localhost)
- Backend API & Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 8. Running Automated Tests

```bash
# Run complete backend pytest suite (all 20 critical integration & search tests)
python -m pytest -v
```

---

## 9. API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check & system status |
| `GET` | `/api/incidents` | **Multi-criteria historical search & Assam disaster archive** |
| `GET` | `/api/incidents/{id}` | Detailed incident record & multi-source citations |
| `GET` | `/api/incidents/{id}/data-availability` | **Honest data availability matrix & uncertainty** |
| `POST` | `/api/incidents/spatial-search` | Bounding-box and geographic radius search |
| `GET` | `/api/geocoding/search` | **Place name geocoder with ambiguity detection** |
| `GET` | `/api/places/resolve` | Bounding box, center coordinates, and feature lookup |
| `GET` | `/api/disasters` | List all monitored disaster events |
| `GET` | `/api/disasters/{id}/kpis` | Real-time command dashboard metrics |
| `POST` | `/api/disasters/{id}/analyze` | Execute 9-stage satellite AI pipeline |
| `GET` | `/api/disasters/{id}/flood` | Vector flood polygons & severity |
| `GET` | `/api/disasters/{id}/settlements` | Monitored settlements & isolation |
| `GET` | `/api/disasters/{id}/damage` | Infrastructure exposure (bridges/roads) |
| `GET` | `/api/disasters/{id}/priority` | Multi-criteria rescue priority scores |
| `POST` | `/api/missions/field-reports` | **Field feedback loop & dynamic reroute** |
| `POST` | `/api/simulations` | Counterfactual "What-If" scenario engine |
| `POST` | `/api/flood-path` | Downstream DEM drainage corridor |
| `GET` | `/api/vulnerability` | Pre-disaster susceptibility atlas |
| `POST` | `/api/copilot/query` | **Grounded RESQ AI Copilot** |
| `GET` | `/api/reports/{id}` | Official printable SITREP document |

---

## 10. Hackathon Demonstration Flow (3 Minutes)

1. **Command Dashboard**: Observe live KPIs, dark tactical HUD map, Sentinel-1 SAR flood extent, and red pulsing markers for isolated settlements.
2. **Disaster Pipeline (`Disaster Analysis`)**: Run the 9-stage satellite processing pipeline and review the execution chain.
3. **Explainable Priority (`Rescue Priority`)**: Click Raini Village (Score: 94.5 / 100 - CRITICAL) to inspect the 5-factor breakdown and audit log.
4. **Dynamic Rerouting Demo (`Dynamic Rerouting`)**: Click *"Transmit Bridge Destroyed Report"*. Watch the system dynamically flag Bridge B-17 as destroyed, compromise the valley route, and automatically calculate the alternate North Ridgeline vector.
5. **What-If Simulator (`What-If Simulator`)**: Run the "Key Bridge Failure" scenario to project the cascading isolation of 640 additional civilians and required contingency assets.
6. **Mobile Field Unit (`Field Team Device`)**: Demonstrate one-touch tactical incident reports from boots on the ground.
7. **RESQ AI Copilot**: Click *"Which settlements are currently isolated?"* and watch it reply with verified database numbers.
8. **Official SITREP**: Generate and print the comprehensive disaster situation report.

---

## 11. License

This project is licensed under the MIT License. Developed for the **Multimodal AI Hackathon 2026 — Track B**.
