"""
CivicPulse AI — Stage 1: Semantic Incident Understanding & Clarification Engine
Extracts structured incident representation, identifies vague citizen grievances,
generates context-aware clarification questions without asking unnecessary questions,
and handles fatal incidents vs police investigations.
"""

import re
from typing import Dict, Any, List, Optional

class IncidentUnderstandingEngine:
    def __init__(self):
        # 1. Fatal Incident / Death Regex Patterns (English)
        self.fatal_patterns = [
            r'\b(?:killed|killing|fatal|fatality|death|died|dead body|dead person|corpse|loss of a? ?life|murder|homicide|found dead|mortality)\b'
        ]
        
        # 2. Investigation / Inquiry Request Patterns (English)
        self.investigation_patterns = [
            r'\b(?:inquiry|investigation|investigate|inquest|police probe|official inquiry|police inquiry|law[- ]enforcement|file an? fir|charge sheet|probe)\b'
        ]
        
        # 3. Specific Cause Patterns for Fatal Incidents (English)
        self.cause_patterns = {
            "traffic_collision": [
                r'\b(?:vehicular collision|vehicle collision|car crash|truck collision|truck hit|car hit|bike crash|motorcycle accident|hit a motorcycle|hit and run|road accident|bike accident|bus accident|speeding vehicle|speeding truck|run over|highway collision|road crash)\b'
            ],
            "hospital_negligence": [
                r'\b(?:hospital negligence|medical negligence|doctor negligence|wrong treatment|oxygen shortage|clinical negligence)\b'
            ],
            "workplace_accident": [
                r'\b(?:workplace fatality|factory accident|industrial accident|construction site death|workplace accident|scaffold fall|worker died|worker killed|construction worker|falling from.*scaffold|industrial injury)\b'
            ],
            "building_collapse": [
                r'\b(?:building collapse|wall collapse|structural collapse|roof fell|slab collapsed)\b'
            ],
            "fire_incident": [
                r'\b(?:burnt in fire|fire outbreak|smoke asphyxiation|cylinder explosion death|trapped in flames)\b'
            ]
        }
        
        # 4. Unknown / Unspecified Cause Explicit Indicators (English)
        self.unspecified_cause_patterns = [
            r'\b(?:unspecified location|details remain limited|cause of death is not specified|unexplained|unclear cause|mysterious death|suspicious death|circumstances remain limited|unknown cause)\b'
        ]
        
        # 5. Ongoing Emergency / Threat Patterns vs Negation (English)
        self.active_danger_patterns = [
            r'\b(?:active shooter|ongoing violence|bombing|firing right now|currently attacking|flames spreading|live wire active|sparking wire|hanging wire)\b'
        ]
        self.no_danger_patterns = [
            r'\b(?:no indication of an ongoing safety hazard|no immediate threat|no ongoing danger|no immediate hazard|threat contained|past incident)\b'
        ]

    def extract_structured_incident(self, text: str, title: Optional[str] = None) -> Dict[str, Any]:
        """
        Extracts structured incident representation as specified in Primary Objective:
        {
          "incident_type": ...,
          "incident_subtype": ...,
          "incident_summary": ...,
          "reported_location": ...,
          "incident_date": ...,
          "affected_people": ...,
          "visible_damage": ...,
          "immediate_danger": ...,
          "requested_action": ...,
          "missing_information": [],
          "uncertainties": [],
          "is_vague": bool,
          "clarification_questions": []
        }
        """
        full_text = f"{title or ''} — {text}".strip(" —") if title else (text or '')
        text_lower = full_text.lower()
        cleaned_words = re.findall(r'\b\w+\b', text_lower)
        word_count = len(cleaned_words)

        # 1. Location Extraction
        location_patterns = [
            r'\b(?:at|near|on|in|around|opposite|behind)\s+([A-Za-z0-9\s\-\.\,\/]{3,50}?)(?:\b(?:ward|street|road|lane|crossing|junction|bazaar|market|station|hospital|school|gate|more|chowk|nagar|colony|district|village|block)\b)',
            r'\b(ward\s+\d+|gp|gram panchayat|municipality|panchayat)\b'
        ]
        reported_location = None
        for pat in location_patterns:
            loc_match = re.search(pat, full_text, re.IGNORECASE)
            if loc_match:
                reported_location = loc_match.group(0).strip(" ,.")
                break

        # 2. Date / Duration Extraction
        date_patterns = [
            r'\b(?:yesterday|today|last night|this morning|past\s+\d+\s+(?:days|hours|weeks)|for\s+(?:the\s+last|past)?\s*\d+\s*(?:hours|days|weeks|months)|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'
        ]
        incident_date = None
        for pat in date_patterns:
            date_match = re.search(pat, text_lower)
            if date_match:
                incident_date = date_match.group(0).strip()
                break

        # 3. Affected People Extraction
        affected_patterns = [
            r'\b(\d+)\s+(?:households|families|people|citizens|residents|children|students|patients|workers|commuters)\b',
            r'\b(?:entire\s+residential\s+block|whole\s+village|all\s+residents|multiple\s+families)\b'
        ]
        affected_people = None
        for pat in affected_patterns:
            aff_match = re.search(pat, text_lower)
            if aff_match:
                affected_people = aff_match.group(0).strip()
                break

        # 4. Visible Damage Extraction
        damage_patterns = [
            r'\b(?:potholes?|craters?|cave-in|sinkhole|cracks?|broken\s+(?:slab|railing|pipe|wire|pole|bench|wall)|leaking\s+(?:oil|water|sewage)|uncovered\s+manhole|overflowing\s+(?:drain|vat|garbage)|uprooted\s+trees?)\b'
        ]
        visible_damage = None
        for pat in damage_patterns:
            dam_match = re.search(pat, text_lower)
            if dam_match:
                visible_damage = dam_match.group(0).strip()
                break

        # 5. Immediate Danger Extraction
        danger_patterns = [
            r'\b(?:sparking|live\s+wire|fire\s+outbreak|flames|smoke|flooding|waterlogging|rabid\s+dog|assault|armed|choking|electrocution|accident\s+hazard|death\s+trap)\b'
        ]
        immediate_danger = None
        for pat in danger_patterns:
            dang_match = re.search(pat, text_lower)
            if dang_match:
                immediate_danger = dang_match.group(0).strip()
                break

        # 6. Requested Action Extraction
        action_patterns = [
            r'\b(?:repair|replacement|demolition|investigation|restoration|inquest|dispatch|inspection|clearance|cleaning|spraying|shutdown|compensation)\b[A-Za-z\s]{0,30}'
        ]
        requested_action = None
        for pat in action_patterns:
            act_match = re.search(pat, text_lower)
            if act_match:
                requested_action = act_match.group(0).strip()
                break

        # Basic Stage 1 Classification
        stage1_analysis = self.analyze_complaint(full_text)
        incident_type = stage1_analysis.get("incident_type", "Standard Civic Complaint")
        incident_subtype = stage1_analysis.get("suggested_subcategory")

        # Incident Summary
        incident_summary = (title or text.split(".")[0]).strip()
        if len(incident_summary) > 120:
            incident_summary = incident_summary[:117] + "..."

        # 7. Vague Grievance Detection & Clarification Formulation
        missing_information = []
        uncertainties = []
        clarification_questions = []

        if not reported_location:
            missing_information.append("Specific location / street / landmark")
            clarification_questions.append("Where exactly is the incident located (street, landmark, ward, or district)?")

        if not visible_damage and any(k in text_lower for k in ["road", "street", "pipe", "drain", "building", "light"]):
            missing_information.append("Physical nature of damage (e.g. potholes, cracks, cave-in, leak)")
            clarification_questions.append("What is the exact physical nature of the problem (e.g., potholes, cracks, or a collapsed section)?")

        if not immediate_danger and not any(k in text_lower for k in ["safe", "normal", "routine", "no threat"]):
            if any(k in text_lower for k in ["road", "wire", "pole", "fire", "dog", "flood", "manhole", "water"]):
                missing_information.append("Current safety risk level for vehicles or pedestrians")
                clarification_questions.append("Is there an ongoing safety hazard for vehicles or pedestrians?")

        if not affected_people:
            uncertainties.append("Estimated number of impacted citizens or households is unverified")

        # Determine if grievance is vague
        # A complaint is vague if it has <= 8 words, or lacks both location and damage details
        is_vague = (word_count < 8) or (not reported_location and not visible_damage and word_count < 15)

        # Do NOT ask questions if complaint already has sufficient operational context
        if not is_vague:
            clarification_questions = []

        return {
            "incident_type": incident_type if incident_type != "Standard Civic Complaint" else (stage1_analysis.get("cause_category") or "Civic Service Issue"),
            "incident_subtype": incident_subtype,
            "incident_summary": incident_summary if incident_summary else None,
            "reported_location": reported_location,
            "incident_date": incident_date,
            "affected_people": affected_people,
            "visible_damage": visible_damage,
            "immediate_danger": immediate_danger,
            "requested_action": requested_action,
            "missing_information": missing_information,
            "uncertainties": uncertainties,
            "is_vague": is_vague,
            "clarification_questions": clarification_questions[:3]
        }

    def analyze_complaint(self, text: str) -> Dict[str, Any]:
        """
        Stage 1 Analysis: Produces structured semantic interpretation.
        """
        text_lower = (text or '').lower()
        
        # Check Fatal Incident
        is_fatal = any(bool(re.search(p, text_lower)) for p in self.fatal_patterns)
        
        # Check Investigation Request
        investigation_requested = any(bool(re.search(p, text_lower)) for p in self.investigation_patterns)
        
        # Check Cause
        cause_identified = None
        for cause_key, patterns in self.cause_patterns.items():
            if any(bool(re.search(p, text_lower)) for p in patterns):
                cause_identified = cause_key
                break
                
        is_unspecified = any(bool(re.search(p, text_lower)) for p in self.unspecified_cause_patterns)
        cause_known = (cause_identified is not None) and not is_unspecified
        
        # Check Emergency
        has_active_danger = any(bool(re.search(p, text_lower)) for p in self.active_danger_patterns)
        has_negation = any(bool(re.search(p, text_lower)) for p in self.no_danger_patterns)
        emergency_status = has_active_danger and not has_negation
        
        # Classify Primary Incident Type
        incident_type = "Standard Civic Complaint"
        secondary_departments = []
        requires_human_review = False
        reason = ""
        suggested_primary = None
        suggested_subcategory = None
        
        if is_fatal:
            incident_type = "Fatal Incident / Death"
            requires_human_review = True
            
            if cause_identified == "traffic_collision":
                suggested_primary = "Traffic & Road Safety"
                suggested_subcategory = "Fatal Vehicle Collision"
                secondary_departments = ["Police & Law Enforcement"]
                reason = "Fatal incident caused by a road vehicle collision. Primary responsibility rests with Traffic & Road Safety, with Police & Law Enforcement inquiry assistance."
            elif cause_identified == "hospital_negligence":
                suggested_primary = "Health & Hospitals"
                suggested_subcategory = "Hospital Medical Negligence Inquiry"
                secondary_departments = ["Police & Law Enforcement"]
                reason = "Fatal incident allegedly caused by hospital/medical negligence. Primary jurisdiction is Health & Hospitals, with Police inquiry involvement."
            elif cause_identified == "workplace_accident":
                suggested_primary = "Labour & Employment"
                suggested_subcategory = "Workplace Fatality / Industrial Injury Compensation"
                secondary_departments = ["Police & Law Enforcement"]
                reason = "Fatal industrial/workplace accident reported. Primary responsibility is Labour & Employment, with Police incident registration."
            elif cause_identified == "building_collapse":
                suggested_primary = "Building & Municipal Engineering"
                suggested_subcategory = "Dilapidated Dangerous Building at Risk of Collapse"
                secondary_departments = ["Fire & Emergency Services", "Police & Law Enforcement"]
                reason = "Fatal structural or building collapse reported. Building & Municipal Engineering handles structural liability with Emergency and Police support."
            elif cause_identified == "fire_incident":
                suggested_primary = "Fire & Emergency Services"
                suggested_subcategory = "Residential Structure Fire"
                secondary_departments = ["Police & Law Enforcement"]
                reason = "Fatal incident caused by fire hazard. Fire & Emergency Services has primary rescue jurisdiction, with Police legal registration."
            else:
                # Unspecified, unexplained, or suspicious death requesting inquiry
                suggested_primary = "Police & Law Enforcement"
                suggested_subcategory = "Death Investigation / Suspicious or Unexplained Death (pending verification)"
                secondary_departments = []
                reason = (
                    "The complaint reports a fatal incident resulting in the loss of life and explicitly requests an official law-enforcement "
                    "inquiry and report. The cause of death is unspecified; therefore, law-enforcement investigation takes primary jurisdiction."
                )
        
        return {
            "is_fatal": is_fatal,
            "incident_type": incident_type,
            "cause_known": cause_known,
            "cause_category": cause_identified,
            "investigation_requested": investigation_requested,
            "emergency_status": emergency_status,
            "requires_human_review": requires_human_review,
            "suggested_primary": suggested_primary,
            "suggested_subcategory": suggested_subcategory,
            "secondary_departments": secondary_departments,
            "semantic_reason": reason
        }

# Global singleton
incident_engine = IncidentUnderstandingEngine()
