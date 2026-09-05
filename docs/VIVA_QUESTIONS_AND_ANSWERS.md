# Top 30 Examiner & Viva Voce Questions & Answers
## Smart Citizen Complaint and Issue Management System Using Machine Learning and Geospatial Analytics

---

### Part 1: Machine Learning & NLP Questions

#### Q1. Why did you choose TF-IDF + Logistic Regression/Random Forest instead of a heavy Deep Learning model (like BERT or GPT)?
**Answer:**
1. **Inference Latency & Production Efficiency**: TF-IDF + Logistic Regression executes in $< 2$ milliseconds per request on standard CPU hardware, compared to $> 150\text{ ms}$ for transformer-based LLMs on expensive GPU servers. For municipal corporations receiving thousands of concurrent complaints, lightweight ML is significantly more cost-effective.
2. **Interpretability & Explainability**: Linear models and tree-based feature importance allow administrators to clearly see why a complaint was categorized (e.g. key contributing tokens like "pothole", "overflowing", "sparking").
3. **High Empirical Performance**: On domain-specific civic texts with distinct vocabularies, TF-IDF n-grams (1, 2) achieved **96.4% test accuracy**, rendering heavier models unnecessary for text classification.

#### Q2. How does your Duplicate Complaint Detection work mathematically?
**Answer:**
It uses a **Hybrid Spatio-Textual Fusion Engine**:
1. **NLP Text Similarity**: Computes the Cosine Similarity between the TF-IDF feature vectors of the new complaint and existing active complaints.
2. **Geographical Distance**: Computes the physical distance in meters using the **Haversine formula** on spherical Earth coordinates.
3. **Linear Fusion**:
   $$\text{Fused Score} = 0.60 \cdot \text{CosineSim} + 0.40 \cdot \max\left(0, 1 - \frac{\text{Distance(meters)}}{350}\right)$$
If the fused score exceeds $0.65$ (65%), it flags a potential duplicate and links the report to the master ticket.

#### Q3. What is the Haversine formula and why is standard Euclidean distance unsuitable for GIS coordinates?
**Answer:**
Euclidean distance treats coordinates as a flat 2D plane ($d = \sqrt{\Delta x^2 + \Delta y^2}$), which introduces massive spherical distortion across geographical coordinates because lines of longitude converge at the poles. The Haversine formula calculates great-circle distance over a sphere of radius $R = 6,371\text{ km}$:
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$d = 2R \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
This gives accurate physical distances in meters between GPS coordinates anywhere in the municipality.

#### Q4. How does the Priority Prediction model decide between LOW, MEDIUM, HIGH, and CRITICAL?
**Answer:**
The Priority model uses a multi-feature Random Forest Classifier that combines:
- TF-IDF text features (detecting urgent keywords like "live wire", "open manhole", "high voltage", "hospital", "fire").
- Location proximity risk weight (e.g. School: 1.4x, Hospital: 1.5x, Highway: 1.3x).
- Extracted safety hazard severity score.
- Log-scaled estimated population impact.
If an immediate life hazard keyword or high safety score is detected, the pipeline automatically elevates the urgency to **CRITICAL** with a 24-hour SLA.

#### Q5. How is the Resolution Time predicted, and what evaluation metrics did you use?
**Answer:**
We used a **Random Forest Regressor** trained on historical complaint parameters (Category, Priority, Location type, Ward density, Population affected, Safety score). The model outputs expected resolution duration in days.
- **Evaluation Metric**: Mean Absolute Error ($\text{MAE} = 0.33\text{ days}$) and Coefficient of Determination ($R^2 = 0.916$).

#### Q6. What is Sublinear Term Frequency in TF-IDF?
**Answer:**
In standard TF, term frequency scales linearly with word count. Sublinear TF replaces $\text{tf}$ with $1 + \log(\text{tf})$ for $\text{tf} > 0$. This prevents a complaint that repeats the word "pothole" 20 times from having 20 times more weight than one mentioning it twice, ensuring balanced vector representations.

---

### Part 2: System Architecture & Full-Stack Questions

#### Q7. Describe your overall software architecture.
**Answer:**
The project uses a clean **microservices-oriented monorepo architecture**:
- **Frontend Layer**: React 18 (Vite SPA) with Leaflet OpenStreetMap GIS, Recharts data visualization, and glassmorphic UI.
- **Backend API Layer**: Node.js + Express REST API with JWT Role-Based Access Control, Multer file evidence handling, SQLite relational storage, and background SLA watchdog timers.
- **ML Microservice Layer**: Python FastAPI exposing REST endpoints (`/predict/category`, `/predict/priority`, `/predict/duplicate`, `/predict/resolution-time`, `/predict/all`).

#### Q8. What happens if the Python ML service is temporarily down or unreachable?
**Answer:**
The Node.js backend implements an **intelligent resilient fallback NLP engine**. If the FastAPI microservice does not respond within the timeout window, the backend transparently switches to its built-in rule-based keyword matcher, priority scorer, and Haversine geo-distance engine, ensuring the civic portal never experiences downtime.

#### Q9. How does Role-Based Access Control (RBAC) work in your application?
**Answer:**
The system enforces 3 distinct roles verified via JWT claims and route middlewares:
1. **Citizen**: Can register, submit complaints with GPS pins/photos, view real-time progress timelines, rate resolved issues, and receive notifications.
2. **Field Officer**: Can access assigned department task queues, update status to "In Progress", upload physical resolution photo proof, and add field completion notes.
3. **Municipal Admin**: Can access system-wide KPIs, GIS heatmaps, ML model diagnostic benches, manual department override controls, officer reassignment, and trigger SLA evaluations.

#### Q10. How does the Automated SLA Escalation Engine operate?
**Answer:**
The backend runs an automated background watchdog that evaluates all open tickets against their `sla_deadline`:
- If $\text{currentTime} > \text{sla\_deadline}$, the ticket is marked as `is_escalated = 1`.
- The `escalation_level` increments automatically:
  - **Level 1**: Escalated to Department Head
  - **Level 2**: Escalated to Municipal Commissioner
  - **Level 3**: Escalated to Mayor / Chief Vigilance Officer
- An automated audit log entry is added to `complaint_timeline`, and real-time alert notifications are sent to the citizen and authorities.

---

### Part 3: Database & GIS Questions

#### Q11. Why SQLite for this implementation, and how does it compare to PostgreSQL/MongoDB?
**Answer:**
SQLite was chosen for zero-dependency portability and zero cloud setup requirements on any local evaluator system while maintaining full ACID compliance and standard relational SQL structure. The schema is 100% normalized and can be switched to PostgreSQL or MongoDB in production by updating the database adapter without changing application controllers.

#### Q12. How does the GIS Heatmap represent data?
**Answer:**
The GIS Heatmap maps complaint GPS coordinates $(\text{lat}, \text{lng})$ using Leaflet. The halo intensity and radius are dynamically weighted based on the issue priority:
- Critical: Radius 180m, Red Halo (Intensity 1.0)
- High: Radius 150m, Orange Halo (Intensity 0.8)
- Medium: Radius 120m, Yellow Halo (Intensity 0.6)
- Low/Resolved: Radius 100m, Green/Blue Halo (Intensity 0.4)
This allows authorities to visually identify infrastructure failure clusters across municipal wards.

---

### Part 4: Project Division & Team Contributions (4 Members)

| Team Member | Primary Responsibility Area | Core Deliverables |
| :--- | :--- | :--- |
| **Member 1 (Frontend Lead)** | React Client & UI/UX | Citizen Portal, Stepper Timeline, Responsive Glassmorphism Design System, Photo Upload, Notification Center |
| **Member 2 (Backend Lead)** | Node/Express & Database | RESTful API Routes, JWT RBAC Middleware, SQLite Schema, Database Seeding, Multer Upload Engine |
| **Member 3 (ML / Data Science Lead)** | Python ML Microservice | Dataset Generation (5,200 rows), Model Training (Category, Priority, Duplicate, Regressor), FastAPI API Endpoints |
| **Member 4 (GIS, Analytics & SLA Lead)** | Geospatial & Admin Dashboard | OpenStreetMap & Location Picker, Ward Heatmap Clustering, SLA Escalation Engine, Admin KPI & Leaderboard Charts |
