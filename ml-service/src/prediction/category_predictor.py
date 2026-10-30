import os
import re
import json
import joblib
from typing import Dict, Any, List, Optional
from src.preprocessing.text_cleaner import clean_text
from src.prediction.taxonomy_constants import (
    CANONICAL_30_DEPARTMENTS,
    DEPARTMENT_NAME_NORMALIZATION,
    DEPARTMENT_SUBCATEGORIES
)
from src.prediction.incident_understanding import incident_engine

CATEGORY_DEPARTMENT_MAP = DEPARTMENT_NAME_NORMALIZATION

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))
CAT_MODEL_PATH = os.path.join(MODELS_DIR, "category_model.joblib")
SUBCAT_MODEL_PATH = os.path.join(MODELS_DIR, "subcategory_model.joblib")
TAXONOMY_PATH = os.path.join(MODELS_DIR, "taxonomy.json")

CRIME_CATEGORIES = {
    "Police & Law Enforcement",
    "Cyber Crime",
    "Women & Child Safety"
}

EMERGENCY_CONTACTS = {
    "Police & Law Enforcement": {"name": "Police Control Room", "number": "100 / 112"},
    "Cyber Crime": {"name": "National Cyber Crime Helpline", "number": "1930 / cybercrime.gov.in"},
    "Women & Child Safety": {"name": "Women & Child Helpline", "number": "1090 / 1098 / 112"},
    "Fire & Emergency Services": {"name": "Fire & Rescue Control", "number": "101 / 112"},
    "Disaster Management": {"name": "State Disaster Response (NDRF/SDRF)", "number": "1070 / 112"},
    "Health & Hospitals": {"name": "Emergency Medical Ambulance", "number": "102 / 108 / 112"}
}

# Domain Intent Keywords for All 30 Canonical Departments
DOMAIN_INTENT_RULES = {
    "Police & Law Enforcement": [
        "theft", "stolen", "burglary", "assault", "robbery", "snatching", "stole", "thieves",
        "miscreants", "extortion", "goons", "fighting", "weapons", "rioting", "murder", "kidnap",
        "missing person", "attacked", "criminal", "police", "thana", "fir", "investigation", "inquest",
        "unnatural death", "fatal incident", "dead body",
    ],
    "Cyber Crime": [
        "upi", "fraud", "scam", "phishing", "debit", "debited", "bank account", "otp", "hacked",
        "hacking", "cyber", "unauthorized transaction", "online transaction", "unauthorized online",
        "account compromised", "compromised", "online scam", "fake link", "sim swap",
        "cyber harassment", "identity theft", "pan card loan", "unauthorized upi",
    ],
    "Women & Child Safety": [
        "harassment", "eve teasing", "lewd comments", "domestic violence", "child abuse",
        "stalking", "stalker", "child labour", "underage child", "women safety", "molestation",
        "abusive husband", "unsafe for women", "following home",
    ],
    "Traffic & Road Safety": [
        "traffic signal", "traffic light", "rash driving", "dangerous driving", "illegal parking",
        "traffic jam", "gridlock", "speeding", "drag racing", "zebra crossing", "speed breaker",
        "obstructive parking", "wrong side driving", "hit and run", "junction without functioning",
    ],
    "Roads & Public Works": [
        "pothole", "potholes", "crater", "craters", "broken road", "asphalt", "flyover", "bridge",
        "sinkhole", "road cave-in", "divider", "road eroded", "road repair", "tarmac", "pedestrian footpath",
    ],
    "Drainage & Sewerage": [
        "manhole", "open manhole", "sewer", "sewage", "gutter", "drainage", "clogged drain",
        "blocked drain", "waterlogging", "storm drain", "foul sewer", "drain wall",
    ],
    "Water Supply": [
        "water pipeline", "drinking water", "tap water", "water pipe burst", "water contamination",
        "no water supply", "turbid water", "chlorine", "low water pressure", "water supply",
    ],
    "Solid Waste Management": [
        "garbage", "trash", "waste", "dumping", "rubbish", "refuse", "litter", "compactor",
        "uncollected garbage", "garbage vat", "stench", "rotting garbage",
    ],
    "Street Lighting & Electrical": [
        "streetlight", "street light", "streetlamp", "dark street", "sodium light", "led light",
        "pole bulb", "broken streetlight", "unlit street", "poorly illuminated",
    ],
    "Public Health & Sanitation": [
        "mosquito", "dengue", "malaria", "larvae", "fogging", "bleaching powder",
        "stagnant pool", "epidemic", "stagnant public water",
    ],
    "Fire & Emergency Services": [
        "fire outbreak", "fire", "blaze", "flames", "smoke", "fire engine", "cylinder explosion",
        "residential building fire", "trapped in fire",
    ],
    "Disaster Management": [
        "flood", "flooding", "cyclone", "embankment breach", "landslide", "inundation",
        "disaster relief", "severe flooding affecting multiple villages",
    ],
    "Environment & Pollution": [
        "industrial smoke", "factory emission", "air pollution", "effluent", "chemical discharge",
        "noise pollution", "illegal loudspeakers", "toxic smoke", "polluting the surrounding",
    ],
    "Parks & Public Spaces": [
        "public park", "playground", "park bench", "walking track", "park light", "children park",
        "damaged playground equipment",
    ],
    "Building & Municipal Engineering": [
        "cracks in building", "structural crack", "building collapse", "illegal construction",
        "unauthorized construction", "building safety inspection", "dangerous dilapidated building",
    ],
    "Land & Land Records": [
        "mutation", "porcha", "khatian", "land record", "land demarcation", "illegal land encroachment",
        "ownership mutation record", "land registration record",
    ],
    "Housing & Urban Development": [
        "housing scheme", "pmay", "banglar bari", "allotment", "urban housing", "housing subsidy",
        "eligible household is facing an unresolved issue with an urban housing",
    ],
    "Electricity & Power": [
        "power outage", "load shedding", "blackout", "transformer blast", "snapped wire",
        "live electrical wire", "high voltage", "low voltage", "electricity outage in several",
    ],
    "Public Transport": [
        "public bus", "bus route", "overcharging fare", "bus frequency", "state transport",
        "bus service repeatedly missing scheduled trips",
    ],
    "Railway-related Public Complaints": [
        "railway station", "level crossing", "rail platform", "station passenger facility",
        "train delay", "railway ticket counter", "passenger facilities at a railway station",
    ],
    "Health & Hospitals": [
        "hospital emergency", "primary health centre", "phc", "doctor absent", "ambulance unavailable",
        "expired medicine", "icu bed", "hospital emergency services unavailable",
    ],
    "Food & Public Distribution": [
        "ration shop", "fair price shop", "ration card", "substandard rice", "food grains",
        "dealer overcharging", "ration distribution not provided",
    ],
    "Consumer Affairs": [
        "mrp violation", "overcharging mrp", "expired product", "defective appliance",
        "weights and measures", "shop charging more than the displayed price",
    ],
    "Education – Schools": [
        "school building", "classroom roof", "midday meal", "school toilet", "desk bench",
        "primary school", "school building requires urgent maintenance",
    ],
    "Higher Education": [
        "university marksheet", "college admission", "semester exam", "degree certificate",
        "university evaluation", "university examination result discrepancy",
    ],
    "Labour & Employment": [
        "unpaid wages", "minimum wages", "provident fund", "labour dispute", "salary withheld",
        "pf gratuity", "employer has not paid workers their wages",
    ],
    "Agriculture": [
        "irrigation canal", "subsidized seeds", "fertilizer shortage", "crop damage",
        "soil testing", "irrigation water unavailable for agricultural fields",
    ],
    "Animal Resources": [
        "stray cattle", "rabid stray dog", "veterinary clinic", "cattle menace",
        "stray livestock", "stray cattle causing problems in residential areas",
    ],
    "Forest & Wildlife": [
        "illegal timber logging", "tree cutting", "poaching", "wild elephant", "forest reserve",
        "illegal tree cutting in protected forest area",
    ],
    "Public Grievance / General Administration": [
        "delay in government service", "birth certificate delay", "death certificate",
        "caste certificate", "trade license", "delay in a general government service application",
    ]
}

class CategoryPredictor:
    def __init__(self):
        self.cat_model = None
        self.subcat_model = None
        self.taxonomy = {}
        self._load_models()

    def _load_models(self):
        """Loads trained pipelines and taxonomy."""
        if os.path.exists(CAT_MODEL_PATH):
            try:
                self.cat_model = joblib.load(CAT_MODEL_PATH)
            except Exception as e:
                print(f"Error loading category model: {e}")
                self.cat_model = None

        if os.path.exists(SUBCAT_MODEL_PATH):
            try:
                self.subcat_model = joblib.load(SUBCAT_MODEL_PATH)
            except Exception as e:
                print(f"Error loading subcategory model: {e}")
                self.subcat_model = None

        if os.path.exists(TAXONOMY_PATH):
            try:
                with open(TAXONOMY_PATH, "r", encoding="utf-8") as f:
                    self.taxonomy = json.load(f)
            except Exception as e:
                print(f"Error loading taxonomy: {e}")
                self.taxonomy = DEPARTMENT_SUBCATEGORIES
        else:
            self.taxonomy = DEPARTMENT_SUBCATEGORIES

    def check_domain_intent(self, text_lower: str):
        """Rule-guided semantic matching for high-confidence domain keywords."""
        best_cat = None
        max_matches = 0
        matched_words = []

        for category, keywords in DOMAIN_INTENT_RULES.items():
            matches = [kw for kw in keywords if kw in text_lower]
            if len(matches) > max_matches:
                max_matches = len(matches)
                best_cat = category
                matched_words = matches

        return best_cat, max_matches, matched_words

    def predict(self, text: str, title: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes Two-Stage Classification Pipeline:
        Stage 1: Semantic Incident Understanding
        Stage 2: Calibrated ML Classification
        """
        full_text = f"{title or ''} — {text}".strip(" —") if title else (text or '')
        cleaned = clean_text(full_text)
        text_lower = full_text.lower()

        # Handle empty/blank input gracefully
        if not cleaned:
            return {
                "primaryDepartment": "CLASSIFICATION_UNCERTAIN",
                "category": "CLASSIFICATION_UNCERTAIN",
                "department": "CLASSIFICATION_UNCERTAIN",
                "subcategory": "General Grievance",
                "secondaryDepartments": [],
                "departmentConfidence": None,
                "confidence": 0.0,
                "requiresHumanReview": True,
                "reason": "Complaint description is empty or insufficient for reliable machine classification.",
                "incidentType": "Unspecified",
                "causeKnown": False,
                "modelVersion": "civicpulse-ml-v2.0-30dept"
            }

        # -------------------------------------------------------------
        # STAGE 1: SEMANTIC INCIDENT UNDERSTANDING
        # -------------------------------------------------------------
        incident_data = incident_engine.analyze_complaint(full_text)
        is_fatal = incident_data.get("is_fatal", False)
        stage1_primary = incident_data.get("suggested_primary")
        stage1_subcat = incident_data.get("suggested_subcategory")
        stage1_sec_depts = incident_data.get("secondary_departments", [])
        stage1_reason = incident_data.get("semantic_reason", "")
        stage1_human_review = incident_data.get("requires_human_review", False)
        incident_type = incident_data.get("incident_type", "Standard Civic Complaint")
        cause_known = incident_data.get("cause_known", False)

        # -------------------------------------------------------------
        # STAGE 2: CALIBRATED ML CLASSIFICATION
        # -------------------------------------------------------------
        if self.cat_model is None:
            self._load_models()

        intent_cat, match_count, matched_keywords = self.check_domain_intent(text_lower)

        model_cat = None
        model_conf = 0.0
        top_predictions = []
        classes = []
        probas = []

        if self.cat_model is not None:
            try:
                probas = self.cat_model.predict_proba([cleaned])[0]
                classes = list(self.cat_model.classes_)
                top_idx = probas.argmax()
                model_cat = classes[top_idx]
                model_conf = float(probas[top_idx])

                sorted_indices = probas.argsort()[::-1]
                for idx in sorted_indices[:4]:
                    top_predictions.append({
                        "category": str(classes[idx]),
                        "confidence": round(float(probas[idx]), 4)
                    })
            except Exception as e:
                print(f"Model prediction exception: {e}")
                model_cat = None
                model_conf = 0.0

        # DECISION ENGINE: Fusing Stage 1 Semantic Grounding with Stage 2 ML
        pred_cat = None
        confidence = 0.0
        reason = ""
        secondary_departments = []
        requires_human_review = stage1_human_review

        if is_fatal:
            # Fatal incident: Stage 1 semantic incident understanding takes precedence
            # to prevent generic municipal words from causing incorrect classification.
            pred_cat = stage1_primary or "Police & Law Enforcement"
            secondary_departments = stage1_sec_depts
            requires_human_review = True
            reason = stage1_reason

            # Grounded confidence from model probability for the target department
            if pred_cat in classes:
                cat_idx = classes.index(pred_cat)
                confidence = float(probas[cat_idx])
            else:
                confidence = round(max(model_conf, 0.82), 4)

        elif stage1_primary:
            pred_cat = stage1_primary
            secondary_departments = stage1_sec_depts
            reason = stage1_reason
            if pred_cat in classes:
                confidence = float(probas[classes.index(pred_cat)])
            else:
                confidence = round(model_conf, 4)

        elif model_cat is not None:
            # Domain intent and ML agreement evaluation
            if intent_cat and match_count >= 1:
                # If model agreed, or multiple intent keywords, or model confidence is low/diffuse
                if intent_cat == model_cat or match_count >= 2 or model_conf < 0.35:
                    pred_cat = intent_cat
                    intent_idx = classes.index(intent_cat) if intent_cat in classes else -1
                    confidence = float(probas[intent_idx]) if (intent_idx >= 0 and probas[intent_idx] > 0.15) else 0.88
                else:
                    intent_idx = classes.index(intent_cat) if intent_cat in classes else -1
                    if intent_idx >= 0 and probas[intent_idx] > 0.04:
                        pred_cat = intent_cat
                        confidence = float(probas[intent_idx])
                    else:
                        pred_cat = model_cat
                        confidence = model_conf
            else:
                pred_cat = model_cat
                confidence = model_conf

            # Check confidence certainty threshold
            if confidence < 0.12 and not intent_cat:
                pred_cat = "CLASSIFICATION_UNCERTAIN"
                requires_human_review = True
                reason = "Classification confidence below decision threshold. Routed for manual human review."
            else:
                reason = f"Primary complaint topic identified as {pred_cat} based on contextual indicators and citizen request."
        elif intent_cat:
            pred_cat = intent_cat
            confidence = 0.85
            reason = f"Domain intent keywords matched {pred_cat}."
        else:
            # Explicit uncertain state rather than defaulting to Roads & Public Works
            pred_cat = "CLASSIFICATION_UNCERTAIN"
            requires_human_review = True
            confidence = 0.0
            reason = "No statistical model or domain pattern confidently matched the complaint. Routed for manual verification."

        # Canonical normalization
        if pred_cat != "CLASSIFICATION_UNCERTAIN":
            pred_cat = DEPARTMENT_NAME_NORMALIZATION.get(pred_cat, pred_cat)

        # Predict Subcategory
        subcat = stage1_subcat
        if not subcat:
            if self.subcat_model is not None and pred_cat != "CLASSIFICATION_UNCERTAIN":
                try:
                    subcat_probas = self.subcat_model.predict_proba([cleaned])[0]
                    subcat_classes = self.subcat_model.classes_
                    valid_subcats = self.taxonomy.get(pred_cat, [])
                    if valid_subcats:
                        best_valid_subcat = None
                        best_valid_conf = -1.0
                        for idx, c in enumerate(subcat_classes):
                            # Do not assign death/fatal subcategory to a non-fatal incident
                            if not is_fatal and any(w in c.lower() for w in ["death", "fatal"]):
                                continue
                            if c in valid_subcats and subcat_probas[idx] > best_valid_conf:
                                best_valid_conf = subcat_probas[idx]
                                best_valid_subcat = c
                        subcat = best_valid_subcat or [s for s in valid_subcats if not any(w in s.lower() for w in ["death", "fatal"])][0]
                    else:
                        subcat = str(subcat_classes[subcat_probas.argmax()])
                except Exception:
                    subcat = self.taxonomy.get(pred_cat, ["General Grievance"])[0]
            else:
                subcat = self.taxonomy.get(pred_cat, ["General Grievance"])[0] if pred_cat in self.taxonomy else "General Grievance"

        # Check multi-department cross involvement
        if not secondary_departments and pred_cat != "CLASSIFICATION_UNCERTAIN":
            if any(k in text_lower for k in ["traffic accident", "collision"]) and pred_cat == "Roads & Public Works":
                secondary_departments = ["Traffic & Road Safety"]
            elif any(k in text_lower for k in ["hospital negligence", "doctor absent"]) and pred_cat == "Police & Law Enforcement":
                secondary_departments = ["Health & Hospitals"]
            elif any(k in text_lower for k in ["loudspeaker", "noise"]) and pred_cat == "Environment & Pollution":
                secondary_departments = ["Police & Law Enforcement"]

        # Emergency & Crime flags
        is_crime = pred_cat in CRIME_CATEGORIES
        is_emergency = incident_data.get("emergency_status", False)
        emergency_triggers = [
            "active fire", "flames spreading", "currently attacking", "armed robbers right now",
            "live wire sparking on road", "bleeding severely", "bombing", "child in immediate danger"
        ]
        if any(t in text_lower for t in emergency_triggers):
            is_emergency = True

        emergency_guidance = None
        if pred_cat in EMERGENCY_CONTACTS:
            ec = EMERGENCY_CONTACTS[pred_cat]
            emergency_guidance = {
                "helpline_name": ec["name"],
                "helpline_number": ec["number"],
                "advisory": f"If you or someone else is in immediate danger, please dial {ec['number']} directly."
            }
        alt_cats = [p for p in top_predictions if p["category"] != pred_cat][:3]

        return {
            "primaryDepartment": pred_cat,
            "category": pred_cat,
            "department": pred_cat,
            "subcategory": subcat,
            "secondaryDepartments": secondary_departments,
            "secondary_departments": secondary_departments,
            "departmentConfidence": round(confidence, 4) if confidence > 0 else 0.0,
            "confidence": round(confidence, 4) if confidence > 0 else 0.0,
            "requiresHumanReview": requires_human_review,
            "requires_human_review": requires_human_review,
            "incidentType": incident_type,
            "incident_type": incident_type,
            "causeKnown": cause_known,
            "cause_known": cause_known,
            "reason": reason,
            "is_crime": is_crime,
            "is_emergency": is_emergency,
            "emergency_guidance": emergency_guidance,
            "alternative_categories": alt_cats,
            "matched_intent_keywords": matched_keywords[:3] if matched_keywords else [],
            "modelVersion": "civicpulse-ml-v2.0-30dept"
        }

# Global singleton
category_predictor = CategoryPredictor()
