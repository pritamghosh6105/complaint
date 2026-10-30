"""
CivicPulse AI — Stage 1: Semantic Incident Understanding Engine (English-Only)
Extracts semantic features, incident type, cause transparency, crime allegations,
investigation requests, and multi-department candidate relevance.
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
                r'\b(?:vehicular collision|vehicle collision|car crash|truck collision|hit and run|road accident|bike accident|bus accident|speeding vehicle|run over|highway collision|road crash)\b'
            ],
            "hospital_negligence": [
                r'\b(?:hospital negligence|medical negligence|doctor negligence|wrong treatment|oxygen shortage|clinical negligence)\b'
            ],
            "workplace_accident": [
                r'\b(?:workplace fatality|factory accident|industrial accident|construction site death|workplace accident|scaffold fall|worker died)\b'
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
            r'\b(?:active shooter|ongoing violence|bombing|firing right now|currently attacking|flames spreading|live wire active)\b'
        ]
        self.no_danger_patterns = [
            r'\b(?:no indication of an ongoing safety hazard|no immediate threat|no ongoing danger|no immediate hazard|threat contained|past incident)\b'
        ]

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
                suggested_subcategory = "Structural Crack & Collapse Hazard"
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
