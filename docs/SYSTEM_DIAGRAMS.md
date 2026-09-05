# SYSTEM ARCHITECTURE & DESIGN DIAGRAMS
## Smart Citizen Complaint and Issue Management System Using Machine Learning and Geospatial Analytics

---

### 1. System Architecture Diagram

```mermaid
graph TD
    subgraph Client_Layer ["Client Layer (React 18 + Vite + Leaflet GIS)"]
        CP[Citizen Portal]
        OP[Officer Field Queue]
        AP[Admin & GIS Dashboard]
    end

    subgraph Backend_Layer ["Backend Layer (Node.js + Express API)"]
        AUTH[JWT RBAC Authentication]
        COMP_CTRL[Complaint Controller]
        SLA_ENG[Automated SLA Escalation Engine]
        ANALYTICS[GIS & KPI Analytics Engine]
    end

    subgraph Database_Layer ["Database Layer (Relational Storage)"]
        DB[(Complaints, Users, Depts, Feedback, SLA)]
    end

    subgraph ML_Microservice ["Python FastAPI ML Microservice (Port 8000)"]
        M1[Model 1: Category Classifier<br/>TF-IDF + Logistic Regression]
        M2[Model 2: Priority Predictor<br/>Multi-Feature Random Forest]
        M3[Model 3: Duplicate Engine<br/>NLP Cosine + Haversine Geo]
        M4[Model 4: Resolution Regressor<br/>Random Forest Regressor]
    end

    CP -->|HTTP REST| COMP_CTRL
    OP -->|Status & Proof Photo| COMP_CTRL
    AP -->|Overrides & Filters| COMP_CTRL
    AP -->|Hotspot Query| ANALYTICS

    COMP_CTRL --> AUTH
    COMP_CTRL -->|SQL CRUD| DB
    SLA_ENG -->|Overdue Scan & Escalation| DB
    ANALYTICS -->|Aggregations| DB

    COMP_CTRL -->|Vector Inference Request| ML_Microservice
```

---

### 2. Data Flow Diagram (DFD Level 0 - Context Diagram)

```mermaid
graph LR
    Citizen((Citizen)) -->|1. Raw Complaint Text, Location Pin, Photo| System[CivicPulse AI System]
    System -->|2. Tracking ID & Real-time Timeline| Citizen
    System -->|3. Auto-Assigned Task with Navigation Coordinates| Officer((Field Officer))
    Officer -->|4. Resolution Status & Work Photo Proof| System
    System -->|5. GIS Heatmap, SLA Breaches & Performance KPIs| Admin((Municipal Admin))
    Admin -->|6. Department Overrides & Manual Reassignments| System
```

---

### 3. Data Flow Diagram (DFD Level 1 - Detailed Complaint Processing)

```mermaid
graph TD
    Citizen((Citizen)) -->|Enter Issue Text & GPS Pin| P1[1.0 Smart Intake & Preview]
    P1 -->|Query Model API| ML_SVC[ML Microservice]
    ML_SVC -->|Category, Priority, Duplicate Score| P1
    
    P1 -->|Submit Final Form| P2[2.0 Triage & Auto-Routing]
    P2 -->|Check Overlap| P3[3.0 Duplicate Filter]
    P3 -->|Store New Ticket| D1[(Complaints Database)]
    P2 -->|Assign Officer by Ward| D1
    
    D1 -->|Hourly Cron| P4[4.0 SLA Watchdog Engine]
    P4 -->|Overdue Tickets| P5[5.0 Multi-Tier Escalation]
    P5 -->|Update Level & Timeline| D1
    
    D1 -->|Active Queue| Officer((Field Officer))
    Officer -->|Submit Proof Photo| P6[6.0 Resolution Verification]
    P6 -->|Mark Resolved| D1
    P6 -->|Notify Citizen| Citizen
```

---

### 4. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    DEPARTMENTS ||--o{ USERS : employs
    DEPARTMENTS ||--o{ COMPLAINTS : manages
    USERS ||--o{ COMPLAINTS : submits
    USERS ||--o{ COMPLAINTS : "assigned to"
    COMPLAINTS ||--o{ COMPLAINT_TIMELINE : contains
    COMPLAINTS ||--o| FEEDBACK : receives
    USERS ||--o{ NOTIFICATIONS : receives

    DEPARTMENTS {
        int id PK
        string name
        string code
        string head_name
        string contact_email
        string description
    }

    USERS {
        int id PK
        string name
        string email
        string password_hash
        string role
        string phone
        string ward
        int department_id FK
    }

    COMPLAINTS {
        int id PK
        string tracking_id UK
        int citizen_id FK
        string title
        string description
        string category
        string priority
        string status
        int department_id FK
        int officer_id FK
        float latitude
        float longitude
        string address
        string ward
        string image_url
        string resolution_image_url
        string resolution_notes
        int is_duplicate
        float duplicate_similarity
        float ml_confidence
        float predicted_resolution_days
        datetime sla_deadline
        int is_escalated
        int escalation_level
    }

    COMPLAINT_TIMELINE {
        int id PK
        int complaint_id FK
        string status
        string notes
        string updated_by_name
        datetime timestamp
    }

    FEEDBACK {
        int id PK
        int complaint_id FK
        int citizen_id FK
        int rating
        string comment
        datetime created_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        string title
        string message
        string link
        int is_read
    }
```
