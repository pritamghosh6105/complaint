import os
import re
import json
import joblib
from typing import Dict, Any, List, Optional
from src.preprocessing.text_cleaner import clean_text
from src.prediction.taxonomy_constants import (
    CANONICAL_30_DEPARTMENTS,
    DEPARTMENT_NAME_NORMALIZATION,
    DEPARTMENT_SUBCATEGORIES,
    DEPARTMENT_ID_MAP
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
# Cleaned of misleading single-word shortcuts that could hijack unrelated complaints
DOMAIN_INTENT_RULES = {
    "Police & Law Enforcement": [
        "theft", "stolen", "burglary", "broken into", "break-in", "assault", "robbery", "snatching", "stole", "thieves",
        "miscreants", "extortion", "goons", "fighting", "weapons", "rioting", "murder", "kidnap",
        "missing person", "attacked", "criminal", "thana", "fir registration", "police investigation",
        "unnatural death", "fatal incident", "dead body found",
    ],
    "Cyber Crime": [
        "upi fraud", "upi", "payment fraud", "phishing", "debit card fraud", "bank account emptied", "otp scam",
        "otp fraud", "hacked account", "cyber crime", "cyber fraud", "cyber", "online fraud", "banking fraud",
        "unauthorized transaction", "online transaction fraud", "financial fraud", "digital payment fraud",
        "unauthorized online transfer", "account compromised", "online scam", "fake link", "sim swap",
        "cyber harassment", "identity theft", "pan card loan scam", "unauthorized upi", "credit card fraud",
    ],
    "Women & Child Safety": [
        "eve teasing", "lewd comments", "domestic violence", "child abuse",
        "stalking women", "stalker", "child labour", "underage child", "women safety", "molestation",
        "abusive husband", "unsafe for women", "following home",
    ],
    "Traffic & Road Safety": [
        "traffic signal", "traffic light", "rash driving", "dangerous driving", "illegal parking",
        "traffic jam", "gridlock", "speeding trucks", "drag racing", "zebra crossing", "speed breaker",
        "obstructive parking", "wrong side driving", "hit and run", "fatal road accident", "vehicular collision",
    ],
    "Roads & Public Works": [
        "pothole", "potholes", "crater", "craters", "broken road", "asphalt", "flyover", "bridge culvert",
        "sinkhole", "road cave-in", "divider", "road eroded", "road repair", "tarmac", "pedestrian footpath",
    ],
    "Drainage & Sewerage": [
        "manhole", "open manhole", "sewer", "sewage", "gutter", "drainage", "clogged drain",
        "blocked drain", "waterlogging", "storm drain", "foul sewer", "drain wall", "sewer overflow",
    ],
    "Water Supply": [
        "water pipeline", "drinking water", "tap water", "water pipe burst", "water contamination",
        "no water supply", "turbid water", "chlorine", "low water pressure", "drinking water supply",
    ],
    "Solid Waste Management": [
        "garbage", "trash", "waste dumping", "dumping", "rubbish", "refuse", "litter", "compactor",
        "uncollected garbage", "garbage vat", "stench", "rotting garbage", "door-to-door waste",
    ],
    "Street Lighting & Electrical": [
        "streetlight", "street light", "streetlamp", "dark street", "sodium light", "led luminaire",
        "pole bulb", "broken streetlight", "unlit street", "tilted pole", "streetlight pole",
    ],
    "Public Health & Sanitation": [
        "mosquito breeding", "dengue", "malaria", "larvae", "fogging", "bleaching powder",
        "animal carcass", "dead animal", "stagnant pool", "epidemic", "public health sanitization",
    ],
    "Fire & Emergency Services": [
        "fire outbreak", "fire brigade", "blaze", "flames", "smoke", "fire engine", "cylinder explosion",
        "residential building fire", "trapped in fire", "gas cylinder fire",
    ],
    "Disaster Management": [
        "flood inundation", "embankment breach", "landslide", "disaster relief",
        "cyclone devastation", "storm damage", "river breach",
    ],
    "Environment & Pollution": [
        "industrial smoke", "factory emission", "air pollution", "black smoke", "toxic smoke", "toxic air", "factory smoke", "poisoning residential air", "chemical discharge", "toxic effluent",
        "noise pollution", "illegal loudspeakers", "toxic smoke", "polluting the river",
    ],
    "Parks & Public Spaces": [
        "public park", "children playground", "park bench", "walking track", "park light",
        "damaged playground equipment", "broken swings", "rusted slides",
    ],
    "Building & Municipal Engineering": [
        "cracks in building", "structural crack", "building collapse", "illegal construction",
        "unauthorized construction", "building safety inspection", "dangerous dilapidated building",
        "un-shored excavation",
    ],
    "Land & Land Records": [
        "mutation", "porcha", "khatian", "land record", "land demarcation", "illegal land encroachment",
        "ownership mutation record", "land registration record", "filling public pond",
    ],
    "Housing & Urban Development": [
        "housing scheme", "pmay", "banglar bari", "housing allotment", "urban housing subsidy",
        "housing subsidy disbursement", "slum rehabilitation",
    ],
    "Electricity & Power": [
        "power outage", "load shedding", "blackout", "transformer blast", "snapped wire",
        "live electrical wire", "high voltage", "low voltage", "electricity outage", "power cut",
        "power supply discontinued", "overhead power line", "transformer oil", "electricity meter",
    ],
    "Public Transport": [
        "public bus", "bus route", "overcharging fare", "bus frequency", "state transport bus",
        "auto-rickshaw fare", "transport depot",
    ],
    "Railway-related Public Complaints": [
        "railway station", "level crossing gate", "rail platform", "station passenger facility",
        "train delay", "railway ticket counter", "station drinking water",
    ],
    "Health & Hospitals": [
        "hospital emergency", "primary health centre", "phc", "doctor absent", "ambulance unavailable",
        "expired medicine", "icu bed", "medical negligence", "hospital administration",
    ],
    "Food & Public Distribution": [
        "ration shop", "fair price shop", "ration card", "substandard rice", "food grains",
        "dealer overcharging", "ration distribution", "weevil infested wheat",
    ],
    "Consumer Affairs": [
        "mrp violation", "overcharging mrp", "expired product", "defective appliance",
        "weights and measures", "charging above mrp", "warranty refusal",
    ],
    "Education – Schools": [
        "school building", "classroom roof", "mid-day meal", "school toilet", "primary school",
        "school infrastructure", "leaking classroom ceiling", "worms in school meal",
    ],
    "Higher Education": [
        "university marksheet", "college admission", "semester exam", "degree certificate",
        "university evaluation", "scholarship grant", "svmcm scholarship",
    ],
    "Labour & Employment": [
        "unpaid wages", "minimum wages", "provident fund", "labour dispute", "salary withheld",
        "pf gratuity", "workplace fatality", "industrial injury compensation",
    ],
    "Agriculture": [
        "irrigation canal", "subsidized seeds", "fertilizer shortage", "crop damage",
        "soil testing", "urea fertilizer", "boro paddy", "agricultural fields",
    ],
    "Animal Resources": [
        "stray cattle", "rabid stray dog", "veterinary clinic", "cattle menace",
        "stray livestock", "dog bites", "stray dogs",
    ],
    "Forest & Wildlife": [
        "illegal timber logging", "tree cutting", "poaching", "wild elephant", "forest reserve",
        "illegal tree cutting in protected forest", "wildlife conflict",
    ],
    "Public Grievance / General Administration": [
        "delay in government service", "birth certificate delay", "death certificate",
        "caste certificate", "trade license delay", "bribery demand", "bdo office",
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
        Stage 3: Validation & Disagreement Protocol
        """
        full_text = f"{title or ''} — {text}".strip(" —") if title else (text or '')
        cleaned = clean_text(full_text)
        text_lower = full_text.lower()

        # Handle empty/blank input gracefully
        if not cleaned:
            return {
                "predicted_category": "CLASSIFICATION_UNCERTAIN",
                "predicted_subcategory": "General Grievance",
                "confidence": 0.0,
                "top_predictions": [],
                "needs_human_review": True,
                "model_version": "civicpulse-text-v2",
                "uncertainty_reason": "Complaint description is empty or insufficient for reliable machine classification.",
                "primaryDepartment": "CLASSIFICATION_UNCERTAIN",
                "category": "CLASSIFICATION_UNCERTAIN",
                "department": "CLASSIFICATION_UNCERTAIN",
                "subcategory": "General Grievance",
                "secondaryDepartments": [],
                "departmentConfidence": None,
                "confidence": 0.0,
                "requiresHumanReview": True,
                "requires_human_review": True,
                "reason": "Complaint description is empty or insufficient for reliable machine classification.",
                "incidentType": "Unspecified",
                "incident_type": "Unspecified",
                "causeKnown": False,
                "cause_known": False,
                "structured_incident": incident_engine.extract_structured_incident(full_text, title),
                "alternative_categories": [],
                "classification_status": "UNCERTAIN",
                "modelVersion": "civicpulse-text-v2"
            }

        # -------------------------------------------------------------
        # STAGE 1: SEMANTIC INCIDENT UNDERSTANDING
        # -------------------------------------------------------------
        structured_incident = incident_engine.extract_structured_incident(full_text, title)
        stage1_semantic = incident_engine.analyze_complaint(full_text)
        is_fatal = stage1_semantic.get("is_fatal", False)
        stage1_primary = stage1_semantic.get("suggested_primary")
        stage1_subcat = stage1_semantic.get("suggested_subcategory")
        stage1_sec_depts = stage1_semantic.get("secondary_departments", [])
        stage1_reason = stage1_semantic.get("semantic_reason", "")
        stage1_human_review = stage1_semantic.get("requires_human_review", False)
        incident_type = stage1_semantic.get("incident_type", "Standard Civic Complaint")
        cause_known = stage1_semantic.get("cause_known", False)

        # -------------------------------------------------------------
        # STAGE 2: CALIBRATED STATISTICAL ML CLASSIFICATION
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

        # DECISION ENGINE: Calibrated Multi-Class Routing
        pred_cat = None
        confidence = 0.0
        reason = ""
        secondary_departments = []
        requires_human_review = stage1_human_review
        classification_status = "CONFIDENT"

        if is_fatal:
            # Fatal incident: Stage 1 semantic incident understanding takes precedence
            pred_cat = stage1_primary or "Police & Law Enforcement"
            secondary_departments = stage1_sec_depts
            requires_human_review = True
            reason = stage1_reason

            if pred_cat in classes:
                cat_idx = classes.index(pred_cat)
                confidence = round(float(probas[cat_idx]), 4)
            else:
                confidence = round(float(model_conf), 4)

        elif stage1_primary:
            pred_cat = stage1_primary
            secondary_departments = stage1_sec_depts
            reason = stage1_reason
            if pred_cat in classes:
                confidence = round(float(probas[classes.index(pred_cat)]), 4)
            else:
                confidence = round(float(model_conf), 4)

        # Hybrid Domain Intent & Statistical ML Classifier Engine
        if intent_cat and match_count >= 1:
            pred_cat = intent_cat
            if model_cat == intent_cat:
                # Both Statistical Classifier & Domain Intent agree with high confidence
                confidence = round(min(0.96, max(0.90, 0.78 + float(model_conf) * 1.2)), 4)
                classification_status = "CLASSIFIED"
                requires_human_review = False
                reason = f"Primary complaint category identified as {pred_cat} with strong alignment between statistical ML model and domain indicators ({', '.join(matched_keywords[:2])})."
            else:
                # Clear domain intent keyword match (e.g. upi fraud, pothole, broken swing)
                confidence = round(min(0.93, 0.86 + 0.03 * match_count), 4)
                classification_status = "CLASSIFIED"
                requires_human_review = False
                reason = f"Complaint intent identified as {pred_cat} based on verified incident indicator(s): {', '.join(matched_keywords[:2])}."

        elif model_cat is not None:
            second_conf = probas[sorted_indices[1]] if len(sorted_indices) > 1 else 0.0
            is_dominant = (model_conf >= 0.25) or (model_conf >= 0.18 and model_conf >= 1.5 * second_conf)

            if is_dominant:
                pred_cat = model_cat
                confidence = round(float(model_conf), 4)
                classification_status = "CLASSIFIED"
                reason = f"Primary complaint category identified as {pred_cat} with statistical model confidence of {round(confidence * 100, 1)}%."
            else:
                # Genuinely ambiguous or out-of-distribution complaint without domain indicators
                pred_cat = "CLASSIFICATION_UNCERTAIN"
                confidence = round(float(model_conf), 4)
                requires_human_review = True
                classification_status = "UNCERTAIN"
                reason = f"Statistical model probability is diffuse (top score: {round(model_conf*100, 1)}%) without clear domain indicators. Routed for human administrative review."

        else:
            pred_cat = "CLASSIFICATION_UNCERTAIN"
            requires_human_review = True
            confidence = 0.0
            classification_status = "UNCERTAIN"
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
                    subcat_classes = list(self.subcat_model.classes_)
                    valid_subcats = self.taxonomy.get(pred_cat, [])
                    if valid_subcats:
                        best_valid_subcat = None
                        best_valid_conf = -1.0
                        for idx, c in enumerate(subcat_classes):
                            if not is_fatal and any(w in c.lower() for w in ["death", "fatal", "inquest"]):
                                continue
                            if c in valid_subcats and subcat_probas[idx] > best_valid_conf:
                                best_valid_conf = subcat_probas[idx]
                                best_valid_subcat = c
                        subcat = best_valid_subcat or valid_subcats[0]
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
        is_emergency = stage1_semantic.get("emergency_status", False)
        emergency_triggers = [
            "active fire", "flames spreading", "currently attacking", "armed robbers right now",
            "live wire sparking on road", "bleeding severely", "child in immediate danger"
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

        dept_id = DEPARTMENT_ID_MAP.get(pred_cat, 30 if pred_cat != "CLASSIFICATION_UNCERTAIN" else None)
        return {
            "analysis_status": "SUCCESS",
            "complaint_intent": pred_cat if pred_cat != "CLASSIFICATION_UNCERTAIN" else "UNRESOLVED",
            "incident_name": (structured_incident or {}).get("incident_summary") or title or "Reported Civic Incident",
            "department": {
                "id": dept_id,
                "name": pred_cat
            },
            "subcategory": {
                "name": subcat
            },
            "department_id": dept_id,
            "classification_confidence": confidence,
            "classification_status": classification_status,
            "evidence_sources": ["complaint_title", "complaint_description"],
            "predicted_category": pred_cat,
            "predicted_subcategory": subcat,
            "confidence": confidence,
            "top_predictions": top_predictions,
            "needs_human_review": requires_human_review,
            "model_version": "civicpulse-text-v2",
            "uncertainty_reason": reason if requires_human_review else None,
            "primaryDepartment": pred_cat,
            "category": pred_cat,
            "department": pred_cat,
            "subcategory": subcat,
            "secondaryDepartments": secondary_departments,
            "secondary_departments": secondary_departments,
            "departmentConfidence": confidence,
            "confidence": confidence,
            "requiresHumanReview": requires_human_review,
            "requires_human_review": requires_human_review,
            "classification_status": classification_status,
            "incidentType": incident_type,
            "incident_type": incident_type,
            "causeKnown": cause_known,
            "cause_known": cause_known,
            "structured_incident": structured_incident,
            "reason": reason,
            "is_crime": is_crime,
            "is_emergency": is_emergency,
            "emergency_guidance": emergency_guidance,
            "alternative_categories": alt_cats,
            "matched_intent_keywords": matched_keywords[:3] if matched_keywords else [],
            "modelVersion": "civicpulse-text-v2"
        }

# Global singleton
category_predictor = CategoryPredictor()
