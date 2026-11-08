"""
CivicPulse AI — Master Structured Vision Engine (Stage A + Stage B)
Integrates:
- Operation A: Pure Image Analysis (VLM Engine with Gemini Vision)
- Operation B: Complaint Context Assessment (Decoupled Cross-Modal Comparison)
- Stage C: Perceptual Duplicate & Spam Integrity (SpamFraudDetector)

Strictly English-only.
Calibrated confidence scores, decoupled visual severity from complaint priority,
and transparent, non-accusatory evidence comparison.
"""

import io
import os
import uuid
import base64
import requests
from PIL import Image
from typing import Dict, Any, Optional, Tuple, List

from vision.src.quality.image_quality_assessor import image_quality_assessor
from vision.src.detection.civic_detector import civic_detector
from vision.src.matching.evidence_matcher import evidence_matcher
from vision.src.matching.spam_fraud_detector import spam_fraud_detector
from vision.src.vlm.vlm_engine import vlm_engine, ImageAnalysisResult, ContextAssessmentResult

class StructuredVisionEngine:
    def __init__(self):
        self.model_name = "CivicPulse-Gemini-Vision-v3.0"
        self.model_version = "3.0.0"

    def _decode_image(
        self,
        image_bytes: Optional[bytes] = None,
        image_base64: Optional[str] = None,
        image_url: Optional[str] = None
    ) -> Tuple[Optional[Image.Image], Optional[str]]:
        """Safely decodes image from bytes, base64 data URL, or remote/local URL."""
        if image_bytes:
            try:
                img = Image.open(io.BytesIO(image_bytes))
                return img, None
            except Exception as e:
                return None, f"Failed to parse image bytes: {str(e)}"

        if image_base64:
            try:
                if "," in image_base64:
                    image_base64 = image_base64.split(",", 1)[1]
                decoded_bytes = base64.b64decode(image_base64)
                img = Image.open(io.BytesIO(decoded_bytes))
                return img, None
            except Exception as e:
                return None, f"Failed to decode base64 image data: {str(e)}"

        if image_url:
            try:
                # 1. Local relative URL check (e.g., /uploads/filename.jpg)
                if image_url.startswith('/uploads/'):
                    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend"))
                    local_path = os.path.join(backend_dir, image_url.lstrip('/'))
                    if os.path.exists(local_path):
                        return Image.open(local_path), None

                # 2. Local absolute path or workspace path
                if os.path.isabs(image_url) and os.path.exists(image_url):
                    return Image.open(image_url), None

                # Workspace relative path
                if os.path.exists(image_url):
                    return Image.open(os.path.abspath(image_url)), None

                # 3. Remote HTTP/HTTPS URL
                if image_url.startswith('http://') or image_url.startswith('https://'):
                    resp = requests.get(image_url, timeout=12)
                    if resp.status_code == 200:
                        return Image.open(io.BytesIO(resp.content)), None
                    else:
                        return None, f"HTTP {resp.status_code} fetching remote image from {image_url}"

                return None, f"Invalid image reference or inaccessible path: {image_url}"
            except Exception as e:
                return None, f"Network error retrieving image: {str(e)}"

        return None, "No image payload provided (image_bytes, image_base64, or image_url required)."

    def analyze_evidence(
        self,
        image_bytes: Optional[bytes] = None,
        image_base64: Optional[str] = None,
        image_url: Optional[str] = None,
        text_category: str = "",
        text_subcategory: str = "",
        description: str = "",
        title: str = "",
        image_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the redesigned visual evidence analysis pipeline:
        Stage 1: Validation & Decoding.
        Stage 2 & 3: Operation A — Pure Image Analysis (VLM Engine).
        Stage 4: Object Localization & Normalized Bounding Boxes.
        Stage 5: Operation B — Decoupled Complaint Context Assessment.
        Stage 6: Perceptual Integrity & Spam Evaluation.
        """
        analysis_id = f"ANL-{uuid.uuid4().hex[:12].upper()}"
        img_id = image_id or f"IMG-{uuid.uuid4().hex[:8].upper()}"

        # 0. Check if image payload was provided
        if not image_bytes and not image_base64 and not image_url:
            return {
                "analysis_id": analysis_id,
                "image_id": img_id,
                "scene_analysis": {
                    "scene_description": "No photographic evidence submitted for analysis.",
                    "scene_type": "Pending Submission",
                    "confidence": None
                },
                "visible_objects": [],
                "visual_findings": [
                    {"observation": "No photographic attachment provided.", "evidence_type": "direct_visual_observation", "confidence": None}
                ],
                "possible_interpretations": [],
                "unconfirmed_claims": [],
                "image_quality": {
                    "rating": "UNKNOWN",
                    "sharpness": "UNKNOWN",
                    "lighting": "UNKNOWN",
                    "visibility": "UNKNOWN",
                    "occlusion": "UNKNOWN",
                    "explanation": "No image payload provided."
                },
                "category_prediction": {
                    "department": "UNKNOWN",
                    "category": "UNKNOWN",
                    "subcategory": "Pending Submission",
                    "confidence": None,
                    "alternatives": [],
                    "requires_complaint_context": True
                },
                "visual_severity": {
                    "level": "UNKNOWN",
                    "damage_score": None,
                    "explanation": "No photographic payload available for severity evaluation."
                },
                "limitations": ["No photographic evidence attached to grievance."],
                "review_status": "NEEDS_HUMAN_REVIEW",
                "complaint_context_assessment": {
                    "complaint_claim": f"{text_category or 'Grievance'} — {text_subcategory or 'General'}",
                    "visual_evidence_summary": "No photographic evidence provided.",
                    "context_assessment": "Photographic verification pending citizen upload.",
                    "consistency_level": "INCONCLUSIVE",
                    "possible_inconsistencies": [],
                    "additional_information_needed": ["Photographic evidence of reported issue."],
                    "review_recommendation": "Field officer verification required."
                },
                "yolo_configured": vlm_engine.yolo_configured,
                # Legacy fields for backward compatibility:
                "detected_incident": "PENDING_ANALYSIS",
                "visible_object": "None",
                "predicted_category": text_category or "Pending",
                "predicted_subcategory": text_subcategory or "Pending",
                "detected_objects": [],
                "visible_damage_level": "UNKNOWN",
                "visual_severity_level": "UNKNOWN",
                "damage_severity_score": None,
                "image_quality_rating": "UNKNOWN",
                "model_confidence": None,
                "confidence": None,
                "evidence_consistency": "PENDING_ANALYSIS",
                "evidence_match": "PENDING_ANALYSIS",
                "consistency_badge": "PENDING",
                "consistency_details": "Photographic evidence pending submission.",
                "explanation": "No photographic evidence submitted.",
                "mismatch_warning": False,
                "evidence_description": "No photographic evidence submitted for analysis.",
                "recommended_human_review": False,
                "analysis_status": "PENDING",
                "model_name": self.model_name,
                "model_version": self.model_version
            }

        img, decode_err = self._decode_image(
            image_bytes=image_bytes,
            image_base64=image_base64,
            image_url=image_url
        )

        if img is None:
            return {
                "analysis_id": analysis_id,
                "image_id": img_id,
                "scene_analysis": {
                    "scene_description": f"Image processing failed: {decode_err}",
                    "scene_type": "Corrupted / Inaccessible File",
                    "confidence": 0.0
                },
                "visible_objects": [],
                "visual_findings": [
                    {"observation": f"Could not decode image: {decode_err}", "evidence_type": "direct_visual_observation", "confidence": 0.0}
                ],
                "possible_interpretations": [],
                "unconfirmed_claims": [],
                "image_quality": {
                    "rating": "POOR",
                    "sharpness": "LOW",
                    "lighting": "UNKNOWN",
                    "visibility": "POOR",
                    "occlusion": "HIGH",
                    "explanation": f"Image decoding error: {decode_err}"
                },
                "category_prediction": {
                    "department": "UNKNOWN",
                    "category": "UNKNOWN",
                    "subcategory": "Decoding Failure",
                    "confidence": None,
                    "alternatives": [],
                    "requires_complaint_context": True
                },
                "visual_severity": {
                    "level": "UNKNOWN",
                    "damage_score": None,
                    "explanation": "Image decoding failure prevents optical severity assessment."
                },
                "limitations": ["Image payload is corrupt or inaccessible."],
                "review_status": "INSUFFICIENT_EVIDENCE",
                "complaint_context_assessment": {
                    "complaint_claim": f"{text_category or 'Grievance'} — {text_subcategory or 'General'}",
                    "visual_evidence_summary": "Image decoding failure.",
                    "context_assessment": "Could not access photographic evidence payload. Re-upload or officer inspection required.",
                    "consistency_level": "INCONCLUSIVE",
                    "possible_inconsistencies": [],
                    "additional_information_needed": ["Valid image attachment."],
                    "review_recommendation": "Citizen should re-upload or officer must conduct site inspection."
                },
                "yolo_configured": vlm_engine.yolo_configured,
                # Legacy fields:
                "detected_incident": "INSUFFICIENT_VISUAL_EVIDENCE",
                "visible_object": "Corrupted or Inaccessible File",
                "predicted_category": "INSUFFICIENT_VISUAL_EVIDENCE",
                "predicted_subcategory": "Image Retrieval Failure",
                "detected_objects": [],
                "visible_damage_level": "UNKNOWN",
                "visual_severity_level": "UNKNOWN",
                "damage_severity_score": None,
                "model_confidence": None,
                "confidence": None,
                "evidence_consistency": "INSUFFICIENT_EVIDENCE",
                "evidence_match": "INSUFFICIENT_EVIDENCE",
                "consistency_badge": "INSUFFICIENT EVIDENCE",
                "consistency_details": f"Image processing failed: {decode_err}",
                "explanation": f"Image retrieval failure: {decode_err}",
                "mismatch_warning": False,
                "evidence_description": f"Image retrieval failure: {decode_err}",
                "recommended_human_review": True,
                "analysis_status": "FAILED",
                "model_name": self.model_name,
                "model_version": self.model_version
            }

        # Step 1: Operation A — Pure Image Analysis (VLM Engine)
        image_analysis: ImageAnalysisResult = vlm_engine.analyze_image(img)

        # Step 2: Operation B — Decoupled Complaint Context Assessment
        context_assessment: ContextAssessmentResult = vlm_engine.assess_complaint_context(
            image_analysis=image_analysis,
            complaint_text=f"{title} {description}".strip(),
            complaint_category=text_category,
            complaint_subcategory=text_subcategory
        )

        # Step 3: Perceptual Duplicate Hash & Spam Evaluation
        complaint_context = {
            "category": text_category,
            "subcategory": text_subcategory,
            "title": title,
            "description": description
        }
        
        stage_a_dict = {
            "detected_incident": image_analysis.category_prediction.category,
            "visible_object": image_analysis.scene_analysis.scene_description,
            "visual_category": image_analysis.category_prediction.department,
            "visual_subcategory": image_analysis.category_prediction.subcategory,
            "visual_severity": image_analysis.visual_severity.level,
            "image_quality": image_analysis.image_quality.rating,
            "is_digital_document": "document" in image_analysis.scene_analysis.scene_type.lower() or "screenshot" in image_analysis.scene_analysis.scene_description.lower(),
            "confidence": image_analysis.category_prediction.confidence
        }

        spam_res = spam_fraud_detector.evaluate(
            img=img,
            image_findings=stage_a_dict,
            complaint_context=complaint_context,
            evidence_match="MATCH" if context_assessment.consistency_level == "ALIGNED" else ("MISMATCH" if context_assessment.consistency_level == "DIVERGENT" else "PARTIAL_MATCH"),
            vlm_fraud_data=None,
            complaint_id=analysis_id
        )

        # Step 4: Format Detected Objects for Standardized Bounding Box Coordinates
        standardized_objects = []
        for obj in image_analysis.visible_objects:
            obj_dict = obj.model_dump()
            box = obj.box_pct
            box_2d = None
            legacy_box_pct = None
            if box and len(box) == 4:
                xmin, ymin, xmax, ymax = box
                box_2d = [int(round(ymin * 1000)), int(round(xmin * 1000)), int(round(ymax * 1000)), int(round(xmax * 1000))]
                legacy_box_pct = {
                    "top": round(ymin * 100, 1),
                    "left": round(xmin * 100, 1),
                    "width": round((xmax - xmin) * 100, 1),
                    "height": round((ymax - ymin) * 100, 1)
                }
            standardized_objects.append({
                "label": obj.label,
                "display_name": obj.label,
                "confidence": obj.confidence,
                "box_pct": box,
                "box_2d": box_2d,
                "legacy_box_pct": legacy_box_pct
            })

        # Assemble factual findings strings
        factual_finding_strings = [
            f.observation for f in image_analysis.visual_findings 
            if f.evidence_type == "direct_visual_observation"
        ]
        if not factual_finding_strings:
            factual_finding_strings = [f.observation for f in image_analysis.visual_findings]

        pred_dept = image_analysis.category_prediction.department
        pred_cat = image_analysis.category_prediction.category
        pred_subcat = image_analysis.category_prediction.subcategory

        # Format Section 6 Structured Incident & Object Detections
        object_detections_list = []
        for obj in image_analysis.visible_objects:
            b_pct = obj.box_pct
            bbox_dict = None
            if b_pct and len(b_pct) == 4:
                bbox_dict = {
                    "x_min": b_pct[0],
                    "y_min": b_pct[1],
                    "x_max": b_pct[2],
                    "y_max": b_pct[3]
                }
            object_detections_list.append({
                "label": obj.label,
                "object_type": obj.object_type,
                "bbox": bbox_dict,
                "box_pct": b_pct,
                "confidence": obj.confidence
            })

        return {
            "analysis_id": analysis_id,
            "image_id": img_id,
            "analysis_status": "SUCCESS" if pred_dept != "UNKNOWN" else "UNCERTAIN",
            "model": image_analysis.model,
            # Section 6 Unified Schema
            "image_identity": {
                "image_hash": spam_res["image_hash"],
                "mime_type": "image/jpeg"
            },
            "scene": {
                "description": image_analysis.scene_analysis.scene_description,
                "scene_type": image_analysis.scene_analysis.scene_type,
                "visible_objects": image_analysis.scene_analysis.visible_objects or [o.label for o in image_analysis.visible_objects]
            },
            "incident": {
                "detected_incident": pred_cat,
                "is_civic_issue": pred_dept != "UNKNOWN",
                "visual_category": pred_dept,
                "visual_subcategory": pred_subcat,
                "department_id": image_analysis.category_prediction.department_id,
                "category_confidence": image_analysis.category_prediction.confidence or 0.90,
                "classification_status": image_analysis.category_prediction.classification_status,
                "alternative_categories": [a.model_dump() for a in image_analysis.category_prediction.alternatives]
            },
            "object_detections": object_detections_list,
            "evidence": {
                "direct_observations": [f.observation for f in image_analysis.visual_findings if getattr(f, "evidence_type", None) == "direct_visual_observation"] or factual_finding_strings[:5],
                "possible_interpretations": [p.interpretation for p in image_analysis.possible_interpretations],
                "limitations": image_analysis.limitations
            },
            "visual_severity": {
                "level": image_analysis.visual_severity.level,
                "confidence": image_analysis.visual_severity.confidence or 0.85,
                "reason": image_analysis.visual_severity.reason or image_analysis.visual_severity.explanation
            },
            "image_quality": {
                "level": image_analysis.image_quality.level,
                "rating": image_analysis.image_quality.level,
                "blur": image_analysis.image_quality.blur,
                "lighting": image_analysis.image_quality.lighting,
                "occlusion": image_analysis.image_quality.occlusion
            },
            "review": {
                "human_review_required": image_analysis.review_status != "AUTO_CLEARED",
                "review_reasons": ["Field officer site verification recommended."] if image_analysis.review_status != "AUTO_CLEARED" else []
            },
            "suggested_description": image_analysis.suggested_description or f"A civic issue regarding {pred_cat} has been identified in the photographic evidence. Kindly inspect the site and arrange for necessary municipal action.",

            # Legacy & Sub-View Properties for Backward Compatibility
            "scene_analysis": image_analysis.scene_analysis.model_dump(),
            "visible_objects": standardized_objects,
            "visual_findings": [f.model_dump() for f in image_analysis.visual_findings],
            "possible_interpretations": [p.model_dump() for p in image_analysis.possible_interpretations],
            "unconfirmed_claims": [u.model_dump() for u in image_analysis.unconfirmed_claims],
            "category_prediction": image_analysis.category_prediction.model_dump(),
            "limitations": image_analysis.limitations,
            "review_status": image_analysis.review_status,
            "complaint_context_assessment": context_assessment.model_dump(),
            "yolo_configured": image_analysis.yolo_configured,
            # Structured Sub-Views for Frontend
            "image_overview": {
                "description": image_analysis.scene_analysis.scene_description,
                "likely_incident": pred_cat if pred_cat != "UNKNOWN" else image_analysis.scene_analysis.scene_description,
                "objects_identified": [o.label for o in image_analysis.visible_objects] or ["General Visual Features"],
                "model_confidence": image_analysis.category_prediction.confidence or image_analysis.scene_analysis.confidence,
                "what_cannot_be_determined": "; ".join(image_analysis.limitations[:2]) if image_analysis.limitations else "Non-visible or underground factors cannot be established."
            },
            # Backward-compatibility legacy fields
            "detected_incident": pred_cat if pred_cat != "UNKNOWN" else image_analysis.scene_analysis.scene_description,
            "visible_object": image_analysis.scene_analysis.scene_description,
            "predicted_category": pred_dept,
            "predicted_subcategory": pred_subcat,
            "detected_objects": standardized_objects,
            "visible_damage_level": image_analysis.visual_severity.level,
            "damage_severity_score": image_analysis.visual_severity.damage_score,
            "model_confidence": image_analysis.category_prediction.confidence,
            "confidence": image_analysis.category_prediction.confidence,
            "evidence_consistency": context_assessment.consistency_level,
            "evidence_match": context_assessment.consistency_level,
            "consistency_badge": context_assessment.consistency_level,
            "consistency_details": context_assessment.context_assessment,
            "explanation": context_assessment.context_assessment,
            "mismatch_warning": False, # Never scream mismatch warning
            "recommended_human_review": image_analysis.review_status != "AUTO_CLEARED",
            "clearance_tier": "AUTO_CLEARED" if image_analysis.review_status == "AUTO_CLEARED" else "STANDARD_REVIEW",
            "spam_score": spam_res["spam_score"],
            "fraud_risk_level": spam_res["fraud_risk_level"],
            "is_recycled_duplicate": spam_res["is_recycled_duplicate"],
            "image_hash": spam_res["image_hash"],
            "analysis_status": "COMPLETED",
            "model_name": self.model_name,
            "model_version": self.model_version
        }

structured_vision_engine = StructuredVisionEngine()
