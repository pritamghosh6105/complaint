import os
import joblib
import pandas as pd
from typing import Dict, Any
from src.preprocessing.feature_engineering import extract_safety_score

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))
MODEL_PATH = os.path.join(MODELS_DIR, "resolution_model.joblib")

CATEGORY_BASE_DAYS = {
    "Road Damage": 3.2,
    "Garbage & Waste": 1.8,
    "Streetlight": 2.1,
    "Water Supply": 2.4,
    "Drainage & Sewage": 2.7,
    "Electricity": 1.5,
    "Traffic & Signals": 2.2,
    "Public Parks": 4.5,
    "Sanitation": 2.5,
    "Public Infrastructure": 5.0
}

class ResolutionPredictor:
    def __init__(self):
        self.model = None
        self._load_model()
        
    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
            except Exception as e:
                print(f"Error loading resolution model: {e}")
                self.model = None
                
    def predict(
        self,
        category: str = "Road Damage",
        priority: str = "MEDIUM",
        location_type: str = "Residential",
        ward: str = "Ward 5",
        affected_count: int = 50,
        text: str = ""
    ) -> Dict[str, Any]:
        safety_score = extract_safety_score(text) if text else 0.0
        
        if self.model is None:
            self._load_model()
            
        if self.model is not None:
            input_df = pd.DataFrame([{
                "category": category,
                "priority": priority,
                "location_type": location_type,
                "ward": ward,
                "affected_count": float(affected_count),
                "safety_score": safety_score
            }])
            try:
                pred_days = float(self.model.predict(input_df)[0])
                pred_days = max(0.5, round(pred_days, 1))
            except Exception:
                base = CATEGORY_BASE_DAYS.get(category, 3.0)
                mul = {"CRITICAL": 0.5, "HIGH": 0.8, "MEDIUM": 1.1, "LOW": 1.5}.get(priority, 1.0)
                pred_days = round(base * mul, 1)
        else:
            base = CATEGORY_BASE_DAYS.get(category, 3.0)
            mul = {"CRITICAL": 0.5, "HIGH": 0.8, "MEDIUM": 1.1, "LOW": 1.5}.get(priority, 1.0)
            pred_days = round(base * mul, 1)
            
        confidence_interval = [max(0.5, round(pred_days - 0.6, 1)), round(pred_days + 0.8, 1)]
        
        return {
            "estimated_days": pred_days,
            "estimated_hours": round(pred_days * 24, 0),
            "confidence_range_days": confidence_interval,
            "benchmark_category_avg": CATEGORY_BASE_DAYS.get(category, 3.0)
        }
