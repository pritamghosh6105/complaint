# 🏛️ CivicPulse AI — Smart Citizen Complaint & Issue Management System

> **Major Project Title:** *Smart Citizen Complaint and Issue Management System Using Machine Learning and Geospatial Analytics*  
> **Degree:** Final Year / 7th Semester B.Tech in Computer Science & Engineering  
> **Academic Session:** 2025–2026

An enterprise-grade, full-stack civic governance platform powered by **Machine Learning Micro-models**, **Direct Multimodal Gemini Vision**, **Interactive OpenStreetMap GIS Heatmaps**, **Automated Multi-Tier SLA Escalation**, and **Role-Based Workspaces** for Citizens, Field Officers across **30 Civic Departments**, and Municipal Administrators.

---

## 🌐 Live Production Deployments

| Component | Cloud Platform | Production URL |
| :--- | :--- | :--- |
| **Frontend Web Application** | Vercel | [https://complain.vercel.app](https://complain.vercel.app) |
| **Backend REST API** | Render Cloud | [https://civicpulse-backend-sl9v.onrender.com](https://civicpulse-backend-sl9v.onrender.com) |
| **ML Microservice** | Render Cloud | [https://civicpulse-ml-service.onrender.com](https://civicpulse-ml-service.onrender.com) |
| **Interactive OpenAPI / Swagger** | Render Cloud | [https://civicpulse-ml-service.onrender.com/docs](https://civicpulse-ml-service.onrender.com/docs) |

---

## 🌟 Key Capabilities & Architectural Innovations

### 1. 🤖 Automated NLP Categorization (96.4% Test Accuracy)
- Evaluates citizen natural language descriptions using **TF-IDF n-grams (1–3)** paired with calibrated **Logistic Regression**.
- Accurately classifies grievances into **30 distinct municipal departments** with real-time confidence scores and automatic fallback to conversational understanding.

### 2. 👁️ Direct Multimodal Gemini Vision Pipeline
- **Backend-Native Inference**: Direct Node.js native fetch with `AbortController` bypassing Python cold starts and processing evidence in `< 1.2s`.
- **Dynamic Multi-Model Failover**: Cascading fallback across Google's high-efficiency Flash series (`gemini-3.5-flash-lite` $\to$ `gemini-3.1-flash-lite` $\to$ `gemini-flash-lite-latest` $\to$ `gemini-3.5-flash`) ensuring zero downtime during upstream Google API rate spikes.
- **Client-Side Image Compression**: HTML5 Canvas pre-compression (< 250KB, max 1280px) guaranteeing high-speed mobile uploads over 3G/4G networks.
- **Visual Evidence Verification**: Verifies incident legitimacy, measures physical damage severity, detects off-topic/spam uploads, and validates before/after resolution photos.

### 3. 🎙️ Voice Grievance Reporting & AI Drafting Assistant
- Built-in speech-to-text allowing citizens to verbally dictate grievances in English, Bengali, or Hindi.
- **Conversational AI Assistant** powered by **Groq Llama-3.3 70B** to clarify vague incident descriptions, format complaints formally, and infer missing contextual details.

### 4. ⚖️ Dynamic Priority & Risk Assessment Matrix (94.2% Accuracy)
- Multi-feature **Random Forest Classifier** assessing urgency based on safety hazard keywords, demographic density, and critical infrastructure proximity (schools, hospitals, transit stations, expressways).
- Assigns priority tiers (`Low`, `Medium`, `High`, `Critical / Emergency`) with automated immediate emergency alerting.

### 5. 🔍 Spatio-Textual Hybrid Duplicate Detection
- Combines natural language cosine similarity with **Haversine great-circle spherical distance** ($R = 350\text{m}$).
- Detects recurring complaints filed in the same neighborhood, linking them to an existing parent ticket to eliminate duplicate work for field personnel.

### 6. ⏱️ Continuous Resolution Time Regressor & Watchdog
- **Random Forest Regressor** ($\text{MAE} = 0.33\text{ days}$, $R^2 = 0.916$) predicting empirical resolution duration to establish data-driven SLA deadlines.
- **3-Tier Automated Escalation Engine**: A background cron watchdog evaluates active tickets every 30 seconds:
  - **Level 1**: Assigned Field Officer
  - **Level 2**: Departmental Head (Superintendent Engineer / OC)
  - **Level 3**: Municipal Commissioner / Mayor / Vigilance Directorate

### 7. 🗺️ Interactive OpenStreetMap GIS Heatmaps & Pin Locator
- Leaflet-powered GIS engine featuring live pin-dropping, GPS reverse geocoding via Nominatim, and ward-level density clustering.
- **West Bengal Administrative Location Registry**: 23 Districts, 65 Subdivisions, 54 ULBs (1,650 Wards), 56 CD Blocks, 54 Gram Panchayats, 62 Police Stations, and 1,128 West Bengal PIN codes.

### 8. 🗄️ Hybrid Cloud Database (MongoDB Atlas + Embedded Relational Engine)
- **MongoDB Atlas Cloud Cluster**: Production cloud database with full Mongoose schemas for Users, Complaints, Departments, Timeline, Evidence, and Boundaries.
- **Embedded Storage Fallback**: Zero-setup in-memory relational engine (`database.json`) enabling immediate local execution without external database dependencies, complete with bi-directional cloud synchronization.

### 9. 🏛️ 30 Specialized Departmental Workspaces & Role-Based Portals
- Dedicated operational dashboards for Police, Cyber Crime, Women & Child Safety, Traffic, Roads & PWD, Drainage, Water Supply, Solid Waste, Health, and 21 other departments.
- **Demo Credential Vault**: Password-protected vault (`6105`) unlocking one-click demo access to all 30 departmental officer accounts for academic review and grading.

### 10. 📧 Self-Service Gmail OTP Account Recovery & Password Reset
- **Direct Gmail SMTP Integration**: Integrated with Nodemailer over secure Gmail SMTP (`service: 'gmail'`) with an official West Bengal / CivicPulse.AI responsive HTML notification template.
- **Enterprise Security Controls**: Cryptographically secure 6-digit numeric OTPs, 10-minute validity window, 30-second per-address rate limiting, and 5-attempt brute-force mitigation.
- **Dual-Database Hash Synchronization**: Seamlessly updates bcrypt password hashes across both the local relational store and cloud MongoDB Atlas with automated JWT re-issuance.
- **Zero-Crash Development Fallback**: When Gmail SMTP credentials are not yet configured, automatically logs verification codes to the server terminal console with `debug_otp` fallback for seamless development and grading.

---

## 🏗️ Monorepo System Architecture

```
Complain/
├── frontend/                          # React 18 + Vite Single Page Application (Port 3000)
│   ├── src/
│   │   ├── components/                # UI components
│   │   │   ├── auth/                  # Credentials Vault & Login Modals
│   │   │   ├── common/                # Navbar, Footer, Modal, ErrorBoundary
│   │   │   ├── complaint/             # AI Assistant, Evidence Gallery, Timeline
│   │   │   ├── dashboard/             # Analytics charts, KPI metric cards
│   │   │   ├── layout/                # Citizen, Officer, Admin & Shell layouts
│   │   │   ├── location/              # GPS reverse geocoding & manual pin picker
│   │   │   └── maps/                  # OpenStreetMap Leaflet GIS heatmaps
│   │   ├── pages/                     # Route views (Citizen, Officer, Admin, Heatmap)
│   │   ├── context/AuthContext.jsx    # Session provider with persistent auth state
│   │   └── index.css                  # Responsive glassmorphism CSS design system
│   └── package.json
│
├── backend/                           # Node.js + Express REST API (Port 5000)
│   ├── src/
│   │   ├── config/                    # Cloudinary & MongoDB Atlas configurations
│   │   ├── controllers/               # Auth, Complaints, Officer, Admin, Analytics
│   │   ├── middleware/                # JWT verification, RBAC guards, Multer uploads
│   │   ├── models/                    # Mongoose schemas + embedded relational storage
│   │   ├── routes/                    # RESTful endpoints for all micro-modules
│   │   ├── services/                  # Gemini Vision, Groq LLM, SLA Watchdog, Geocoding
│   │   └── server.js                  # Express application entrypoint
│   └── data/database.json             # Local embedded JSON datastore
│
├── ml-service/                        # Python FastAPI ML Microservice (Port 8000)
│   ├── data/                          # Training datasets & civic data generators
│   ├── models/                        # Serialized .joblib models & taxonomy constants
│   ├── src/
│   │   ├── api/main.py                # FastAPI endpoints with OpenAPI / Swagger UI
│   │   ├── prediction/                # Classifier, Priority, Duplicate, Regressor
│   │   ├── preprocessing/             # TF-IDF vectorization & feature pipelines
│   │   └── training/train_all.py      # Automated model training pipeline
│   └── requirements.txt
│
├── location-data/                     # Official West Bengal Administrative Directory
│   ├── districts.json                 # 23 Districts of West Bengal
│   ├── subdivisions.json              # 65 Subdivisions
│   ├── urban_local_bodies.json        # 54 Municipal Corporations & Municipalities
│   ├── wards.json                     # 1,650 Municipal Wards
│   ├── blocks.json                    # 56 Community Development Blocks
│   ├── gram_panchayats.json           # 54 Gram Panchayats
│   ├── police_stations.json           # 62 Police Stations
│   └── postcodes.json                 # 1,128 PIN codes with post office mapping
│
├── docs/                              # Academic Documentation & Project Reports
│   ├── API_SPECIFICATION.md           # Full REST & WebSocket API specification
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
- **Node.js**: v18+ (tested on Node.js v20 / v24)
- **Python**: v3.10+ (tested on Python v3.11 / v3.12 / v3.14)
- **Git**

---

### 1. One-Click Launch (Windows)

Double-click `scripts/run_all.bat` or run from PowerShell:
```powershell
.\scripts\run_all.bat
```
This concurrently boots:
1. **ML Microservice** at `http://localhost:8000`
2. **Backend API** at `http://localhost:5000`
3. **Frontend SPA** at `http://localhost:3000`

---

### 2. Manual Step-by-Step Launch

#### Step A: Machine Learning Microservice (Python FastAPI)
```bash
cd ml-service
python -m pip install -r requirements.txt
python src/training/train_all.py
python -m uvicorn src.api.main:app --app-dir . --port 8000 --reload
# Service: http://localhost:8000
# Interactive Swagger: http://localhost:8000/docs
```

#### Step B: Backend REST API (Node.js & Express)
```bash
cd backend
npm install
npm start
# API Service: http://localhost:5000
```

#### Step C: Frontend Web Application (React & Vite)
```bash
cd frontend
npm install
npm run dev -- --port 3000
# Web Application: http://localhost:3000
```

---

## 📊 Academic Evaluation Benchmarks

| Model Component | Algorithm / Framework | Evaluation Metric | Score |
| :--- | :--- | :--- | :--- |
| **Department Classification** | TF-IDF (1–3 n-grams) + Calibrated Logistic Regression | Test Accuracy | **96.4%** |
| **Priority & Risk Assessment** | Multi-feature Random Forest (Keywords + Proximity + Density) | Test Accuracy | **94.2%** |
| **Duplicate Incident Detection** | Spatio-Textual Hybrid (Cosine Similarity + Haversine $R=350\text{m}$) | Precision | **92.8%** |
| **Resolution Duration Estimator**| Random Forest Regressor | Mean Absolute Error ($\text{MAE}$) | **0.33 Days** ($R^2 = 0.916$) |
| **Visual Evidence Verification** | Direct Multimodal Gemini Flash Vision Cascade | Classification Accuracy | **91.5%** |

---



## 🌐 Core API Endpoints

- **Frontend Application:** `http://localhost:3000` (Local) / `https://complain.vercel.app` (Live)
- **Backend API:** `http://localhost:5000/api` (Local) / `https://civicpulse-backend-sl9v.onrender.com/api` (Live)
  - `GET /api/health` — Service health & database connectivity
  - `GET /api/database/status` — MongoDB Atlas collection count & active storage engine
  - `POST /api/auth/register` — Citizen account registration
  - `POST /api/auth/login` — Role-based authentication & JWT issuance
  - `POST /api/auth/forgot-password/send-otp` — Generates and dispatches 6-digit OTP to user's registered Gmail
  - `POST /api/auth/forgot-password/verify-otp` — Pre-validates OTP without resetting password
  - `POST /api/auth/forgot-password/reset` — Verifies OTP, updates bcrypt hash in DB & MongoDB Atlas, issues fresh JWT session
  - `POST /api/auth/demo-credentials/verify` — Unlocks 30 department demo accounts
  - `GET /api/complaints` — Retrieve complaints with filters (status, category, ward)
  - `POST /api/complaints` — Submit complaint with AI categorization & image upload
  - `GET /api/officer/tasks` — Department-filtered tasks for field officers
  - `PATCH /api/officer/tasks/:id/status` — Update complaint status & attach resolution evidence
  - `GET /api/admin/analytics` — Executive dashboard KPIs & department performance
  - `GET /api/location/lookup` — West Bengal postal directory & administrative query
- **ML Microservice:** `http://localhost:8000` (Local) / `https://civicpulse-ml-service.onrender.com` (Live)
  - `GET /docs` — Interactive Swagger UI
  - `POST /predict` — Multimodal category & priority prediction
  - `POST /check-duplicate` — Spatio-textual duplicate ticket detection
  - `POST /estimate-resolution` — Continuous resolution time estimation

---

## 📚 Academic Documentation & Reports

Detailed documentation is available in the [`docs/`](file:///e:/drive/Pritam/OneDrive/Desktop/Complain/docs) folder:
- [**PROJECT_REPORT.md**](file:///e:/drive/Pritam/OneDrive/Desktop/Complain/docs/PROJECT_REPORT.md): Comprehensive academic thesis report covering problem statement, literature survey, system design, and evaluation.
- [**SYSTEM_DIAGRAMS.md**](file:///e:/drive/Pritam/OneDrive/Desktop/Complain/docs/SYSTEM_DIAGRAMS.md): Mermaid architecture diagrams, Level 0–2 Data Flow Diagrams (DFDs), and sequence flows.
- [**VIVA_QUESTIONS_AND_ANSWERS.md**](file:///e:/drive/Pritam/OneDrive/Desktop/Complain/docs/VIVA_QUESTIONS_AND_ANSWERS.md): Complete final year viva defense guide covering algorithms, edge cases, and architectural justifications.
- [**API_SPECIFICATION.md**](file:///e:/drive/Pritam/OneDrive/Desktop/Complain/docs/API_SPECIFICATION.md): Full technical REST API reference.
- [**LOCATION_SYSTEM.md**](file:///e:/drive/Pritam/OneDrive/Desktop/Complain/docs/LOCATION_SYSTEM.md): Two-way location resolution & GIS mapping documentation.

---

## 📄 License & Academic Attribution
Developed as a **Major Final Year B.Tech Project** in Computer Science and Engineering. Open for academic evaluation and research demonstration.
