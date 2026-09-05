-- ==============================================================================
-- CITIZEN COMPLAINT & ISSUE MANAGEMENT SYSTEM SCHEMA
-- ==============================================================================

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    head_name TEXT,
    contact_email TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (Citizen, Officer, Admin)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('citizen', 'officer', 'admin')),
    phone TEXT,
    department_id INTEGER,
    ward TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 3. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_id TEXT NOT NULL UNIQUE,
    citizen_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected')),
    department_id INTEGER,
    officer_id INTEGER,
    latitude REAL DEFAULT 0.0,
    longitude REAL DEFAULT 0.0,
    address TEXT,
    ward TEXT,
    location_type TEXT DEFAULT 'Residential',
    affected_count INTEGER DEFAULT 10,
    image_url TEXT,
    resolution_image_url TEXT,
    resolution_notes TEXT,
    is_duplicate INTEGER DEFAULT 0,
    duplicate_of_id INTEGER,
    duplicate_similarity REAL DEFAULT 0.0,
    ml_confidence REAL DEFAULT 0.0,
    ml_predicted_category TEXT,
    ml_predicted_priority TEXT,
    predicted_resolution_days REAL DEFAULT 3.0,
    sla_deadline DATETIME,
    is_escalated INTEGER DEFAULT 0,
    escalation_level INTEGER DEFAULT 0 CHECK (escalation_level IN (0, 1, 2, 3)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (officer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (duplicate_of_id) REFERENCES complaints(id) ON DELETE SET NULL
);

-- 4. Complaint Timeline / Audit Log
CREATE TABLE IF NOT EXISTS complaint_timeline (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    updated_by_user_id INTEGER,
    updated_by_name TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Citizen Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id INTEGER NOT NULL UNIQUE,
    citizen_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE,
    FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for high-performance querying and GIS lookups
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_officer ON complaints(officer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_citizen ON complaints(citizen_id);
CREATE INDEX IF NOT EXISTS idx_complaints_ward ON complaints(ward);
CREATE INDEX IF NOT EXISTS idx_complaints_created ON complaints(created_at);
