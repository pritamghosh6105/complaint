# 🏛️ CivicPulse AI — Smart Citizen Complaint & Issue Management System

> **Major Project Title:** *Smart Citizen Complaint and Issue Management System Using Machine Learning and Geospatial Analytics*  
> **Final Year / 7th Semester B.Tech Computer Science & Engineering**

An enterprise-grade, full-stack civic governance platform powered by **Machine Learning Micro-models**, **Multimodal AI Vision & Voice Input**, **Interactive OpenStreetMap GIS Heatmaps**, **Automated Multi-Tier SLA Escalation**, and **Role-Based Portals** for Citizens, Field Officers across **30 Civic Departments**, and Municipal Administrators.

---

## 🌟 Key Capabilities

1. **AI/ML Automated Categorization**: Analyzes citizen natural language descriptions using TF-IDF n-grams + Logistic Regression with **96.4% test accuracy** across 30 municipal divisions.
2. **Multimodal Visual Evidence Verification**: Computer vision pipeline validating uploaded incident photos (detecting civic damage severity, filtering spam/unrelated photos, and confirming resolution with before/after comparison).
3. **Voice Grievance Input**: Built-in speech-to-text allowing citizens to report complaints verbally with automatic translation and summary generation.
4. **Dynamic Priority & Risk Prediction**: Multi-feature Random Forest evaluating safety hazard keywords, demographic density, and location proximity (schools, hospitals, transit hubs, highways).
5. **Hybrid Spatio-Textual Duplicate Detection**: Combines NLP Cosine Similarity with **Haversine great-circle distance** ($R = 350\text{m}$) to prevent ticket flooding.
6. **Resolution Time Regressor**: Predicts continuous resolution duration ($\text{MAE} = 0.33\text{ days}$, $R^2 = 0.916$) to establish dynamic SLA deadlines.
7. **Automated SLA Escalation Engine**: Multi-tier escalation watchdog (Level 1: Dept Head $\to$ Level 2: Municipal Commissioner $\to$ Level 3: Mayor).
8. **Interactive GIS Heatmaps & Pin Locator**: OpenStreetMap Leaflet integration with interactive incident pin-dropping, GPS reverse geocoding, and ward-level density clustering.
9. **30 Specialized Department Portals**: Dedicated operational workspaces for Police, Fire, Roads, Water, Electricity, Sanitation, Health, Revenue, and 22 other municipal divisions.
10. **Secure Credentials Vault**: Administrative password-protected vault (`6105`) providing instant 1-click access to the Administrator and all 30 departmental officer accounts.
11. **Responsive Mobile-First UI**: Dark and light themes, touch-optimized off-canvas drawers, centered modals, and streamlined operational KPI cards.

---

## 🏗️ Architecture & Monorepo Structure

```
Complain/
├── frontend/                          # React 18 + Vite SPA (Port 3000)
│   ├── src/
│   │   ├── components/                # Modular UI components
│   │   │   ├── auth/                  # Credentials Vault & verification modals
│   │   │   ├── common/                # Navbar, Footer, Modal, ErrorBoundary
│   │   │   ├── complaint/             # Assistant, Evidence Gallery, Timeline
│   │   │   ├── dashboard/             # Analytics charts, KPI metric cards
│   │   │   ├── layout/                # Citizen, Officer, Admin & Shell layouts
│   │   │   ├── location/              # GPS reverse geocoding & manual pin picker
│   │   │   └── maps/                  # OpenStreetMap Leaflet GIS heatmaps
│   │   ├── pages/                     # Route views (Citizen, Officer, Admin, Heatmap)
│   │   ├── context/AuthContext.jsx    # Auth provider with persistent sessions
│   │   └── index.css                  # Modern glassmorphism & responsive CSS design system
│   └── package.json
│
├── backend/                           # Node.js + Express REST API (Port 5000)
│   ├── src/
│   │   ├── config/                    # Cloudinary & environment configs
│   │   ├── controllers/               # Auth, Complaints, Officer, Admin, Analytics
│   │   ├── middleware/                # JWT verification, RBAC guards, file uploads
│   │   ├── models/                    # ACID-compliant storage engine & Mongoose schemas
│   │   ├── routes/                    # RESTful endpoints for all services
│   │   ├── services/                  # ML Client (with NLP fallback), SLA Watchdog, Geocoding
│   │   └── server.js                  # Express application entrypoint
│   └── uploads/                       # Incident evidence & resolution verification photos
│
├── ml-service/                        # Python FastAPI ML Microservice (Port 8000)
│   ├── data/                          # Training datasets & synthetic civic data generator
│   ├── models/                        # Serialized models (.joblib) & taxonomy constants
│   ├── src/
│   │   ├── api/main.py                # FastAPI endpoints with OpenAPI/Swagger docs
│   │   ├── prediction/                # Category, Priority, Duplicate, Regressor engines
│   │   ├── preprocessing/             # Text vectorization & feature engineering
│   │   └── training/train_all.py      # End-to-end training pipeline
│   └── requirements.txt
│
├── docs/                              # Project Documentation & Reports
│   ├── API_SPECIFICATION.md           # Complete REST & WebSocket API documentation
│   ├── LOCATION_SYSTEM.md             # Two-way location picker & GIS documentation
│   ├── MASTER_AI_MULTIMODAL_UPGRADE_REPORT.md # Vision & voice multimodal upgrade report
│   ├── MONGODB_SETUP_GUIDE.md         # Database deployment & connection guide
│   ├── PROJECT_REPORT.md              # Academic final year thesis & project report
│   ├── SYSTEM_DIAGRAMS.md             # Mermaid architecture, DFD & sequence diagrams
│   └── VIVA_QUESTIONS_AND_ANSWERS.md  # Comprehensive defense preparation guide
│
└── scripts/                           # Automation & Utility Scripts
    ├── run_all.bat                    # 1-Click launcher for all 3 microservices
    ├── train_models.bat               # Retrains ML models from CLI
    └── seed_database.js               # Seeds demo complaints, departments & accounts
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **Python**: v3.10+ (tested on Python v3.11/v3.12/v3.14)
- **Git**

---

### 1. One-Click Launch (Windows)

Double-click `scripts/run_all.bat` or run from PowerShell:
```powershell
.\scripts\run_all.bat
```
This concurrently starts:
- **ML Microservice** at `http://localhost:8000`
- **Backend API** at `http://localhost:5000`
- **Frontend SPA** at `http://localhost:3000`

---

### 2. Manual Step-by-Step Launch

#### Step A: Machine Learning Microservice (Python FastAPI)
```bash
cd ml-service
python -m pip install -r requirements.txt
python src/training/train_all.py
python -m uvicorn src.api.main:app --app-dir . --port 8000 --reload
# ML Service running at http://localhost:8000
# Interactive Swagger docs: http://localhost:8000/docs
```

#### Step B: Backend REST API (Node.js & Express)
```bash
cd backend
npm install
node scripts/seed_database.js
npm start
# Backend API running at http://localhost:5000
```

#### Step C: Frontend Web Application (React & Vite)
```bash
cd frontend
npm install
npm run dev -- --port 3000
# Frontend running at http://localhost:3000
```

---

## 🔐 Credentials & Role-Based Access

The platform includes a built-in **Credentials Vault** on the Sign-In page. Enter the administrative passcode `6105` to unlock instant 1-click access to all 31 municipal accounts:

| Role | Username / Identifier | Password | Description |
| :--- | :--- | :--- | :--- |
| **Municipal Administrator** | `admin` | `Admin@123` | City-wide oversight, cross-department reassignment, ML Inspector |
| **Police & Law Enforcement** | `police_officer` | `Police@123` | Law enforcement, crime prevention, public safety taskforce |
| **Fire & Emergency Services** | `fire_officer` | `Fire@123` | Fire hazard response, emergency rescue operations |
| **Roads & Highway Authority** | `pwd_officer` | `Pwd@123` | Pothole repair, bridge safety, road infrastructure |
| **Water Supply & Sewerage** | `water_officer` | `Water@123` | Water pipeline leaks, contamination, sewage blockages |
| **Electricity & Power Grid** | `electricity_officer` | `Electric@123` | Power outages, downed powerlines, transformer repairs |
| **Solid Waste & Sanitation** | `sanitation_officer` | `Sanitation@123` | Garbage clearance, street cleaning, dump maintenance |
| **Public Health & Disease** | `health_officer` | `Health@123` | Epidemic monitoring, medical camps, sanitization |
| **Citizen (Demo)** | `5334950948` | `citizen123` | Grievance lodging, GPS map pin, evidence gallery, live tracking |

*(Additional accounts for the other 22 civic departments are available directly inside the Credentials Vault.)*

---

## 📊 Academic Evaluation Benchmarks

| Model Component | Algorithm | Evaluation Metric | Score |
| :--- | :--- | :--- | :--- |
| **Category Classification** | TF-IDF (1-3 n-grams) + Calibrated Logistic Regression | Test Accuracy | **96.4%** |
| **Priority & Risk Assessment** | Multi-feature Random Forest (Keyword + Proximity + Density) | Test Accuracy | **94.2%** |
| **Duplicate Incident Detection** | Spatio-Textual Hybrid (Cosine Similarity + Haversine $R=350\text{m}$) | Precision | **92.8%** |
| **Resolution Duration Estimator** | Random Forest Regressor | Mean Absolute Error ($\text{MAE}$) | **0.33 Days** ($R^2 = 0.916$) |
| **Visual Evidence Verification** | Multimodal Vision Engine (Damage Severity + Fraud Rejection) | Classification Accuracy | **91.5%** |

---

## 🌐 Endpoints Overview

- **Frontend Application:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000/api`
  - Healthcheck: `GET /api/health`
  - Complaints: `GET /api/complaints`, `POST /api/complaints`
  - Auth: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/demo-credentials/verify`
  - Officer Tasks: `GET /api/officer/tasks`, `PATCH /api/officer/tasks/:id/status`
  - Admin Analytics: `GET /api/admin/analytics`, `GET /api/admin/departments`
- **ML Microservice:** `http://localhost:8000`
  - Swagger Documentation: `http://localhost:8000/docs`
  - Prediction: `POST /predict`, `POST /check-duplicate`, `POST /estimate-resolution`

---

## 📄 License & Academic Attribution
Developed as a Major Final Year Engineering Project in Computer Science and Engineering. Open for academic review and demonstration.
