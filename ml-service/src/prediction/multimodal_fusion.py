"""
CivicPulse AI — Multimodal Text + Vision + Location Fusion Engine
Combines Complaint Text NLP + Computer Vision Evidence + Geographic Sensitivity + Population Exposure
into an explainable final priority and damage severity assessment.

Strictly English-only.
Preserves both text and visual outputs when evidence disagrees and issues a mismatch warning.
"""

from typing import Dict, List, Any, Optional

PRIORITY_LEVELS = {
    'LOW': 1,
    'MEDIUM': 2,
    'HIGH': 3,
    'CRITICAL': 4
}

NUM_TO_PRIORITY = {v: k for k, v in PRIORITY_LEVELS.items()}

# Verified Damage Severity ordering
DAMAGE_SEVERITY_LEVELS = {
    'LOW': 1,
    'MODERATE': 2,
    'SEVERE': 3,
    'CRITICAL': 4
}

class MultimodalFusionEngine:
    def __init__(self):
        self.engine_version = "2.5.0-multimodal"

    def evaluate(
        self,
        text_priority: str = "MEDIUM",
        text_category: str = "",
        text_subcategory: str = "",
        visual_severity: Optional[str] = None,
        visual_label: Optional[str] = None,
        visual_category: Optional[str] = None,
        location_type: str = "Residential",
        affected_count: int = 50,
        is_emergency: bool = False,
        evidence_consistency: str = "MATCH",
        district: Optional[str] = None,
        description: Optional[str] = None,
        spam_score: Optional[float] = None,
        fraud_risk_level: Optional[str] = None,
        fraud_indicators: Optional[List[str]] = None,
        clearance_tier: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes multimodal fusion combining text, visual evidence, and location.
        Outputs distinct:
        - visual_damage_severity: LOW | MODERATE | SEVERE | CRITICAL
        - final_priority: LOW | MEDIUM | HIGH | CRITICAL
        - mismatch_warning: bool
        - requires_human_review: bool
        """
        risk_factors: List[str] = []
        text_prio = text_priority.upper() if text_priority else "MEDIUM"
        if text_prio not in PRIORITY_LEVELS:
            text_prio = "MEDIUM"

        # Determine visual damage severity
        vis_sev_raw = (visual_severity or "LOW").upper()
        if vis_sev_raw == "MEDIUM":
            vis_sev = "MODERATE"
        elif vis_sev_raw in DAMAGE_SEVERITY_LEVELS:
            vis_sev = vis_sev_raw
        else:
            vis_sev = "MODERATE"

        # Base score starts with text prediction
        score = PRIORITY_LEVELS[text_prio]
        requires_human_review = False
        mismatch_warning = False
        mismatch_details = None

        # 1. Emergency Flag Override (Immediate Danger)
        if is_emergency:
            return {
                "text_priority": text_prio,
                "visual_damage_severity": vis_sev,
                "final_priority": "CRITICAL",
                "sla_hours": 24,
                "mismatch_warning": False,
                "requires_human_review": True,
                "risk_factors": [
                    "Immediate Emergency / Danger Flagged by Citizen",
                    "Urgent Public Safety Intervention Required"
                ],
                "decision_reason": "Emergency indicator triggered immediate administrative escalation to CRITICAL (24-hour statutory SLA).",
                "engine_version": self.engine_version
            }

        # 2. Category & Evidence Consistency Check (Phase 8 Disagreement Handling)
        is_fraud_suspect = fraud_risk_level in ["HIGH", "CRITICAL"] or (spam_score is not None and spam_score >= 0.60)
        is_mismatched_evidence = (
            evidence_consistency in ["MISMATCH", "POSSIBLE MISMATCH", "MISMATCH_WARNING"] or
            (visual_category and visual_category != "INSUFFICIENT_VISUAL_EVIDENCE" and text_category and
             visual_category.strip().lower() != text_category.strip().lower() and
             visual_category != "Digital & Administrative Evidence") or
            is_fraud_suspect
        )

        if is_mismatched_evidence:
            mismatch_warning = True
            requires_human_review = True
            mismatch_details = (
                f"Disagreement detected: Reported complaint text indicates '{text_category}', "
                f"whereas visual evidence analysis detected elements characteristic of '{visual_category or visual_label}'. "
                f"Both results preserved; routed for human verification without overriding text classification."
            )
            risk_factors.append("⚠️ Visual Evidence Mismatch (Reported description differs from detected image scene)")
            if is_fraud_suspect:
                risk_factors.append(f"⚠️ High Spam/Fraud Risk Detected ({fraud_risk_level or 'HIGH'}) — Evidence decoupled from priority calculation")

        # 3. Location Vulnerability Analysis (Sensitive Zones)
        loc_lower = (location_type or "Residential").lower()
        is_sensitive_zone = False

        if any(z in loc_lower for z in ['school', 'college', 'kindergarten', 'institution']):
            risk_factors.append("High-Exposure Educational Zone (Vulnerable Students Present)")
            is_sensitive_zone = True
        elif any(z in loc_lower for z in ['hospital', 'clinic', 'medical', 'emergency']):
            risk_factors.append("Critical Healthcare Corridor (Emergency Vehicle Access Route)")
            is_sensitive_zone = True
        elif any(z in loc_lower for z in ['highway', 'flyover', 'expressway', 'main road']):
            risk_factors.append("High-Speed Arterial Thoroughfare (Vehicular Collision Risk)")
            is_sensitive_zone = True
        elif any(z in loc_lower for z in ['market', 'bazaar', 'station', 'bus terminus']):
            risk_factors.append("High Footfall Commercial Transit Hub")
            is_sensitive_zone = True

        # 4. Computer Vision Evidence Signal
        # CRITICAL PRINCIPLE: If evidence is a MISMATCH, visual hazards in the unrelated image MUST NEVER escalate complaint priority!
        if is_mismatched_evidence:
            risk_factors.append(
                f"ℹ️ Visual hazard detected in image ({visual_label or 'Unrelated scene'}) was NOT applied to complaint priority "
                "because photographic evidence was assessed as a MISMATCH with the reported grievance."
            )
        else:
            if visual_label in ['open_manhole', 'caved_road', 'exposed_wire', 'active_fire', 'dilapidated_building']:
                risk_factors.append(f"Severe Physical Hazard Confirmed by Vision AI ({visual_label.replace('_', ' ').title()})")
                if is_sensitive_zone or score >= 3:
                    score = 4 # Escalate to CRITICAL
                    requires_human_review = True
                else:
                    score = max(score, 3) # At least HIGH

            elif visual_label in ['pothole', 'pipe_burst', 'waterlogging', 'sewage_overflow', 'fallen_tree', 'heavy_smoke']:
                risk_factors.append(f"Infrastructure Disruption Confirmed by Vision AI ({visual_label.replace('_', ' ').title()})")
                if is_sensitive_zone:
                    score = max(score, 3) # HIGH in sensitive zone

            elif visual_label in ['broken_streetlight']:
                risk_factors.append("Civic Luminaire Outage Confirmed by Vision AI")
                if not is_sensitive_zone and score < 3:
                    score = min(score, 2)

        # 5. Population Impact Multiplier
        if affected_count >= 250:
            risk_factors.append(f"Major Community Exposure ({affected_count}+ residents impacted daily)")
            score = min(4, score + 1)
        elif affected_count >= 50:
            risk_factors.append(f"Moderate Neighborhood Impact ({affected_count} residents)")

        # Map back to priority string
        final_priority = NUM_TO_PRIORITY[min(4, max(1, score))]
        sla_hours = 24 if final_priority == "CRITICAL" else (48 if final_priority == "HIGH" else (72 if final_priority == "MEDIUM" else 120))

        # Flag for human review if CRITICAL or uncertain
        if final_priority == "CRITICAL" or mismatch_warning:
            requires_human_review = True

        # Decision rationale
        if is_mismatched_evidence:
            decision_reason = (
                f"Complaint priority maintained as {final_priority} based on reported grievance context. "
                "Photographic evidence was identified as a MISMATCH with the reported complaint and was decoupled to prevent priority distortion."
            )
        elif final_priority == "CRITICAL":
            decision_reason = "Critical public safety hazard confirmed by multimodal evaluation; expedited 24-hour SLA."
        elif final_priority == "HIGH":
            decision_reason = "High civic impact or significant physical degradation verified across text and photographic evidence."
        elif final_priority == "MEDIUM":
            decision_reason = "Standard community maintenance requirement verified with normal 72-hour operational SLA."
        else:
            decision_reason = "Low-urgency civic repair; routine scheduling without immediate public hazard."

        return {
            "primary_category": text_category,
            "visual_category": visual_category,
            "text_priority": text_prio,
            "visual_damage_severity": vis_sev,
            "final_priority": final_priority,
            "sla_hours": sla_hours,
            "mismatch_warning": mismatch_warning,
            "mismatch_details": mismatch_details,
            "requires_human_review": requires_human_review,
            "risk_factors": risk_factors,
            "decision_reason": decision_reason,
            "spam_score": spam_score,
            "fraud_risk_level": fraud_risk_level or ("HIGH" if (spam_score and spam_score >= 0.60) else "LOW"),
            "fraud_indicators": fraud_indicators or [],
            "clearance_tier": clearance_tier or ("FLAGGED_FRAUD_REVIEW" if (is_fraud_suspect or is_mismatched_evidence) else ("MANDATORY_OFFICER_TRIAGE" if final_priority == "CRITICAL" else "STANDARD_REVIEW")),
            "engine_version": self.engine_version
        }

multimodal_fusion = MultimodalFusionEngine()
