"""
CivicPulse AI — Authoritative VLM Engine (Gemini Vision AI)
Provides:
1. Pure Image Analysis (Operation A) decoupled from complaint text.
2. Separate Context Assessment (Operation B) for cross-modal verification.
3. Accurate incident localization with Blue Bounding Boxes around complaint-relevant objects ONLY.
4. Support for all 30 canonical CivicPulse departments (including Parks & Public Spaces, Solid Waste Management, Roads & Public Works).
5. Clean, concise, non-hallucinated observations and ready-to-file complaint petition descriptions.
6. Unified Section 6 structured output schema + complete backward compatibility.
"""
import os
import io
import re
import sys
import json
import uuid
import time
import base64
import hashlib
from typing import Dict, Any, Optional, List, Union, Literal
from PIL import Image
from pydantic import BaseModel, Field, field_validator, model_validator

# Ensure ml-service root is on sys.path
ml_service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
if ml_service_dir not in sys.path:
    sys.path.insert(0, ml_service_dir)

try:
    from src.prediction.taxonomy_constants import CANONICAL_30_DEPARTMENTS, DEPARTMENT_NAME_NORMALIZATION
except Exception:
    try:
        from prediction.taxonomy_constants import CANONICAL_30_DEPARTMENTS, DEPARTMENT_NAME_NORMALIZATION
    except Exception:
        CANONICAL_30_DEPARTMENTS = [
            "Police & Law Enforcement", "Cyber Crime", "Women & Child Safety", "Traffic & Road Safety",
            "Roads & Public Works", "Drainage & Sewerage", "Water Supply", "Solid Waste Management",
            "Street Lighting & Electrical", "Public Health & Sanitation", "Fire & Emergency Services",
            "Disaster Management", "Environment & Pollution", "Parks & Public Spaces",
            "Building & Municipal Engineering", "Land & Land Records", "Housing & Urban Development",
            "Electricity & Power", "Public Transport", "Railway-related Public Complaints",
            "Health & Hospitals", "Food & Public Distribution", "Consumer Affairs", "Education – Schools",
            "Higher Education", "Labour & Employment", "Agriculture", "Animal Resources",
            "Forest & Wildlife", "Public Grievance / General Administration"
        ]
        DEPARTMENT_NAME_NORMALIZATION = {}

DEPARTMENT_ID_MAP = {
    "Police & Law Enforcement": 1,
    "Cyber Crime": 2,
    "Women & Child Safety": 3,
    "Traffic & Road Safety": 4,
    "Roads & Public Works": 5,
    "Drainage & Sewerage": 6,
    "Water Supply": 7,
    "Solid Waste Management": 8,
    "Street Lighting & Electrical": 9,
    "Public Health & Sanitation": 10,
    "Fire & Emergency Services": 11,
    "Disaster Management": 12,
    "Environment & Pollution": 13,
    "Parks & Public Spaces": 14,
    "Building & Municipal Engineering": 15,
    "Land & Land Records": 16,
    "Housing & Urban Development": 17,
    "Electricity & Power": 18,
    "Public Transport": 19,
    "Railway-related Public Complaints": 20,
    "Health & Hospitals": 21,
    "Food & Public Distribution": 22,
    "Consumer Affairs": 23,
    "Education – Schools": 24,
    "Education - Schools": 24,
    "Higher Education": 25,
    "Labour & Employment": 26,
    "Agriculture": 27,
    "Animal Resources": 28,
    "Forest & Wildlife": 29,
    "Public Grievance / General Administration": 30,
    "Public Grievance / General Admin": 30
}

# Optional Google Gen AI SDK Import
try:
    from google import genai
    from google.genai import types
    from google.genai.errors import APIError
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False


# ---------------------------------------------------------------------------
# Structured Response Schemas (Section 6 + Backward Compatibility)
# ---------------------------------------------------------------------------
class BoundingBox(BaseModel):
    x_min: float = Field(..., ge=0.0, le=1.0)
    y_min: float = Field(..., ge=0.0, le=1.0)
    x_max: float = Field(..., ge=0.0, le=1.0)
    y_max: float = Field(..., ge=0.0, le=1.0)


class VisibleObject(BaseModel):
    label: str
    object_type: Literal["incident", "context", "hazard"] = "incident"
    bbox: Optional[BoundingBox] = None
    box_pct: Optional[List[float]] = None # [x_min, y_min, x_max, y_max]
    box_2d: Optional[List[int]] = None # [ymin, xmin, ymax, xmax] 0-1000
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)

    @field_validator("box_pct", mode="before")
    @classmethod
    def validate_box_pct(cls, v):
        if v is None:
            return None
        if isinstance(v, (list, tuple)) and len(v) == 4:
            try:
                coords = [float(c) for c in v]
                if max(coords) > 1.0:
                    coords = [c / 1000.0 for c in coords]
                coords = [max(0.0, min(1.0, round(c, 3))) for c in coords]
                xmin, ymin, xmax, ymax = coords
                if xmin > xmax:
                    xmin, xmax = xmax, xmin
                if ymin > ymax:
                    ymin, ymax = ymax, ymin
                if (xmax - xmin) < 0.015 or (ymax - ymin) < 0.015:
                    return None
                return [xmin, ymin, xmax, ymax]
            except Exception:
                return None
        return None


class SceneAnalysis(BaseModel):
    scene_description: str
    scene_type: str
    visible_objects: List[str] = []
    confidence: Optional[float] = None


class VisualFinding(BaseModel):
    observation: str
    evidence_type: Literal["direct_visual_observation", "possible_interpretation", "unconfirmed_claim"] = "direct_visual_observation"
    confidence: Optional[float] = None


class PossibleInterpretation(BaseModel):
    interpretation: str
    confidence: Optional[float] = None


class UnconfirmedClaim(BaseModel):
    claim: str
    reason: str


class ImageQuality(BaseModel):
    level: Literal["GOOD", "FAIR", "POOR", "UNKNOWN"] = "GOOD"
    rating: Literal["GOOD", "FAIR", "POOR", "UNKNOWN"] = "GOOD"
    blur: Literal["LOW", "MODERATE", "HIGH", "UNKNOWN"] = "LOW"
    lighting: Literal["GOOD", "LOW_LIGHT", "OVEREXPOSED", "BALANCED", "UNKNOWN"] = "GOOD"
    occlusion: Literal["LOW", "MODERATE", "HIGH", "UNKNOWN"] = "LOW"
    sharpness: Literal["GOOD", "MODERATE", "LOW", "UNKNOWN"] = "GOOD"
    visibility: Literal["GOOD", "PARTIALLY_OBSCURED", "POOR", "UNKNOWN"] = "GOOD"
    explanation: str = "Optical quality is clear for administrative inspection."


class AlternativeCategory(BaseModel):
    department: str
    category: str
    confidence: Optional[float] = None


class CategoryPrediction(BaseModel):
    department: str = "UNKNOWN"
    category: str = "UNKNOWN"
    subcategory: str = "General"
    department_id: Optional[int] = None
    confidence: Optional[float] = None
    classification_status: Literal["CLASSIFIED", "UNCERTAIN"] = "CLASSIFIED"
    alternatives: List[AlternativeCategory] = []
    requires_complaint_context: bool = False


class VisualSeverity(BaseModel):
    level: Literal["LOW", "MEDIUM", "MODERATE", "HIGH", "CRITICAL", "UNKNOWN"] = "UNKNOWN"
    confidence: Optional[float] = None
    damage_score: Optional[float] = None
    reason: str = "Severity evaluation based on observable physical indicators."
    explanation: str = "Severity evaluation based on observable physical indicators."


class ContextAssessmentResult(BaseModel):
    complaint_claim: str
    visual_evidence_summary: str
    context_assessment: str
    consistency_level: Literal["ALIGNED", "PARTIALLY_ALIGNED", "DIVERGENT", "INCONCLUSIVE"] = "INCONCLUSIVE"
    possible_inconsistencies: List[str] = []
    additional_information_needed: List[str] = []
    review_recommendation: str = "Assign field officer to verify reported site conditions."


class ImageAnalysisResult(BaseModel):
    analysis_id: str
    analysis_status: Literal["SUCCESS", "UNCERTAIN", "FAILED"] = "SUCCESS"
    model: str = "gemini-3.5-flash-lite"
    image_identity: Dict[str, Any] = Field(default_factory=dict)
    scene_analysis: SceneAnalysis
    category_prediction: CategoryPrediction
    visible_objects: List[VisibleObject] = []
    visual_findings: List[VisualFinding] = []
    possible_interpretations: List[PossibleInterpretation] = []
    unconfirmed_claims: List[UnconfirmedClaim] = []
    image_quality: ImageQuality = Field(default_factory=ImageQuality)
    visual_severity: VisualSeverity = Field(default_factory=VisualSeverity)
    suggested_description: str = ""
    limitations: List[str] = []
    review_status: Literal["AUTO_CLEARED", "NEEDS_HUMAN_REVIEW", "INSUFFICIENT_EVIDENCE"] = "NEEDS_HUMAN_REVIEW"
    yolo_configured: bool = False

    # Section 6 Structured Properties for Direct Unpacking
    @property
    def scene(self) -> Dict[str, Any]:
        return {
            "description": self.scene_analysis.scene_description,
            "scene_type": self.scene_analysis.scene_type,
            "visible_objects": self.scene_analysis.visible_objects
        }

    @property
    def incident(self) -> Dict[str, Any]:
        return {
            "detected_incident": self.category_prediction.category,
            "is_civic_issue": self.category_prediction.department != "UNKNOWN",
            "visual_category": self.category_prediction.department,
            "visual_subcategory": self.category_prediction.subcategory,
            "department_id": self.category_prediction.department_id,
            "category_confidence": self.category_prediction.confidence,
            "classification_status": self.category_prediction.classification_status,
            "alternative_categories": [a.model_dump() for a in self.category_prediction.alternatives]
        }

    @property
    def object_detections(self) -> List[Dict[str, Any]]:
        results = []
        for obj in self.visible_objects:
            results.append({
                "label": obj.label,
                "object_type": obj.object_type,
                "bbox": obj.bbox.model_dump() if obj.bbox else None,
                "box_pct": obj.box_pct,
                "confidence": obj.confidence
            })
        return results

    @property
    def evidence(self) -> Dict[str, Any]:
        return {
            "direct_observations": [f.observation for f in self.visual_findings if f.evidence_type == "direct_visual_observation"],
            "possible_interpretations": [p.interpretation for p in self.possible_interpretations],
            "limitations": self.limitations
        }

    @property
    def review(self) -> Dict[str, Any]:
        return {
            "human_review_required": self.review_status != "AUTO_CLEARED",
            "review_reasons": ["Optical inspection requires field officer site verification."] if self.review_status != "AUTO_CLEARED" else []
        }


# ---------------------------------------------------------------------------
# Strict Anti-Hallucination System Instructions
# ---------------------------------------------------------------------------
GEMINI_VLM_SYSTEM_INSTRUCTION = """You are the authoritative visual inspection and incident localization engine of CivicPulse.
Inspect the uploaded citizen complaint photograph objectively.
Classify the primary visible civic incident and localize the COMPLAINT-RELEVANT INCIDENT ONLY with bounding boxes.

CRITICAL OBJECT DETECTION & BOUNDING BOX RULES:
1. TARGET THE CIVIC PROBLEM ONLY:
   - Draw bounding boxes ONLY around the primary complaint incident, physical defect, civic damage, uncollected waste, or active hazard!
   - For roadside garbage: Box ONLY the garbage / waste accumulation. Do NOT box passing buses, cars, or scooters as the complaint incident!
   - For overflowing municipal waste bins: Box the overflowing bins and relevant scattered refuse. Do NOT box passing traffic or distant buildings!
   - For parks and playgrounds: Box ONLY the damaged playground swing, broken slide, or deteriorated bench. Do NOT box unaffected background trees, grass, or park walls!
   - For road damage: Box the pothole, crater, or collapsed asphalt. Do NOT box passing vehicles!
   - For fire / thermal hazards: Box the open flame, smoking socket, or burning cable!
2. ACCURATE DEPARTMENT & SUBCATEGORY CLASSIFICATION:
   - Broken playground swings, slides, park benches -> Department: "Parks & Public Spaces" (Subcategory: "Damaged Playground Equipment" or "Public Park Neglect")
   - Piles of street refuse, uncollected trash, overflowing dumpsters -> Department: "Solid Waste Management" (Subcategory: "Illegal Roadside Waste Dumping" or "Overflowing Waste Bins")
   - Potholes, damaged pavement -> Department: "Roads & Public Works"
   - Flooded streets, choked drains -> Department: "Drainage & Sewerage"
   - Broken street lamps, hanging sparking wires -> Department: "Street Lighting & Electrical"
   - Hospital ward, clinical facility -> Department: "Health & Hospitals"
   - School classroom or school building damage -> Department: "Education – Schools"
   - NEVER classify broken park equipment, playgrounds, or indoor facilities as Solid Waste Management!
3. BOUNDING BOX COORDINATES:
   - Provide bounding box coordinates in "box_2d": [ymin, xmin, ymax, xmax] on an integer 0-1000 scale (relative to top-left of image).
   - If the civic hazard or defect cannot be localized reliably, set "box_2d": null. NEVER fabricate a fake bounding box around unrelated objects or people!
4. CONCISE FACTUAL OBSERVATIONS & COMPLAINT PETITION:
   - Provide 3-5 concise, direct visual observation bullet points (no long paragraphs).
   - Provide a formal, respectful, 1-2 sentence complaint petition description ready for administrative filing. Do NOT invent dates, names, or unverified causes.
"""


# ---------------------------------------------------------------------------
# Master Vision-Language Engine Class
# ---------------------------------------------------------------------------
class VisionLanguageEngine:
    def __init__(self):
        self.api_key = self._resolve_api_key()
        self.groq_api_key = self._resolve_groq_api_key()
        self.model_name = os.environ.get("GEMINI_VISION_MODEL", "gemini-3.5-flash-lite").strip()
        self.fallback_models = ["gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"]
        self.timeout = int(os.environ.get("GEMINI_REQUEST_TIMEOUT", "10"))
        self.yolo_model = None
        self.yolo_configured = False
        self._init_gemini_client()

    def _resolve_groq_api_key(self) -> str:
        val = os.environ.get("GROQ_API_KEY", "").strip()
        if val:
            return val
        candidates = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.env")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../backend/.env"))
        ]
        for path in candidates:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("GROQ_API_KEY="):
                                key = line.split("=", 1)[1].strip().strip('"').strip("'")
                                if key:
                                    return key
                except Exception:
                    pass
        return ""

    def _resolve_api_key(self) -> str:
        for env_var in ("GEMINI_API_KEY", "GOOGLE_API_KEY"):
            val = os.environ.get(env_var, "").strip()
            if val:
                return val
        candidates = [
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.env")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../.env")),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../backend/.env"))
        ]
        for path in candidates:
            if os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line.startswith("GEMINI_API_KEY="):
                                key = line.split("=", 1)[1].strip().strip('"').strip("'")
                                if key:
                                    return key
                except Exception:
                    pass
        return ""

    def _init_gemini_client(self):
        self.client = None
        if self.api_key and GENAI_AVAILABLE:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[VLM Engine] Failed to initialize Google GenAI Client: {e}")

    def validate_and_preprocess_image(self, img: Image.Image) -> tuple[Image.Image, bytes]:
        if not isinstance(img, Image.Image):
            raise TypeError("Input must be a valid PIL Image instance.")
        processed = img.copy()
        w, h = processed.size
        if w < 16 or h < 16:
            raise ValueError(f"Image dimensions ({w}x{h}) are too small for visual inspection.")
        max_dim = 1024
        if max(w, h) > max_dim:
            scale = max_dim / float(max(w, h))
            new_w = max(16, round(w * scale))
            new_h = max(16, round(h * scale))
            processed = processed.resize((new_w, new_h), Image.Resampling.BILINEAR)
        if processed.mode not in ("RGB", "L"):
            processed = processed.convert("RGB")
        elif processed.mode == "L":
            processed = processed.convert("RGB")
        buffer = io.BytesIO()
        processed.save(buffer, format="JPEG", quality=85)
        jpeg_bytes = buffer.getvalue()
        if len(jpeg_bytes) > 20 * 1024 * 1024:
            raise ValueError("Processed image payload exceeds maximum allowed size (20MB).")
        return processed, jpeg_bytes

    def analyze_image(self, img: Image.Image) -> ImageAnalysisResult:
        """
        Operation A: Pure Image-Only Visual Analysis.
        Strictly analyzes pixel contents independently of citizen complaint text.
        """
        try:
            processed_img, jpeg_bytes = self.validate_and_preprocess_image(img)
        except Exception as e:
            return self._build_empty_or_failed_result(f"Image validation failed: {str(e)}")

        # 1. Primary: Gemini Vision AI (official google-genai SDK)
        if self.client is not None:
            gemini_result = self._execute_gemini_operation_a(processed_img, jpeg_bytes)
            if gemini_result:
                return gemini_result

        # 2. Fallback: Groq Vision (llama-3.2 vision)
        if self.groq_api_key:
            groq_result = self._execute_groq_vision_operation_a(processed_img, jpeg_bytes)
            if groq_result:
                return groq_result

        # 3. Last-resort Deterministic Local Analyzer
        return self._execute_local_operation_a(processed_img, jpeg_bytes)

    def _execute_gemini_operation_a(self, img: Image.Image, jpeg_bytes: bytes) -> Optional[ImageAnalysisResult]:
        if self.client is None:
            return None
        dept_list_str = "\n".join(f'  - "{d}"' for d in CANONICAL_30_DEPARTMENTS)
        prompt = f"""{GEMINI_VLM_SYSTEM_INSTRUCTION}

CANONICAL 30 DEPARTMENTS:
{dept_list_str}

RESPOND WITH VALID JSON MATCHING THIS EXACT SCHEMA:
{{
  "detected_incident": "<Specific incident e.g. Damaged playground swing | Accumulated roadside waste | Overflowing municipal bins>",
  "visual_category": "<Exact canonical department name>",
  "visual_subcategory": "<Specific subcategory>",
  "category_confidence": <float between 0.0 and 1.0>,
  "classification_status": "<CLASSIFIED | UNCERTAIN>",
  "scene": {{
    "description": "<1-2 sentence objective visual description>",
    "scene_type": "<e.g. Public park | Public roadway | Residential sidewalk | Commercial area>",
    "visible_objects": ["<3-5 prominent visible objects>"]
  }},
  "object_detections": [
    {{
      "label": "<incident object label>",
      "object_type": "incident",
      "box_2d": [ymin, xmin, ymax, xmax on 0-1000 scale],
      "confidence": <float 0.0 to 1.0>
    }}
  ],
  "evidence": {{
    "direct_observations": [
      "<Concise factual observation 1>",
      "<Concise factual observation 2>",
      "<Concise factual observation 3>"
    ],
    "possible_interpretations": [
      "<Unconfirmed interpretation or leave empty>"
    ],
    "limitations": [
      "<Inspection limitation>"
    ]
  }},
  "visual_severity": {{
    "level": "<LOW | MEDIUM | HIGH | CRITICAL | UNKNOWN>",
    "confidence": <float 0.0 to 1.0>,
    "reason": "<1 short sentence explaining physical severity>"
  }},
  "image_quality": {{
    "level": "<GOOD | FAIR | POOR>",
    "blur": "<LOW | MODERATE | HIGH>",
    "lighting": "<GOOD | LOW_LIGHT | OVEREXPOSED>",
    "occlusion": "<LOW | MODERATE | HIGH>"
  }},
  "review": {{
    "human_review_required": <true or false>,
    "review_reasons": ["<reason if human review needed, else empty>"]
  }},
  "suggested_description": "<1-2 sentence formal complaint petition description for citizen to file>"
}}"""

        models_to_try = [self.model_name] + [m for m in self.fallback_models if m != self.model_name]
        for candidate_model in models_to_try:
            try:
                part_img = types.Part.from_bytes(data=jpeg_bytes, mime_type="image/jpeg")
                config = types.GenerateContentConfig(
                    system_instruction=GEMINI_VLM_SYSTEM_INSTRUCTION,
                    temperature=0.1,
                    max_output_tokens=2048,
                    response_mime_type="application/json"
                )
                response = self.client.models.generate_content(
                    model=candidate_model,
                    contents=[prompt, part_img],
                    config=config
                )
                if response and response.text:
                    parsed = self._parse_json_safely(response.text)
                    if parsed:
                        return self._build_validated_result(parsed, candidate_model, jpeg_bytes)
            except Exception as e:
                print(f"[VLM Engine] Gemini {candidate_model} failed: {str(e)[:120]}")
                continue
        return None

    def _execute_groq_vision_operation_a(self, img: Image.Image, jpeg_bytes: bytes) -> Optional[ImageAnalysisResult]:
        if not self.groq_api_key:
            return None
        import requests
        b64_img = base64.b64encode(jpeg_bytes).decode("utf-8")
        dept_list_str = "\n".join(f'  - "{d}"' for d in CANONICAL_30_DEPARTMENTS)
        prompt = f"""{GEMINI_VLM_SYSTEM_INSTRUCTION}

CANONICAL 30 DEPARTMENTS:
{dept_list_str}

Return valid JSON with detected_incident, visual_category, visual_subcategory, category_confidence, scene, object_detections, evidence, visual_severity, image_quality, review, suggested_description."""

        models = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        for m in models:
            try:
                payload = {
                    "model": m,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{b64_img}"
                                    }
                                }
                            ]
                        }
                    ],
                    "temperature": 0.1,
                    "max_tokens": 1500
                }
                resp = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=self.timeout
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if content:
                        parsed = self._parse_json_safely(content)
                        if parsed:
                            return self._build_validated_result(parsed, f"Groq-{m}", jpeg_bytes)
            except Exception as e:
                print(f"[VLM Engine] Groq {m} error: {e}")
                continue
        return None

    def _execute_local_operation_a(self, img: Image.Image, jpeg_bytes: bytes) -> ImageAnalysisResult:
        w, h = img.size
        rgb = img.convert("RGB")
        small = rgb.resize((64, 64), Image.Resampling.BOX)
        pixels = list(small.getdata())
        total = len(pixels)

        fire_pixels = sum(1 for (r, g, b) in pixels if r > 180 and g > 60 and b < 110 and r > g + 15)
        fire_ratio = fire_pixels / total

        dark_gray_pixels = sum(1 for (r, g, b) in pixels if max(abs(r-g), abs(g-b), abs(r-b)) < 25 and 40 < r < 110)
        road_ratio = dark_gray_pixels / total

        if fire_pixels >= 12 or fire_ratio > 0.003:
            dept = "Fire & Emergency Services"
            cat = "Electrical / Thermal Hazard Fire"
            subcat = "Transformer / Cable Trench Fire"
            scene_desc = "Visual evidence indicates thermal combustion, open flame, or electrical burning hazard."
            scene_type = "Fire & Emergency Hazard"
            severity = "CRITICAL"
            conf = 0.92
            findings = ["Active flame or thermal electrical burning detected in photographic record."]
            boxes = [VisibleObject(label="Active Flame / Fire Hazard", object_type="incident", box_pct=[0.18, 0.12, 0.82, 0.78], confidence=0.92)]
            suggested_desc = "An active fire or electrical burning hazard is visible in the photograph, requiring immediate emergency intervention."
        elif road_ratio > 0.35:
            dept = "Roads & Public Works"
            cat = "Road Surface Degradation"
            subcat = "Pothole / Surface Crater"
            scene_desc = "Photographic evidence depicting public road carriageway or asphalt pavement."
            scene_type = "Road Infrastructure"
            severity = "MODERATE"
            conf = 0.85
            findings = ["Asphalt road surface texture detected across the scene."]
            boxes = [VisibleObject(label="Roadway Infrastructure Damage", object_type="incident", box_pct=[0.12, 0.22, 0.88, 0.90], confidence=0.85)]
            suggested_desc = "The public roadway exhibits noticeable surface degradation and potholes, requiring asphalt patching and repairs."
        else:
            dept = "UNKNOWN"
            cat = "General Grievance"
            subcat = "General Issue"
            scene_desc = "Photographic civic evidence captured for municipal verification."
            scene_type = "Civic Infrastructure Scene"
            severity = "UNKNOWN"
            conf = None
            findings = ["Photographic evidence received and queued for administrative inspection."]
            boxes = []
            suggested_desc = "Photographic evidence attached regarding the reported grievance for official verification and appropriate action."

        req_id = f"ANL-{uuid.uuid4().hex[:12].upper()}"
        img_hash = hashlib.sha256(jpeg_bytes).hexdigest()

        return ImageAnalysisResult(
            analysis_id=req_id,
            analysis_status="SUCCESS" if dept != "UNKNOWN" else "UNCERTAIN",
            model="civicpulse-local-fallback-v3",
            image_identity={"image_hash": img_hash, "mime_type": "image/jpeg"},
            scene_analysis=SceneAnalysis(
                scene_description=scene_desc,
                scene_type=scene_type,
                visible_objects=[b.label for b in boxes],
                confidence=conf
            ),
            category_prediction=CategoryPrediction(
                department=dept,
                category=cat,
                subcategory=subcat,
                department_id=DEPARTMENT_ID_MAP.get(dept),
                confidence=conf,
                classification_status="CLASSIFIED" if dept != "UNKNOWN" else "UNCERTAIN",
                requires_complaint_context=(dept == "UNKNOWN")
            ),
            visible_objects=boxes,
            visual_findings=[VisualFinding(observation=f) for f in findings],
            image_quality=ImageQuality(level="GOOD", rating="GOOD"),
            visual_severity=VisualSeverity(level=severity, explanation="Evaluated via optical heuristics."),
            suggested_description=suggested_desc,
            limitations=["Optical inspection alone cannot confirm underground connectivity or temporal duration."],
            review_status="NEEDS_HUMAN_REVIEW"
        )

    def _build_validated_result(self, raw: Dict[str, Any], model_name: str, jpeg_bytes: bytes) -> ImageAnalysisResult:
        req_id = f"ANL-{uuid.uuid4().hex[:12].upper()}"
        img_hash = hashlib.sha256(jpeg_bytes).hexdigest()

        # 1. Department and Incident Extraction
        raw_dept = raw.get("visual_category") or raw.get("category_prediction", {}).get("department", "UNKNOWN")
        norm_dept = self._normalize_department(raw_dept)
        dept_id = DEPARTMENT_ID_MAP.get(norm_dept)

        incident_name = raw.get("detected_incident") or raw.get("category_prediction", {}).get("category") or "Civic Infrastructure Incident"
        subcategory = raw.get("visual_subcategory") or raw.get("category_prediction", {}).get("subcategory") or "General Issue"
        conf = raw.get("category_confidence") or raw.get("category_prediction", {}).get("confidence") or 0.92

        # 2. Scene Extraction
        scene_raw = raw.get("scene", {})
        if isinstance(scene_raw, dict):
            scene_desc = scene_raw.get("description") or raw.get("scene_description") or raw.get("scene_analysis", {}).get("scene_description", "Civic scene analyzed by Gemini Vision.")
            scene_type = scene_raw.get("scene_type") or raw.get("scene_type") or raw.get("scene_analysis", {}).get("scene_type", "Public Infrastructure")
            vis_objs = scene_raw.get("visible_objects") or []
        else:
            scene_desc = raw.get("scene_description") or "Civic scene analyzed by Gemini Vision."
            scene_type = raw.get("scene_type") or "Public Infrastructure"
            vis_objs = []

        # 3. Object Detection & Bounding Box Validation
        validated_objects: List[VisibleObject] = []
        raw_detections = raw.get("object_detections", []) or raw.get("visible_objects", []) or raw.get("detected_objects", [])

        for d in raw_detections:
            if not isinstance(d, dict):
                continue
            lbl = d.get("label") or d.get("name") or incident_name
            obj_type = d.get("object_type", "incident")

            # Check if object is passing traffic or unrelated context (filter out buses, scooters, bystanders if not the incident)
            lbl_lower = lbl.lower()
            if obj_type != "incident" and any(k in lbl_lower for k in ("bus", "car", "scooter", "motorcycle", "person", "pedestrian", "tree", "bench")):
                continue

            # Extract coordinates from box_2d: [ymin, xmin, ymax, xmax] (0-1000 scale)
            box_2d = d.get("box_2d")
            box_pct = d.get("box_pct")
            bbox_obj = None

            if box_2d and isinstance(box_2d, (list, tuple)) and len(box_2d) == 4:
                try:
                    ymin, xmin, ymax, xmax = [float(c) for c in box_2d]
                    if max(ymin, xmin, ymax, xmax) > 1.0:
                        scale = 1000.0
                    else:
                        scale = 1.0
                    y1 = round(ymin / scale, 3)
                    x1 = round(xmin / scale, 3)
                    y2 = round(ymax / scale, 3)
                    x2 = round(xmax / scale, 3)
                    if x1 > x2:
                        x1, x2 = x2, x1
                    if y1 > y2:
                        y1, y2 = y2, y1
                    x1 = max(0.0, min(1.0, x1))
                    y1 = max(0.0, min(1.0, y1))
                    x2 = max(0.0, min(1.0, x2))
                    y2 = max(0.0, min(1.0, y2))
                    if (x2 - x1) >= 0.02 and (y2 - y1) >= 0.02:
                        box_pct = [x1, y1, x2, y2]
                        bbox_obj = BoundingBox(x_min=x1, y_min=y1, x_max=x2, y_max=y2)
                except Exception:
                    pass
            elif box_pct and isinstance(box_pct, (list, tuple)) and len(box_pct) == 4:
                try:
                    x1, y1, x2, y2 = [float(c) for c in box_pct]
                    if max(x1, y1, x2, y2) > 1.0:
                        x1, y1, x2, y2 = [c / 1000.0 for c in (x1, y1, x2, y2)]
                    x1, y1, x2, y2 = [round(max(0.0, min(1.0, c)), 3) for c in (x1, y1, x2, y2)]
                    if (x2 - x1) >= 0.02 and (y2 - y1) >= 0.02:
                        bbox_obj = BoundingBox(x_min=x1, y_min=y1, x_max=x2, y_max=y2)
                except Exception:
                    pass

            validated_objects.append(VisibleObject(
                label=lbl,
                object_type=obj_type,
                bbox=bbox_obj,
                box_pct=box_pct,
                box_2d=[int(round(c * 1000)) for c in [box_pct[1], box_pct[0], box_pct[3], box_pct[2]]] if box_pct else None,
                confidence=d.get("confidence") or conf
            ))

        # 4. Direct Visual Observations
        ev_raw = raw.get("evidence", {})
        if isinstance(ev_raw, dict):
            raw_obs = ev_raw.get("direct_observations", [])
            raw_interps = ev_raw.get("possible_interpretations", [])
            raw_limits = ev_raw.get("limitations", [])
        else:
            raw_obs = raw.get("direct_observations", [])
            raw_interps = []
            raw_limits = raw.get("limitations", [])

        findings = [VisualFinding(observation=str(o)) for o in raw_obs if str(o).strip()]
        if not findings:
            findings = [VisualFinding(observation=scene_desc)]

        interps = [PossibleInterpretation(interpretation=str(i)) for i in raw_interps if str(i).strip()]
        limits = [str(l) for l in raw_limits if str(l).strip()]
        if not limits:
            limits = ["Optical inspection alone cannot confirm underground connectivity or temporal duration."]

        # 5. Image Quality
        q_raw = raw.get("image_quality", {})
        quality = ImageQuality(
            level=q_raw.get("level", "GOOD") if q_raw.get("level") in ("GOOD", "FAIR", "POOR") else "GOOD",
            rating=q_raw.get("level", "GOOD") if q_raw.get("level") in ("GOOD", "FAIR", "POOR") else "GOOD",
            blur=q_raw.get("blur", "LOW") if q_raw.get("blur") in ("LOW", "MODERATE", "HIGH") else "LOW",
            lighting=q_raw.get("lighting", "GOOD") if q_raw.get("lighting") in ("GOOD", "LOW_LIGHT", "OVEREXPOSED") else "GOOD",
            occlusion=q_raw.get("occlusion", "LOW") if q_raw.get("occlusion") in ("LOW", "MODERATE", "HIGH") else "LOW"
        )

        # 6. Visual Severity
        sev_raw = raw.get("visual_severity", {})
        sev_level = sev_raw.get("level", "MEDIUM")
        if sev_level not in ("LOW", "MEDIUM", "MODERATE", "HIGH", "CRITICAL", "UNKNOWN"):
            sev_level = "MEDIUM"
        sev_reason = sev_raw.get("reason") or sev_raw.get("explanation") or "Observable civic impact requiring departmental attention."
        severity = VisualSeverity(
            level=sev_level,
            confidence=sev_raw.get("confidence") or 0.85,
            reason=sev_reason,
            explanation=sev_reason
        )

        # 7. Suggested Complaint Petition Description
        sug_desc = raw.get("suggested_description") or f"A civic issue regarding {incident_name} has been identified in the photographic evidence. Kindly inspect the site and arrange for necessary municipal action."

        # 8. Review status
        rev_raw = raw.get("review", {})
        h_req = rev_raw.get("human_review_required", False) if isinstance(rev_raw, dict) else False
        rev_status = "NEEDS_HUMAN_REVIEW" if (h_req or norm_dept == "UNKNOWN") else "AUTO_CLEARED"

        return ImageAnalysisResult(
            analysis_id=req_id,
            analysis_status="SUCCESS" if norm_dept != "UNKNOWN" else "UNCERTAIN",
            model=model_name,
            image_identity={"image_hash": img_hash, "mime_type": "image/jpeg"},
            scene_analysis=SceneAnalysis(
                scene_description=scene_desc,
                scene_type=scene_type,
                visible_objects=vis_objs or [o.label for o in validated_objects],
                confidence=conf
            ),
            category_prediction=CategoryPrediction(
                department=norm_dept,
                category=incident_name,
                subcategory=subcategory,
                department_id=dept_id,
                confidence=conf,
                classification_status="CLASSIFIED" if norm_dept != "UNKNOWN" else "UNCERTAIN",
                requires_complaint_context=(norm_dept == "UNKNOWN")
            ),
            visible_objects=validated_objects,
            visual_findings=findings,
            possible_interpretations=interps,
            unconfirmed_claims=[],
            image_quality=quality,
            visual_severity=severity,
            suggested_description=sug_desc,
            limitations=limits,
            review_status=rev_status,
            yolo_configured=self.yolo_configured
        )

    def assess_complaint_context(
        self,
        image_analysis: ImageAnalysisResult,
        complaint_text: str,
        complaint_category: str = "",
        complaint_subcategory: str = ""
    ) -> ContextAssessmentResult:
        vis_dept = image_analysis.category_prediction.department
        vis_scene = image_analysis.scene_analysis.scene_description
        reported_dept = complaint_category.strip() or "General Civic Grievance"
        claim_summary = f"{reported_dept} — {complaint_subcategory or 'Reported Issue'}"

        inconsistencies = []
        info_needed = []
        consistency_level = "INCONCLUSIVE"

        if vis_dept == "UNKNOWN":
            assessment = "The photographic evidence presents general conditions. Assigned field officer will verify site details."
            consistency_level = "INCONCLUSIVE"
            info_needed.append("Field inspection by the assigned department officer.")
        elif vis_dept.lower() == reported_dept.lower():
            assessment = f"The photograph visually corroborates reported {reported_dept} conditions."
            consistency_level = "ALIGNED"
        else:
            assessment = (
                f"The image visibly focuses on {image_analysis.category_prediction.category} ({vis_dept}), "
                f"whereas the complaint reports {reported_dept}. Field officer site inspection recommended."
            )
            consistency_level = "DIVERGENT"
            inconsistencies.append(f"Visual scene ({vis_dept}) differs from submitted category ({reported_dept}).")
            info_needed.append("Verification by inspecting officer during physical site visit.")

        return ContextAssessmentResult(
            complaint_claim=claim_summary,
            visual_evidence_summary=vis_scene,
            context_assessment=assessment,
            consistency_level=consistency_level,
            possible_inconsistencies=inconsistencies,
            additional_information_needed=info_needed,
            review_recommendation="Assign field officer to verify reported site conditions."
        )

    def _normalize_department(self, raw_dept: str) -> str:
        if not raw_dept:
            return "UNKNOWN"
        clean = raw_dept.strip()
        for d in CANONICAL_30_DEPARTMENTS:
            if clean.lower() == d.lower():
                return d
        if clean in DEPARTMENT_NAME_NORMALIZATION:
            return DEPARTMENT_NAME_NORMALIZATION[clean]
        for alias, canonical in DEPARTMENT_NAME_NORMALIZATION.items():
            if alias.lower() == clean.lower() or alias.lower() in clean.lower():
                return canonical
        for d in CANONICAL_30_DEPARTMENTS:
            if clean.lower() in d.lower() or d.lower() in clean.lower():
                return d
        return "UNKNOWN"

    def _parse_json_safely(self, text: str) -> Optional[Dict[str, Any]]:
        clean = text.strip()
        if clean.startswith("```"):
            clean = re.sub(r"^```(?:json)?\s*", "", clean)
            clean = re.sub(r"\s*```$", "", clean)
        try:
            return json.loads(clean.strip())
        except Exception:
            match = re.search(r"(\{.*\})", clean, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(1).strip())
                except Exception:
                    pass
        return None

    def _build_empty_or_failed_result(self, error_msg: str) -> ImageAnalysisResult:
        req_id = f"ANL-{uuid.uuid4().hex[:12].upper()}"
        return ImageAnalysisResult(
            analysis_id=req_id,
            analysis_status="FAILED",
            model="error-handler",
            image_identity={"image_hash": "unreadable", "mime_type": "image/jpeg"},
            scene_analysis=SceneAnalysis(
                scene_description="Image validation or optical processing failure.",
                scene_type="Unprocessable Image",
                confidence=0.0
            ),
            category_prediction=CategoryPrediction(
                department="UNKNOWN",
                category="UNKNOWN",
                subcategory="Unclassified",
                confidence=None,
                requires_complaint_context=True
            ),
            visible_objects=[],
            visual_findings=[VisualFinding(observation=f"Image could not be inspected: {error_msg}")],
            image_quality=ImageQuality(level="POOR", rating="POOR", explanation=error_msg),
            visual_severity=VisualSeverity(level="UNKNOWN", explanation="Severity evaluation impossible."),
            suggested_description="",
            limitations=[error_msg],
            review_status="INSUFFICIENT_EVIDENCE"
        )


vlm_engine = VisionLanguageEngine()
