import os
import json
import joblib
from typing import Dict, Any, List, Optional
from src.preprocessing.text_cleaner import clean_text

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))
CAT_MODEL_PATH = os.path.join(MODELS_DIR, "category_model.joblib")
SUBCAT_MODEL_PATH = os.path.join(MODELS_DIR, "subcategory_model.joblib")
TAXONOMY_PATH = os.path.join(MODELS_DIR, "taxonomy.json")

# Centralized 30-Category to Responsible Department Transparent Mapping
CATEGORY_DEPARTMENT_MAP = {
    "Police & Law Enforcement": "Police & Law Enforcement",
    "Cyber Crime": "Cyber Crime",
    "Women & Child Safety": "Women & Child Safety",
    "Traffic & Road Safety": "Traffic & Road Safety",
    "Roads & Public Works": "Roads & Public Works",
    "Drainage & Sewerage": "Drainage & Sewerage",
    "Water Supply": "Water Supply",
    "Solid Waste Management": "Solid Waste Management",
    "Street Lighting & Electrical": "Street Lighting & Electrical",
    "Public Health & Sanitation": "Public Health & Sanitation",
    "Fire & Emergency Services": "Fire & Emergency Services",
    "Disaster Management": "Disaster Management",
    "Environment & Pollution": "Environment & Pollution",
    "Parks & Public Spaces": "Parks & Public Spaces",
    "Building & Municipal Engineering": "Building & Municipal Engineering",
    "Land & Land Records": "Land & Land Records",
    "Housing & Urban Development": "Housing & Urban Development",
    "Electricity & Power": "Electricity & Power",
    "Public Transport": "Public Transport",
    "Railway-related Public Complaints": "Railway-related Public Complaints",
    "Health & Hospitals": "Health & Hospitals",
    "Food & Public Distribution": "Food & Public Distribution",
    "Consumer Affairs": "Consumer Affairs",
    "Education - Schools": "Education - Schools",
    "Education – Schools": "Education - Schools",
    "Higher Education": "Higher Education",
    "Labour & Employment": "Labour & Employment",
    "Agriculture": "Agriculture",
    "Animal Resources": "Animal Resources",
    "Forest & Wildlife": "Forest & Wildlife",
    "Public Grievance / General Administration": "Public Grievance / General Administration"
}

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

# Extensive Intent Keywords for 30 Municipal & Law Enforcement Domains
DOMAIN_INTENT_RULES = {
    "Police & Law Enforcement": [
        "theft", "stolen", "burglary", "assault", "robbery", "snatching", "stole", "thieves",
        "miscreants", "extortion", "goons", "fighting", "weapons", "rioting", "murder", "kidnap",
        "missing person", "attacked", "criminal"
    ],
    "Cyber Crime": [
        "upi", "fraud", "scam", "phishing", "debit", "debited", "bank account", "otp", "hacked",
        "hacking", "cyber", "unauthorized transaction", "online scam", "fake link", "sim swap",
        "cyber harassment", "identity theft", "pan card loan"
    ],
    "Women & Child Safety": [
        "harassment", "eve teasing", "lewd comments", "domestic violence", "child abuse",
        "stalking", "stalker", "child labour", "underage child", "women safety", "molestation",
        "abusive husband", "unsafe for women"
    ],
    "Traffic & Road Safety": [
        "traffic signal", "traffic light", "rash driving", "dangerous driving", "illegal parking",
        "traffic jam", "gridlock", "speeding", "drag racing", "zebra crossing", "speed breaker",
        "obstructive parking", "wrong side driving"
    ],
    "Roads & Public Works": [
        "pothole", "potholes", "crater", "craters", "broken road", "asphalt", "flyover", "bridge",
        "sinkhole", "road cave-in", "divider", "road eroded", "road repair"
    ],
    "Drainage & Sewerage": [
        "manhole", "open manhole", "sewer", "sewage", "gutter", "drainage", "clogged drain",
        "blocked drain", "waterlogging", "storm drain", "foul sewer", "drain wall"
    ],
    "Water Supply": [
        "water supply", "drinking water", "water pipe", "pipeline burst", "pipe leakage",
        "contaminated water", "dirty water", "low water pressure", "water tanker", "tap water"
    ],
    "Solid Waste Management": [
        "garbage", "trash", "waste bin", "dustbin", "rotting waste", "dumping", "uncollected waste",
        "dead animal", "carcass", "plastic waste", "litter"
    ],
    "Street Lighting & Electrical": [
        "streetlight", "street light", "light pole", "pitch dark", "dark road", "high mast",
        "flickering light", "broken bulb", "dangling cable", "sparking pole"
    ],
    "Public Health & Sanitation": [
        "mosquito", "dengue", "malaria", "fogging", "public toilet", "urinal", "open defecation",
        "unhygienic", "medical waste", "stale food", "food poisoning"
    ],
    "Fire & Emergency Services": [
        "fire hazard", "fire extinguisher", "emergency exit", "fire hydrant", "gas cylinder",
        "lpg leakage", "bush fire", "building on fire", "fire escape"
    ],
    "Disaster Management": [
        "flash flood", "storm damage", "cyclone", "uprooted tree", "building collapse",
        "landslide", "relief shelter", "embankment breached", "disaster"
    ],
    "Environment & Pollution": [
        "air pollution", "factory smoke", "toxic effluent", "noise pollution", "loudspeaker",
        "water pollution", "plastic burning", "chemical dumping", "smog"
    ],
    "Parks & Public Spaces": [
        "public park", "playground", "swings", "slides", "park bench", "overgrown grass",
        "community garden", "see-saw", "public garden"
    ],
    "Building & Municipal Engineering": [
        "illegal construction", "unauthorized floor", "unsafe building", "dilapidated building",
        "footpath encroachment", "construction debris", "demolition safety", "cracked pillar"
    ],
    "Land & Land Records": [
        "land encroachment", "mutation", "forged deed", "boundary wall dispute", "patta",
        "land survey", "land dispute", "bdo land", "illegal land occupation"
    ],
    "Housing & Urban Development": [
        "slum redevelopment", "affordable housing", "housing complex", "urban planning",
        "housing allotment", "illegal colony", "rainwater harvesting"
    ],
    "Electricity & Power": [
        "transformer", "high tension wire", "power outage", "load shedding", "voltage fluctuation",
        "burnt meter", "electric pole leaning", "feeder line", "frequent power cuts"
    ],
    "Public Transport": [
        "bus stop", "bus schedule", "bus route", "bus driver", "bus conductor", "overcrowded bus",
        "bus shelter", "municipal bus", "bus not stopping"
    ],
    "Railway-related Public Complaints": [
        "railway station", "platform", "train track", "railway crossing", "overbridge",
        "ticket counter", "railway toilet", "loco track"
    ],
    "Health & Hospitals": [
        "hospital", "emergency ward", "doctor absent", "medicines shortage", "ambulance",
        "hospital ward", "maternity ward", "blood bank", "clinic", "casualty"
    ],
    "Food & Public Distribution": [
        "ration shop", "fair price", "subsidized rice", "ration card", "bpl grain",
        "ration dealer", "under-weighing", "rotten wheat", "black-marketing"
    ],
    "Consumer Affairs": [
        "above mrp", "overcharging", "defective product", "warranty refused", "refund denied",
        "counterfeit goods", "fake product", "misleading advertisement"
    ],
    "Education - Schools": [
        "primary school", "school building", "classroom ceiling", "school toilet", "mid-day meal",
        "school teacher absent", "school bus safety", "student safety"
    ],
    "Higher Education": [
        "college", "university", "ragging", "semester exam", "hostel mess", "college fee hike",
        "campus harassment", "library textbooks"
    ],
    "Labour & Employment": [
        "unpaid wages", "minimum wage", "unsafe working conditions", "migrant worker",
        "construction site safety", "illegal termination", "withheld salary"
    ],
    "Agriculture": [
        "irrigation canal", "crop damage", "adulterated seeds", "fertilizer subsidy",
        "cold storage", "mandi price", "farmer", "paddy crop"
    ],
    "Animal Resources": [
        "stray dog", "dog bite", "stray cattle", "injured animal", "rabies",
        "animal slaughter", "veterinary hospital", "animal rescue"
    ],
    "Forest & Wildlife": [
        "tree cutting", "tree felling", "timber smuggling", "wild animal", "poaching",
        "wildlife encroachment", "forest reserve", "green belt destruction"
    ],
    "Public Grievance / General Administration": [
        "birth certificate", "death certificate", "bribery", "bribe demanded", "corruption",
        "unresponsive office", "citizen charter", "public servant misbehavior", "domicile certificate"
    ]
}

class CategoryPredictor:
    def __init__(self):
        self.cat_model = None
        self.subcat_model = None
        self.taxonomy = {}
        self._load_models()

    def _load_models(self):
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

    def check_domain_intent(self, text_lower: str) -> tuple:
        best_cat = None
        max_matches = 0
        best_keywords = []

        for category, keywords in DOMAIN_INTENT_RULES.items():
            matches = [k for k in keywords if k in text_lower]
            if len(matches) > max_matches:
                max_matches = len(matches)
                best_cat = category
                best_keywords = matches

        return best_cat, max_matches, best_keywords

    def predict(self, text: str) -> Dict[str, Any]:
        cleaned = clean_text(text)
        text_lower = text.lower()

        if not cleaned and not text_lower:
            return {
                "category": "Public Grievance / General Administration",
                "department": "Public Grievance / General Administration",
                "subcategory": "General Civic Complaint",
                "confidence": 0.5,
                "alternative_categories": [],
                "is_crime": False,
                "is_emergency": False
            }

        # Check domain expert ontology keywords
        intent_cat, match_count, matched_keywords = self.check_domain_intent(text_lower)

        pred_cat = None
        confidence = 0.85
        top_predictions = []

        # Statistical ML Model Prediction
        if self.cat_model is None:
            self._load_models()

        if self.cat_model is not None:
            probas = self.cat_model.predict_proba([cleaned])[0]
            classes = self.cat_model.classes_

            top_idx = probas.argmax()
            model_cat = classes[top_idx]
            model_conf = float(probas[top_idx])

            # Strong domain match override (e.g. upi fraud -> Cyber Crime, theft -> Police)
            if intent_cat and match_count >= 1:
                # If model agreed or intent is strong
                if intent_cat == model_cat or match_count >= 2:
                    pred_cat = intent_cat
                    confidence = max(model_conf, min(0.92 + (match_count * 0.02), 0.99))
                else:
                    # Model probability comparison
                    intent_idx = list(classes).index(intent_cat) if intent_cat in classes else -1
                    if intent_idx >= 0 and probas[intent_idx] > 0.15:
                        pred_cat = intent_cat
                        confidence = round(float(probas[intent_idx]), 3)
                    else:
                        pred_cat = model_cat
                        confidence = model_conf
            else:
                pred_cat = model_cat
                confidence = model_conf

            # Prepare top alternative predictions
            sorted_indices = probas.argsort()[::-1]
            for idx in sorted_indices[:4]:
                cat_name = str(classes[idx])
                conf_val = round(float(probas[idx]), 3)
                top_predictions.append({"category": cat_name, "confidence": conf_val})
        else:
            pred_cat = intent_cat or "Roads & Public Works"
            top_predictions = [{"category": pred_cat, "confidence": 0.85}]

        # Standardize category name
        if pred_cat == "Education – Schools":
            pred_cat = "Education - Schools"

        # Responsible Department
        dept = CATEGORY_DEPARTMENT_MAP.get(pred_cat, pred_cat)

        # Predict Subcategory
        subcat = "General Issue"
        if self.subcat_model is not None:
            try:
                subcat_probas = self.subcat_model.predict_proba([cleaned])[0]
                subcat_classes = self.subcat_model.classes_
                
                # Check if we have taxonomy for the predicted category
                valid_subcats = self.taxonomy.get(pred_cat, [])
                if valid_subcats:
                    # Filter for classes belonging to this category
                    best_valid_subcat = None
                    best_valid_conf = -1
                    for idx, c in enumerate(subcat_classes):
                        if c in valid_subcats and subcat_probas[idx] > best_valid_conf:
                            best_valid_conf = subcat_probas[idx]
                            best_valid_subcat = c
                    if best_valid_subcat:
                        subcat = best_valid_subcat
                    else:
                        subcat = valid_subcats[0]
                else:
                    subcat = str(subcat_classes[subcat_probas.argmax()])
            except Exception:
                subcat = self.taxonomy.get(pred_cat, ["General Issue"])[0]
        elif pred_cat in self.taxonomy and len(self.taxonomy[pred_cat]) > 0:
            subcat = self.taxonomy[pred_cat][0]

        # Crime and Emergency flags
        is_crime = pred_cat in CRIME_CATEGORIES
        is_emergency = False
        emergency_triggers = [
            "right now", "emergency", "life hazard", "attacking", "missing", "fire",
            "blast", "collapse", "severe flood", "shock", "electric current", "snapped wire",
            "death trap", "bleeding", "ambulance", "poisonous"
        ]
        if any(t in text_lower for t in emergency_triggers):
            is_emergency = True

        # Emergency contact guidance
        emergency_guidance = None
        if pred_cat in EMERGENCY_CONTACTS:
            ec = EMERGENCY_CONTACTS[pred_cat]
            emergency_guidance = {
                "helpline_name": ec["name"],
                "helpline_number": ec["number"],
                "advisory": f"If you or someone else is in immediate danger, please dial {ec['number']} directly. CivicPulse AI records this grievance for administrative action and audit."
            }

        # Alternatives (excluding the predicted category itself)
        alt_cats = [p for p in top_predictions if p["category"] != pred_cat][:3]

        return {
            "category": pred_cat,
            "department": dept,
            "subcategory": subcat,
            "confidence": round(confidence, 3),
            "alternative_categories": alt_cats,
            "is_crime": is_crime,
            "is_emergency": is_emergency,
            "emergency_guidance": emergency_guidance,
            "matched_intent_keywords": matched_keywords[:3] if matched_keywords else []
        }
