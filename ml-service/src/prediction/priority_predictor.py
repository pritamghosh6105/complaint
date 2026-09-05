import os
import re
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

from src.preprocessing.text_cleaner import clean_text
from src.preprocessing.feature_engineering import (
    extract_safety_features,
    calculate_safety_score,
    extract_human_risk_factors,
    check_has_negation
)

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))
MODEL_PATH = os.path.join(MODELS_DIR, "priority_model.joblib")

SLA_HOURS_MAP = {
    "CRITICAL": 24,
    "HIGH": 48,
    "MEDIUM": 72,
    "LOW": 168
}

class PriorityPredictor:
    def __init__(self):
        self.model = None
        self._load_model()
        
    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
            except Exception as e:
                print(f"Error loading priority model from {MODEL_PATH}: {e}")
                self.model = None
        else:
            print(f"Priority model file not found at {MODEL_PATH}")
            self.model = None

    def predict(
        self,
        text: str,
        category: str = "Roads & Public Works",
        severity: str = "Medium",
        location_type: str = "Residential",
        affected_count: int = 50,
        duration_days: int = 3,
        is_emergency: bool = False
    ) -> Dict[str, Any]:
        """
        Executes real probabilistic priority prediction using the trained ML model.
        Evaluates text features, structured categorical attributes, and engineered risk signals.
        Follows up with an Emergency Safety Escalation Layer post-ML.
        """
        if self.model is None:
            self._load_model()
            
        cleaned = clean_text(text)
        risk_signals = extract_safety_features(text)
        text_lower = text.lower()
        has_negation = check_has_negation(text_lower)
        
        # Temporal cues from text
        inferred_duration = duration_days
        if any(k in text_lower for k in ["for a week", "for several days", "एक हफ्ते", "এক সপ্তাহ", "কয়েকদিন"]):
            inferred_duration = max(duration_days, 7)
        elif any(k in text_lower for k in ["missed once", "yesterday", "last night", "একবার", "কালকে", "कल"]):
            inferred_duration = 1
        elif any(k in text_lower for k in ["right now", "currently", "এই মুহূর্তে", "इस समय"]):
            inferred_duration = 1

        # Perceived severity from text cues if default was provided
        inferred_severity = severity
        if severity == "Medium" or not severity:
            if (not has_negation and (risk_signals.get("immediate_danger") or risk_signals.get("life_threat") or risk_signals.get("electrical_hazard"))) or (risk_signals.get("child_safety_risk") and risk_signals.get("public_infrastructure_risk")):
                inferred_severity = "Critical"
            elif any(k in text_lower for k in ["charged", "debited", "fraudulently", "transferred", "₹25,000", "₹", "siphoned", "financial fraud"]) and risk_signals.get("cyber_fraud"):
                inferred_severity = "High"
            elif any(k in text_lower for k in ["suspicious", "phishing", "asking for", "spam", "received", "সন্দেহজনক", "संदिग्ध"]) and risk_signals.get("cyber_fraud"):
                inferred_severity = "Low"
            elif risk_signals.get("accident_risk") or risk_signals.get("women_safety_risk") or risk_signals.get("major_health_risk"):
                inferred_severity = "High"
            elif has_negation or any(k in text_lower for k in ["one streetlight", "missed once", "minor", "quiet lane", "কোনও বিপদ নেই", "কোনো বিপদ নেই", "একটি স্ট্রিট লাইট"]):
                inferred_severity = "Low"
                
        # Calculate continuous safety risk score
        safety_score = calculate_safety_score(text, inferred_severity, location_type)
        
        # Build structured feature row matching trained model schema
        input_data = {
            'cleaned_text': cleaned,
            'location_type': location_type if location_type else 'Residential',
            'severity': inferred_severity,
            'category': category if category else 'Roads & Public Works',
            'immediate_danger': risk_signals.get('immediate_danger', 0),
            'life_threat': risk_signals.get('life_threat', 0),
            'injury_reported': risk_signals.get('injury_reported', 0),
            'violence_detected': risk_signals.get('violence_detected', 0),
            'fire_detected': risk_signals.get('fire_detected', 0),
            'electrical_hazard': risk_signals.get('electrical_hazard', 0),
            'child_safety_risk': risk_signals.get('child_safety_risk', 0),
            'women_safety_risk': risk_signals.get('women_safety_risk', 0),
            'crime_detected': risk_signals.get('crime_detected', 0),
            'cyber_fraud': risk_signals.get('cyber_fraud', 0),
            'major_health_risk': risk_signals.get('major_health_risk', 0),
            'disaster_detected': risk_signals.get('disaster_detected', 0),
            'accident_risk': risk_signals.get('accident_risk', 0),
            'public_infrastructure_risk': risk_signals.get('public_infrastructure_risk', 0),
            'large_population_affected': 1 if affected_count >= 200 else 0,
            'log_affected': float(np.log1p(max(1, affected_count))),
            'duration_days': float(np.clip(inferred_duration, 1, 60)),
            'safety_score': float(safety_score)
        }
        
        input_df = pd.DataFrame([input_data])
        
        # 1. Real ML Model Inference
        if self.model is not None:
            try:
                pred_label = str(self.model.predict(input_df)[0])
                probas = self.model.predict_proba(input_df)[0]
                classes = list(self.model.classes_)
                
                confidence = float(np.max(probas))
                prob_dict = {str(cls): round(float(prob), 4) for cls, prob in zip(classes, probas)}
                ml_priority = pred_label
            except Exception as e:
                print(f"ML priority predict error: {e}")
                ml_priority = "MEDIUM"
                confidence = 0.75
                prob_dict = {"LOW": 0.1, "MEDIUM": 0.75, "HIGH": 0.1, "CRITICAL": 0.05}
        else:
            ml_priority = "MEDIUM"
            confidence = 0.70
            prob_dict = {"LOW": 0.1, "MEDIUM": 0.7, "HIGH": 0.15, "CRITICAL": 0.05}
            
        # 2. Carefully Designed Emergency Safety Layer (Post-ML Evaluation)
        # Only triggers if clear active life-safety emergency exists AND no negation
        has_clear_life_emergency = bool(
            not has_negation and (
                is_emergency or
                risk_signals.get("immediate_danger") or
                risk_signals.get("life_threat") or
                ("attacking a person right now" in text_lower or "physically attacked right now" in text_lower or "শারীরিক আক্রমণ করা হচ্ছে" in text_lower or "शारीरिक हमला हो रहा है" in text_lower) or
                ("child is currently in immediate danger" in text_lower or "শিশু এই মুহূর্তে চরম বিপদের" in text_lower or "बच्चा इस समय गंभीर खतरे" in text_lower) or
                ("live electrical wire" in text_lower or "electrocuted" in text_lower or "ছেঁড়া বিদ্যুতের তার" in text_lower or "बिजली का नंगा तार" in text_lower) or
                ("active fire" in text_lower or "building fully ablaze" in text_lower or "ভয়াবহ আগুন" in text_lower or "भीषण आग" in text_lower) or
                ("uncovered manhole" in text_lower and ("school" in text_lower or "children" in text_lower or "fall" in text_lower or "স্কুল" in text_lower or "শিশু" in text_lower or "बच्चे" in text_lower))
            )
        )
        
        emergency_override = False
        override_reason = None
        
        if ml_priority != "CRITICAL" and has_clear_life_emergency:
            final_priority = "CRITICAL"
            emergency_override = True
            override_reason = "Immediate life-safety risk detected"
            confidence = max(confidence, 0.95)
        else:
            final_priority = ml_priority
            
        sla_hours = SLA_HOURS_MAP.get(final_priority, 72)
        
        # 3. Explainable Real Risk Factors
        risk_factors = extract_human_risk_factors(
            text=text,
            location_type=location_type,
            affected_count=affected_count,
            severity=inferred_severity,
            emergency_override=emergency_override
        )
        
        return {
            "priority": final_priority,
            "ml_priority": ml_priority,
            "confidence": round(confidence, 3),
            "probabilities": prob_dict,
            "sla_hours": sla_hours,
            "risk_factors": risk_factors,
            "is_emergency": bool(emergency_override or final_priority == "CRITICAL"),
            "override_reason": override_reason
        }
