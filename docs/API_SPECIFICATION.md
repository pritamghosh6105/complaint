# REST API SPECIFICATION
## Smart Citizen Complaint and Issue Management System

Base URL: `http://localhost:5000/api`  
ML Service URL: `http://localhost:8000`

---

### 1. Authentication Endpoints (`/api/auth`)

#### `POST /api/auth/register`
Creates a new citizen account.
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "password123",
  "phone": "+91 98765 43210",
  "ward": "Ward 4"
}
```

#### `POST /api/auth/login`
Authenticates a user and returns a JWT token.
```json
{
  "email": "citizen@demo.com",
  "password": "password123"
}
```

#### `GET /api/auth/me`
Headers: `Authorization: Bearer <JWT_TOKEN>`  
Returns the authenticated user profile and assigned department if applicable.

---

### 2. Complaint Endpoints (`/api/complaints`)

#### `POST /api/complaints/preview-ml`
Real-time AI prediction preview.
```json
{
  "text": "Deep pothole on Station Road causing two-wheelers to slip.",
  "latitude": 22.9751,
  "longitude": 88.4342,
  "location_type": "Highway",
  "severity": "High",
  "ward": "Ward 4",
  "affected_count": 200
}
```

#### `POST /api/complaints`
Headers: `Authorization: Bearer <JWT_TOKEN>`, `Content-Type: multipart/form-data`  
Submits a new complaint, triggers ML analysis, calculates SLA deadline, and auto-routes to department.

#### `GET /api/complaints/my`
Headers: `Authorization: Bearer <JWT_TOKEN>`  
Returns all complaints submitted by the authenticated citizen.

#### `GET /api/complaints/public`
Returns sanitized complaints list for the public interactive city map.

#### `GET /api/complaints/:id`
Headers: `Authorization: Bearer <JWT_TOKEN>`  
Returns complaint details, full audit timeline stepper, and citizen feedback.

---

### 3. Officer Taskforce Endpoints (`/api/officer`)
Headers: `Authorization: Bearer <JWT_TOKEN>` (Role: `officer` or `admin`)

#### `GET /api/officer/tasks`
Returns task queue assigned to the field officer.

#### `PATCH /api/officer/tasks/:id/status`
Updates status to `In Progress` or `Resolved` (with photo upload `resolution_image` and notes).

---

### 4. Admin Portal Endpoints (`/api/admin`)
Headers: `Authorization: Bearer <JWT_TOKEN>` (Role: `admin`)

#### `GET /api/admin/complaints`
Query parameters: `status`, `category`, `priority`, `department_id`, `ward`, `is_escalated`, `search`.

#### `PATCH /api/admin/complaints/:id/department`
Manual department override.
```json
{
  "department_id": 2,
  "reason": "Re-routing from PWD to Solid Waste after physical inspection"
}
```

#### `PATCH /api/admin/complaints/:id/officer`
Assigns or reassigns a field officer.
```json
{
  "officer_id": 3
}
```

#### `POST /api/admin/sla/evaluate`
Manually triggers the automated SLA watchdog to evaluate overdue tickets and escalate levels.

---

### 5. Analytics & GIS Endpoints (`/api/analytics`)

#### `GET /api/analytics/kpis`
Returns total counts, in-progress, resolved, SLA breaches, and avg resolution days.

#### `GET /api/analytics/breakdown`
Returns category and priority distribution charts.

#### `GET /api/analytics/departments`
Returns department leaderboard and SLA compliance rates.

#### `GET /api/analytics/gis-heatmap`
Returns geospatial coordinates with intensity weights for map heatmap rendering.

#### `GET /api/analytics/ml-metrics`
Returns test accuracy, macro F1, and model performance metrics.
