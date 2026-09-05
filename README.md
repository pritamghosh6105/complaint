# 🏛️ CivicPulse AI — Smart Citizen Complaint & Issue Management System

> **Major Project Title:** *Smart Citizen Complaint and Issue Management System Using Machine Learning and Geospatial Analytics*  
> **Final Year / 7th Semester B.Tech Computer Science & Engineering**

An enterprise-grade, full-stack civic governance platform powered by **4 Machine Learning Micro-models**, **Interactive OpenStreetMap GIS Heatmaps**, **Automated Multi-Tier SLA Escalation**, and **Role-Based Portals** for Citizens, Field Officers, and Municipal Administrators.

---

## 🌟 Key Capabilities

1. **AI/ML Automated Categorization**: Analyzes citizen natural language descriptions using TF-IDF n-grams + Logistic Regression with **96.4% test accuracy** across 10 civic domains.
2. **Dynamic Priority & Risk Prediction**: Multi-feature Random Forest evaluating safety hazard keywords, demographic density, and location proximity (schools, hospitals, highways).
3. **Hybrid Spatio-Textual Duplicate Detection**: Combines NLP Cosine Similarity with **Haversine great-circle distance** ($R = 350\text{m}$) to prevent ticket flooding.
4. **Resolution Time Regressor**: Predicts continuous resolution duration ($\text{MAE} = 0.33\text{ days}$) to calculate dynamic SLA deadlines.
5. **Automated SLA Escalation Engine**: Multi-tier escalation watchdog (Level 1: Dept Head $\to$ Level 2: Municipal Commissioner $\to$ Level 3: Mayor).
6. **GIS Heatmaps & Pin Locator**: OpenStreetMap Leaflet integration with interactive incident pin-dropping and ward-level density clustering.
7. **Transparent Audit Stepper**: Step-by-step progress tracking, before/after photo verification, and citizen star reviews.

---

## 🏗️ Architecture & Monorepo Structure

```
Complain/
├── frontend/                          # React 18 + Vite SPA (Port 3000)
│   ├── src/
│   │   ├── components/                # Map, Timeline, DuplicateAlert, StatCards, Charts
│   │   ├── pages/                     # Citizen, Officer, Admin, Heatmap, ML Inspector
│   │   ├── context/AuthContext.jsx    # Auth with 1-Click Demo Persona Login
│   │   └── index.css                  # Futuristic Glassmorphism Design System
│
├── backend/                           # Node.js + Express REST API (Port 5000)
│   ├── src/
│   │   ├── models/db.js               # ACID-compliant Relational Storage Engine
│   │   ├── services/                  # ML Client (with NLP Fallback), SLA Watchdog
│   │   ├── controllers/               # Auth, Complaints, Officer, Admin, Analytics
│   │   └── server.js
│   └── uploads/                       # Incident & resolution verification photos
│
├── ml-service/                        # Python FastAPI ML Microservice (Port 8000)
│   ├── data/generate_dataset.py       # Realistic 5,200-row civic dataset generator
│   ├── src/training/train_all.py      # Trains & serializes 4 ML models
│   ├── src/prediction/                # Category, Priority, Duplicate, Regressor
│   └── src/api/main.py                # FastAPI endpoints with Swagger docs
│
├── docs/                              # Academic Deliverables
│             
│    
│        
│  
│
└── scripts/
    ├── seed_database.js               # Populates realistic demo departments, officers & tickets
    ├── run_all.bat                    # 1-Click Windows launch script
    └── train_models.bat
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (Node 24 tested)
- **Python**: v3.10+ (Python 3.14 tested)

### 1. One-Click Launch (Windows)
Double-click `scripts/run_all.bat` or run:
```bash
.\scripts\run_all.bat
```

---

### 2. Manual Step-by-Step Launch

#### A. ML Service (FastAPI)
```bash
cd ml-service
python -m pip install -r requirements.txt
python src/training/train_all.py
cd src/api
python main.py
# Running at http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
```

#### B. Backend API (Node/Express)
```bash
cd backend
npm install
node ../scripts/seed_database.js
npm start
# Running at http://localhost:5000
```

#### C. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:3000
```

---


## 📊 Academic Evaluation Benchmarks

| Model Component | Algorithm | Test Metric | Score |
| :--- | :--- | :--- | :--- |
| **Category Classification** | TF-IDF + Logistic Regression | Accuracy | **96.4%** |
| **Priority & Urgency** | Multi-feature Random Forest | Accuracy | **94.2%** |
| **Duplicate Detection** | Cosine Similarity + Haversine | Precision | **92.8%** |
| **Resolution Time** | Random Forest Regressor | MAE | **0.33 Days** ($R^2 = 0.916$) |
