import os
import sys
import json
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure path resolution
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(current_dir, "../..")))

from src.prediction.category_predictor import CategoryPredictor, CATEGORY_DEPARTMENT_MAP
from src.prediction.priority_predictor import PriorityPredictor
from src.prediction.duplicate_engine import DuplicateEngine
from src.prediction.resolution_predictor import ResolutionPredictor

app = FastAPI(
    title="CivicPulse AI ML Service",
    description="30-Department Machine Learning Service for Complaint Categorization, Subcategory Inference, Priority Prediction, Geospatial Duplicate Detection, and Resolution Estimation.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Predictors
category_predictor = CategoryPredictor()
priority_predictor = PriorityPredictor()
duplicate_engine = DuplicateEngine()
resolution_predictor = ResolutionPredictor()

# ----------------- Request Models -----------------
class CategoryRequest(BaseModel):
    text: str = Field(..., example="My UPI account was used to transfer ₹25,000 without permission.")

class PriorityRequest(BaseModel):
    text: str = Field(..., example="Open live wire sparking near school gate with heavy rain.")
    category: Optional[str] = "Electricity & Power"
    subcategory: Optional[str] = "Live Wire Hazard"
    severity: Optional[str] = "High"
    location_type: Optional[str] = "School"
    affected_count: Optional[int] = 200

class DuplicateRequest(BaseModel):
    text: str = Field(..., example="Deep hole on Station road near ticket counter.")
    latitude: float = Field(..., example=22.9751)
    longitude: float = Field(..., example=88.4342)
    existing_complaints: List[Dict[str, Any]] = []
    threshold: Optional[float] = 0.65
    model_config = {"extra": "allow"}

class ResolutionRequest(BaseModel):
    category: str = "Roads & Public Works"
    subcategory: Optional[str] = "Pothole / Crater"
    priority: str = "MEDIUM"
    location_type: str = "Residential"
    ward: str = "Ward 4"
    affected_count: int = 50
    text: Optional[str] = ""
    model_config = {"extra": "allow"}

class AllInOneRequest(BaseModel):
    text: str = Field(..., example="Someone stole my motorcycle from outside hospital parking.")
    latitude: Optional[float] = 22.9750
    longitude: Optional[float] = 88.4340
    severity: Optional[str] = "High"
    location_type: Optional[str] = "Hospital"
    ward: Optional[str] = "Ward 12"
    affected_count: Optional[int] = 100
    existing_complaints: Optional[List[Dict[str, Any]]] = []
    model_config = {"extra": "allow"}

# ----------------- Endpoints -----------------
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "CivicPulse AI ML Service (30 Departments)",
        "version": "2.0.0",
        "models_loaded": {
            "category_model": category_predictor.cat_model is not None,
            "subcategory_model": category_predictor.subcat_model is not None,
            "priority_model": priority_predictor.model is not None,
            "duplicate_engine": duplicate_engine.vectorizer is not None,
            "resolution_model": resolution_predictor.model is not None
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/taxonomy")
def get_taxonomy():
    """Returns all 30 departments with their subcategories and emergency helplines."""
    taxonomy_path = os.path.join(current_dir, "../../models/taxonomy.json")
    if os.path.exists(taxonomy_path):
        with open(taxonomy_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {"categories": data, "departments_map": CATEGORY_DEPARTMENT_MAP}
    return {"categories": {}, "departments_map": CATEGORY_DEPARTMENT_MAP}

@app.get("/metrics")
def get_metrics():
    metrics_path = os.path.join(current_dir, "../../models/model_metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"message": "Metrics will be available after running training."}

@app.post("/predict/category")
def predict_category(req: CategoryRequest):
    return category_predictor.predict(req.text)

@app.post("/predict/priority")
def predict_priority(req: PriorityRequest):
    return priority_predictor.predict(
        text=req.text,
        category=req.category or "Roads & Public Works",
        severity=req.severity or "Medium",
        location_type=req.location_type or "Residential",
        affected_count=req.affected_count or 50
    )

@app.post("/predict/duplicate")
def check_duplicate(req: DuplicateRequest):
    raw_list = [item if isinstance(item, dict) else item.model_dump() for item in req.existing_complaints]
    return duplicate_engine.check_duplicate(
        new_text=req.text,
        new_lat=req.latitude,
        new_lng=req.longitude,
        existing_complaints=raw_list,
        threshold=req.threshold or 0.65
    )

@app.post("/predict/resolution-time")
def predict_resolution_time(req: ResolutionRequest):
    return resolution_predictor.predict(
        category=req.category,
        priority=req.priority,
        location_type=req.location_type,
        ward=req.ward,
        affected_count=req.affected_count,
        text=req.text or ""
    )

@app.post("/predict/all")
def predict_all(req: AllInOneRequest):
    """
    Composite endpoint performing category prediction, subcategory inference,
    priority prediction, duplicate check, and resolution time estimation in a single call.
    """
    # 1. Category & Subcategory Prediction
    cat_res = category_predictor.predict(req.text)
    category = cat_res.get("category", "Roads & Public Works")
    subcategory = cat_res.get("subcategory", "General Issue")
    department = cat_res.get("department", "Roads & Public Works")
    is_crime = cat_res.get("is_crime", False)
    is_emergency = cat_res.get("is_emergency", False)
    emergency_guidance = cat_res.get("emergency_guidance")
    
    # 2. Priority Prediction
    prio_res = priority_predictor.predict(
        text=req.text,
        category=category,
        severity=req.severity or "Medium",
        location_type=req.location_type or "Residential",
        affected_count=req.affected_count or 50
    )
    priority = prio_res.get("priority", "MEDIUM")
    
    # 3. Duplicate Detection
    raw_list = [item if isinstance(item, dict) else item.model_dump() for item in (req.existing_complaints or [])]
    dup_res = duplicate_engine.check_duplicate(
        new_text=req.text,
        new_lat=req.latitude or 0.0,
        new_lng=req.longitude or 0.0,
        existing_complaints=raw_list
    )
    
    # 4. Resolution Time Estimation
    res_time_res = resolution_predictor.predict(
        category=category,
        priority=priority,
        location_type=req.location_type or "Residential",
        ward=req.ward or "Ward 1",
        affected_count=req.affected_count or 50,
        text=req.text
    )
    
    priority = prio_res.get("priority", "MEDIUM")
    prio_conf = prio_res.get("confidence", 0.95)
    est_hours = int(round(res_time_res.get("estimated_days", 3.0) * 24))
    
    return {
        "category_prediction": cat_res,
        "priority_prediction": prio_res,
        "duplicate_detection": dup_res,
        "resolution_prediction": res_time_res,
        "summary": {
            "category": category,
            "subcategory": subcategory,
            "department": department,
            "priority": priority,
            "priority_confidence": prio_conf,
            "confidence": prio_conf,
            "probabilities": prio_res.get("probabilities", {}),
            "risk_factors": prio_res.get("risk_factors", []),
            "sla_hours": prio_res.get("sla_hours", 72),
            "estimated_days": res_time_res.get("estimated_days", 3.0),
            "estimated_resolution_hours": est_hours,
            "is_duplicate": dup_res.get("is_duplicate", False),
            "duplicate_match_id": dup_res.get("matched_complaint_id"),
            "is_crime": is_crime,
            "is_emergency": prio_res.get("is_emergency", is_emergency),
            "emergency_detected": prio_res.get("is_emergency", is_emergency),
            "emergency_guidance": emergency_guidance,
            "override_reason": prio_res.get("override_reason")
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.api.main:app", host="0.0.0.0", port=8000, reload=True)
