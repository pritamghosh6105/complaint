"""
CivicPulse AI — Multimodal Evidence Matching Engine (Stage B)
Evaluates visual findings independently from complaint context to determine whether
an image provides meaningful, calibrated corroboration for reported grievances.

Strictly English-only.
Prevents false matches (e.g. open manhole attached to UPI fraud is flagged as MISMATCH).
"""

from typing import Dict, Any, Optional, List

# Categories where photographic evidence alone is non-corroborative
STRICTLY_NON_VISUAL_CATEGORIES = {
    "Cyber Crime",
    "Consumer Affairs",
    "Labour & Employment",
    "Finance & Revenue",
    "Higher Education",
    "School Education",
    "Public Grievance / General Administration",
    "Personnel & Administrative Reforms",
    "Law & Judicial",
    "Information Technology & Electronics"
}

# Cross-domain correlated categories (e.g., water on road relates to Roads and Drainage)
CROSS_CORRIDOR_MAP = {
    "Roads & Public Works": {"Drainage & Sewerage", "Water Supply", "Disaster Management"},
    "Drainage & Sewerage": {"Roads & Public Works", "Water Supply", "Environment & Pollution"},
    "Water Supply": {"Drainage & Sewerage", "Roads & Public Works"},
    "Street Lighting & Electrical": {"Power & Energy", "Disaster Management"},
    "Solid Waste Management": {"Environment & Pollution", "Drainage & Sewerage"},
    "Environment & Pollution": {"Solid Waste Management", "Water Supply"}
}

class EvidenceMatcher:
    def __init__(self):
        self.matcher_version = "3.0.0-evidence-matching"

    @staticmethod
    def calculate_semantic_similarity(
        combined_text: str,
        detected_incident: str,
        visual_category: str,
        visual_subcategory: str,
        evidence_match: str
    ) -> float:
        """
        Computes a calibrated 0.0 to 1.0 cross-modal semantic correlation score
        between the citizen complaint text and visual detection findings.
        """
        if evidence_match == "MATCH":
            base = 0.82
        elif evidence_match == "PARTIAL_MATCH":
            base = 0.58
        elif evidence_match == "MISMATCH":
            base = 0.12
        else:
            base = 0.10

        incident_terms = set(detected_incident.lower().replace('/', ' ').split())
        cat_terms = set(visual_category.lower().replace('&', ' ').split())
        all_terms = (incident_terms | cat_terms) - {"with", "from", "road", "public", "water", "and", "the", "for"}
        
        overlap_hits = sum(1 for t in all_terms if len(t) > 3 and t in combined_text)
        bonus = min(0.16, overlap_hits * 0.05)
        return round(min(0.99, max(0.05, base + bonus)), 2)

    def match_evidence(
        self,
        image_findings: Dict[str, Any],
        complaint_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Stage B: Compares image findings against complaint context.
        Returns:
        - complaint_category
        - complaint_subcategory
        - evidence_match: MATCH | PARTIAL_MATCH | MISMATCH | INSUFFICIENT_EVIDENCE | PENDING_ANALYSIS
        - match_confidence: Optional[float]
        - explanation: str
        - mismatch_warning: bool
        - human_review_required: bool
        """
        complaint_category = complaint_context.get("category", "").strip()
        complaint_subcategory = complaint_context.get("subcategory", "").strip()
        title = complaint_context.get("title", "").strip()
        description = complaint_context.get("description", "").strip()

        combined_text = f"{title} {description} {complaint_category} {complaint_subcategory}".lower()

        # Extract Stage A image findings
        detected_incident = image_findings.get("detected_incident", "Unidentified Visual Feature")
        visual_category = image_findings.get("visual_category") or ""
        visual_subcategory = image_findings.get("visual_subcategory") or ""
        visual_severity = image_findings.get("visual_severity", "UNKNOWN")
        image_quality = image_findings.get("image_quality", "GOOD")
        is_digital_document = image_findings.get("is_digital_document", False)
        visual_confidence = image_findings.get("confidence")

        # 0. Pending Analysis
        if image_quality == "PENDING" or detected_incident == "PENDING_ANALYSIS":
            return {
                "complaint_category": complaint_category,
                "complaint_subcategory": complaint_subcategory,
                "evidence_match": "PENDING_ANALYSIS",
                "semantic_similarity": 0.0,
                "match_confidence": None,
                "explanation": "No photographic evidence provided or analysis is currently pending.",
                "mismatch_warning": False,
                "human_review_required": False
            }

        # 1. Quality & Retrieval Failures
        if image_quality in ["BLURRY", "DAMAGED_IMAGE", "CORRUPTED", "INSUFFICIENT_EVIDENCE"]:
            return {
                "complaint_category": complaint_category,
                "complaint_subcategory": complaint_subcategory,
                "evidence_match": "INSUFFICIENT_EVIDENCE",
                "semantic_similarity": 0.10,
                "match_confidence": None,
                "explanation": (
                    f"The uploaded photograph has degraded visual clarity ({image_quality.replace('_', ' ').title()}). "
                    "Automated vision algorithms cannot establish reliable feature correlation. Field inspection recommended."
                ),
                "mismatch_warning": False,
                "human_review_required": True
            }

        if detected_incident == "INSUFFICIENT_VISUAL_EVIDENCE" or detected_incident == "Unidentified Scene / No Distinct Civic Hazard":
            return {
                "complaint_category": complaint_category,
                "complaint_subcategory": complaint_subcategory,
                "evidence_match": "INSUFFICIENT_EVIDENCE",
                "semantic_similarity": 0.10,
                "match_confidence": None,
                "explanation": (
                    "Photographic evidence does not display identifiable municipal hazard signatures or clear infrastructure anomalies. "
                    "Submission accepted for standard officer review."
                ),
                "mismatch_warning": False,
                "human_review_required": True
            }

        # 2. Non-Visual / Financial / Cyber Complaints (e.g. UPI fraud, banking scams)
        is_cyber_or_financial = (
            complaint_category in STRICTLY_NON_VISUAL_CATEGORIES or
            any(w in combined_text for w in ["upi", "fraud", "scam", "otp", "phishing", "cyber", "unauthorized transfer", "bank"])
        )

        if is_cyber_or_financial:
            if is_digital_document:
                return {
                    "complaint_category": complaint_category or "Cyber Crime",
                    "complaint_subcategory": complaint_subcategory or "Digital Financial Fraud",
                    "evidence_match": "PARTIAL_MATCH",
                    "semantic_similarity": 0.75,
                    "match_confidence": None,
                    "explanation": (
                        "The image shows a digital mobile screenshot or transaction slip. While it provides record evidence that a transaction exists, "
                        "automated computer vision cannot verify financial authenticity or prove fraudulent intent. Human officer investigation required."
                    ),
                    "mismatch_warning": False,
                    "human_review_required": True
                }
            else:
                # Physical image attached to cyber/financial complaint (e.g. open manhole or road crater)
                return {
                    "complaint_category": complaint_category or "Cyber Crime",
                    "complaint_subcategory": complaint_subcategory or "Financial Banking Fraud (UPI/Card)",
                    "evidence_match": "MISMATCH",
                    "semantic_similarity": 0.10,
                    "match_confidence": 0.95,
                    "explanation": (
                        f"The image shows {detected_incident} ({visual_category or 'Physical Infrastructure'}), "
                        f"which does not visually support the reported financial or cyber fraud complaint ({complaint_category or 'Cyber Crime'})."
                    ),
                    "mismatch_warning": True,
                    "human_review_required": True
                }

        # 3. Direct Domain Match
        norm_complaint_cat = complaint_category.lower()
        norm_visual_cat = visual_category.lower()

        is_direct_category_match = norm_complaint_cat and norm_visual_cat and (norm_complaint_cat == norm_visual_cat)
        
        # Check text keyword overlap with visual incident
        visual_incident_words = set(detected_incident.lower().replace('/', ' ').split())
        has_text_incident_overlap = any(w in combined_text for w in visual_incident_words if len(w) > 3 and w not in ["with", "from", "road", "public", "water"])

        if is_direct_category_match or has_text_incident_overlap:
            sim_score = self.calculate_semantic_similarity(combined_text, detected_incident, visual_category, visual_subcategory, "MATCH")
            return {
                "complaint_category": complaint_category or visual_category,
                "complaint_subcategory": complaint_subcategory or visual_subcategory,
                "evidence_match": "MATCH",
                "semantic_similarity": sim_score,
                "match_confidence": visual_confidence,
                "explanation": (
                    f"Visual evidence directly corroborates the reported {complaint_category or visual_category} "
                    f"grievance ({detected_incident})."
                ),
                "mismatch_warning": False,
                "human_review_required": visual_severity == "CRITICAL"
            }

        # 4. Cross-Corridor Partial Match (e.g. waterlogging on road corridor)
        allowed_related = CROSS_CORRIDOR_MAP.get(complaint_category, set())
        if visual_category in allowed_related:
            sim_score = self.calculate_semantic_similarity(combined_text, detected_incident, visual_category, visual_subcategory, "PARTIAL_MATCH")
            return {
                "complaint_category": complaint_category,
                "complaint_subcategory": complaint_subcategory,
                "evidence_match": "PARTIAL_MATCH",
                "semantic_similarity": sim_score,
                "match_confidence": visual_confidence,
                "explanation": (
                    f"The image indicates {detected_incident} ({visual_category}), which partially supports the reported "
                    f"{complaint_category} corridor conditions under concurrent municipal jurisdiction."
                ),
                "mismatch_warning": False,
                "human_review_required": True
            }

        # 5. Distinct Civic Mismatch (e.g. Solid Waste vs Pipe Burst)
        if visual_category and complaint_category and norm_complaint_cat != norm_visual_cat:
            sim_score = self.calculate_semantic_similarity(combined_text, detected_incident, visual_category, visual_subcategory, "MISMATCH")
            return {
                "complaint_category": complaint_category,
                "complaint_subcategory": complaint_subcategory,
                "evidence_match": "MISMATCH",
                "semantic_similarity": sim_score,
                "match_confidence": 0.92,
                "explanation": (
                    f"The uploaded image shows {detected_incident} ({visual_category}), which appears unrelated to the reported "
                    f"{complaint_category} ({complaint_subcategory or 'Grievance'}) incident."
                ),
                "mismatch_warning": True,
                "human_review_required": True
            }

        # Fallback / Ambiguous
        return {
            "complaint_category": complaint_category or "Unspecified",
            "complaint_subcategory": complaint_subcategory or "General",
            "evidence_match": "INSUFFICIENT_EVIDENCE",
            "semantic_similarity": 0.20,
            "match_confidence": None,
            "explanation": "Image evidence could not be definitively matched to reported complaint context.",
            "mismatch_warning": False,
            "human_review_required": True
        }

evidence_matcher = EvidenceMatcher()
