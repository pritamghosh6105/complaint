import re
import unicodedata
import numpy as np
import pandas as pd
from typing import Dict, List, Any

# English Negation patterns to avoid false positives (e.g. "no immediate danger", "no threat to the public")
NEGATION_PATTERNS = [
    r'\bno\s+(?:immediate\s+)?(?:danger|threat|risk|emergency|hazard|harm)\b',
    r'\bno\s+indication\s+of\s+(?:an?\s+)?(?:ongoing|immediate|active)\s+(?:safety\s+hazard|threat|danger|risk)\b',
    r'\bno\s+ongoing\s+(?:safety\s+hazard|threat|danger|risk|hazard)\b',
    r'\bno\s+(?:ongoing\s+)?(?:safety\s+hazard\s+or\s+immediate\s+threat|threat\s+to\s+the\s+public)\b',
    r'\bnot\s+(?:dangerous|fatal|critical|threatening|urgent)\b',
    r'\bwithout\s+any\s+(?:immediate\s+)?(?:danger|threat|risk)\b'
]

def check_has_negation(text_lower: str) -> bool:
    for pat in NEGATION_PATTERNS:
        if re.search(pat, text_lower):
            return True
    return False

def extract_safety_features(text: str) -> Dict[str, int]:
    """
    Extracts binary risk indicators for English complaints.
    Properly accounts for danger negations.
    """
    if not isinstance(text, str):
        text = ""
    t = text.lower()
    has_neg = check_has_negation(t)
    
    # Check if ongoing active crisis (e.g. "right now", "currently", "at this moment")
    is_active_now = bool(
        re.search(r'\b(right now|currently|happening now|in progress|at this moment)\b', t)
    )
    
    # 1. Immediate danger
    imm_danger = 0
    if not has_neg:
        if (
            is_active_now or
            bool(re.search(r'\b(immediate danger|grave danger|critical danger|lethal peril|mortal peril)\b', t))
        ):
            imm_danger = 1
            
    # 2. Life threat
    life_threat = 0
    if not has_neg:
        if (
            bool(re.search(r'\b(electrocuted|electrocution|life[- ]threatening|drowning|suffocating|bloodshed|fatal|kill|dying)\b', t))
        ):
            life_threat = 1
            
    # 3. Electrical hazard
    elec_hazard = 1 if bool(
        re.search(r'\b(live.*wire|sparking|electric shock|high voltage|11kv|transformer blast|electrocuted|electrocution|overhead wire snapped)\b', t)
    ) else 0

    # 4. Violence detected
    violence = 1 if bool(
        re.search(r'\b(attack|assault|attacking|attacked|beating|mob clash|firing|bomb|stabbing|armed)\b', t)
    ) else 0

    # 5. Fire detected
    fire = 1 if bool(
        re.search(r'\b(fire|blaze|ablaze|burning|flames|smoke|cylinder blast|explosion|gas leak)\b', t)
    ) else 0

    # 6. Child safety
    child = 1 if bool(
        re.search(r'\b(child|children|minor|baby|school entrance|school gate|kidnap|abduction)\b', t)
    ) else 0

    # 7. Women safety
    woman = 1 if bool(
        re.search(r'\b(woman|female|girl|girls|harassed|harassment|stalking|stalked|followed|eve teasing|molestation)\b', t)
    ) else 0

    # 8. Cyber fraud
    cyber = 1 if bool(
        re.search(r'\b(otp|online fraud|fraud|bank account|charged|debited|hacked|siphoned|phishing|scam)\b', t)
    ) else 0

    # 9. Stolen / Crime
    crime = 1 if bool(
        re.search(r'\b(stole|stolen|theft|burglary|robbery|snatching|thieves|thief|break-in|extortion)\b', t)
    ) else 0

    # 10. Major health risk
    health = 1 if bool(
        re.search(r'\b(large pile of waste|health risk|severe health|stench|carcass|epidemic|cholera|diarrhea|toxic|rotting)\b', t)
    ) else 0

    # 11. Accident risk
    accident = 1 if bool(
        re.search(r'\b(pothole|craters|suddenly brake|accidents are becoming likely|accidents occurring|skid|crash|collision|reckless speed)\b', t)
    ) else 0

    # 12. Public infrastructure risk
    infra = 1 if bool(
        re.search(r'\b(uncovered manhole|open manhole|manhole|bridge pier|bridge crack|sinkhole|cave-in|flyover)\b', t)
    ) else 0

    # 13. Injury reported
    injury = 1 if bool(
        re.search(r'\b(injury|injured|bleeding|fractured|hospitalized|casualties|casualty)\b', t)
    ) else 0

    # 14. Disaster detected
    disaster = 1 if bool(
        re.search(r'\b(flood|cyclone|inundation|landslide|dam breach|collapsed)\b', t)
    ) else 0

    return {
        "immediate_danger": imm_danger,
        "life_threat": life_threat,
        "injury_reported": injury,
        "violence_detected": violence,
        "fire_detected": fire,
        "electrical_hazard": elec_hazard,
        "child_safety_risk": child,
        "women_safety_risk": woman,
        "crime_detected": crime,
        "cyber_fraud": cyber,
        "major_health_risk": health,
        "disaster_detected": disaster,
        "accident_risk": accident,
        "public_infrastructure_risk": infra
    }

def calculate_safety_score(text: str, severity: str = "Medium", location_type: str = "Residential") -> float:
    feats = extract_safety_features(text)
    
    score = 0.0
    score += feats.get("life_threat", 0) * 2.0
    score += feats.get("immediate_danger", 0) * 1.8
    score += feats.get("violence_detected", 0) * 1.5
    score += feats.get("fire_detected", 0) * 1.5
    score += feats.get("electrical_hazard", 0) * 1.5
    score += feats.get("child_safety_risk", 0) * 1.0
    score += feats.get("women_safety_risk", 0) * 1.0
    score += feats.get("accident_risk", 0) * 0.9
    score += feats.get("public_infrastructure_risk", 0) * 1.0
    score += feats.get("major_health_risk", 0) * 0.9
    score += feats.get("disaster_detected", 0) * 1.2
    score += feats.get("crime_detected", 0) * 0.7
    score += feats.get("cyber_fraud", 0) * 0.6
    
    return float(np.clip(score, 0.0, 5.0))

def build_structured_features(df: pd.DataFrame) -> pd.DataFrame:
    res = pd.DataFrame(index=df.index)
    texts = df['complaint_text'].fillna('').astype(str)
    
    all_feats = [extract_safety_features(t) for t in texts]
    for k in [
        "immediate_danger", "life_threat", "injury_reported", "violence_detected",
        "fire_detected", "electrical_hazard", "child_safety_risk", "women_safety_risk",
        "crime_detected", "cyber_fraud", "major_health_risk", "disaster_detected",
        "accident_risk", "public_infrastructure_risk"
    ]:
        res[k] = [f.get(k, 0) for f in all_feats]
        
    affected = df['affected_citizens'].fillna(df.get('affected_count', 20)).astype(float)
    res['large_population_affected'] = (affected >= 200).astype(int)
    res['log_affected'] = np.log1p(affected.clip(lower=1))
    
    duration = df['duration_days'].fillna(3).astype(float) if 'duration_days' in df.columns else pd.Series(3.0, index=df.index)
    res['duration_days'] = duration.clip(lower=1, upper=60)
    
    res['safety_score'] = [
        calculate_safety_score(t, s if s else "Medium", l if l else "Residential")
        for t, s, l in zip(texts, df.get('severity', ['Medium']*len(df)), df.get('location_type', ['Residential']*len(df)))
    ]
    
    return res

def extract_human_risk_factors(
    text: str,
    location_type: str = "Residential",
    affected_count: int = 50,
    severity: str = "Medium",
    emergency_override: bool = False
) -> List[str]:
    feats = extract_safety_features(text)
    factors = []
    
    if emergency_override or feats.get("immediate_danger") or feats.get("life_threat"):
        factors.append("Immediate Life-Safety Hazard Detected")
    if feats.get("electrical_hazard"):
        factors.append("Electrical Hazard / High-Voltage Risk")
    if feats.get("fire_detected"):
        factors.append("Active Fire / Thermal Emergency")
    if feats.get("violence_detected"):
        factors.append("Active Physical Attack / Violent Conflict")
    if feats.get("child_safety_risk"):
        factors.append("Child Safety / Vulnerable Minors at Risk")
    if feats.get("women_safety_risk"):
        factors.append("Women Safety Concern / Repeated Harassment")
    if feats.get("accident_risk"):
        factors.append("Accident Risk on Busy Carriageway")
    if feats.get("public_infrastructure_risk"):
        factors.append("Critical Public Infrastructure Vulnerability")
    if feats.get("major_health_risk"):
        factors.append("Significant Public Health & Contamination Risk")
    if feats.get("disaster_detected"):
        factors.append("Natural Disaster / Structural Inundation")
    if feats.get("cyber_fraud"):
        factors.append("Financial Cyber Fraud / Account Intrusion")
    if feats.get("crime_detected"):
        factors.append("Criminal Activity / Property Breach")
        
    if location_type in ["Hospital", "School", "Highway", "Market"]:
        factors.append(f"High-Density Sensitive Zone ({location_type})")
        
    if affected_count >= 200:
        factors.append(f"Large Population Impact ({affected_count}+ citizens)")
    elif affected_count >= 50:
        factors.append(f"Moderate Community Impact ({affected_count} citizens)")
        
    if not factors:
        factors.append("Routine Civic Maintenance Requirement")
        
    return factors

# Alias for backward compatibility
extract_safety_score = calculate_safety_score
