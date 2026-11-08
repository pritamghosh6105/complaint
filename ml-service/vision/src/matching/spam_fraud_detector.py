"""
CivicPulse AI — Multimodal Spam, Fraud & Evidence Integrity Filter (Stage C)
Analyzes cross-modal alignment, perceptual image hashing, synthetic masking,
and digital document misrepresentation to score fraudulent or spam complaints.

Strictly English-only taxonomy.
Emits calibrated numeric spam_score (0.0 to 1.0), fraud_risk_level, and clearance_tier.
"""

import time
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image

PHYSICAL_CIVIC_CATEGORIES = {
    "Roads & Public Works",
    "Drainage & Sewerage",
    "Water Supply",
    "Street Lighting & Electrical",
    "Solid Waste Management",
    "Building & Municipal Engineering",
    "Fire & Emergency Services",
    "Disaster Management",
    "Agriculture",
    "Irrigation & Waterways",
    "Public Transport & Metro",
    "Parks & Recreation"
}

ADMINISTRATIVE_OR_DIGITAL_CATEGORIES = {
    "Cyber Crime",
    "Finance & Revenue",
    "Consumer Affairs",
    "Higher Education",
    "School Education",
    "Public Grievance / General Administration",
    "Labour & Employment",
    "Law & Judicial"
}

class SpamFraudDetector:
    def __init__(self, max_registry_size: int = 1000):
        self.detector_version = "3.0.0-spam-fraud-filter"
        self.max_registry_size = max_registry_size
        # In-memory perceptual hash registry: hash_str -> { complaint_id, timestamp, category, title }
        self._hash_registry: Dict[str, Dict[str, Any]] = {}

    @staticmethod
    def compute_dhash(img: Image.Image, hash_size: int = 8) -> str:
        """
        Computes 64-bit difference hash (dHash) for invariant perceptual image matching.
        Resizes image to (hash_size + 1, hash_size), converts to greyscale, and compares adjacent gradients.
        """
        try:
            resized = img.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
            pixels = list(resized.getdata())
            diff = []
            for row in range(hash_size):
                for col in range(hash_size):
                    pixel_left = pixels[row * (hash_size + 1) + col]
                    pixel_right = pixels[row * (hash_size + 1) + col + 1]
                    diff.append(pixel_left > pixel_right)

            decimal_val = 0
            hex_parts = []
            for idx, val in enumerate(diff):
                if val:
                    decimal_val += 2 ** (idx % 4)
                if (idx % 4) == 3:
                    hex_parts.append(hex(decimal_val)[2:])
                    decimal_val = 0
            return "".join(hex_parts)
        except Exception:
            return "0000000000000000"

    @staticmethod
    def hamming_distance(hash1: str, hash2: str) -> int:
        """Calculates bitwise Hamming distance between two 64-bit hex hashes."""
        try:
            val1 = int(hash1, 16)
            val2 = int(hash2, 16)
            xor_val = val1 ^ val2
            return bin(xor_val).count('1')
        except Exception:
            return 64

    def check_duplicate_image(
        self,
        curr_hash: str,
        complaint_id: Optional[str] = None,
        category: str = "",
        threshold: int = 4
    ) -> Tuple[bool, Optional[Dict[str, Any]], int]:
        """
        Checks whether the perceptual hash matches an existing submission in the registry.
        Hamming distance <= 4 indicates near-identical or visually duplicate imagery.
        """
        if not curr_hash or curr_hash == "0000000000000000":
            return False, None, 64

        best_match = None
        min_distance = 64

        for stored_hash, meta in self._hash_registry.items():
            dist = self.hamming_distance(curr_hash, stored_hash)
            if dist < min_distance:
                min_distance = dist
                if dist <= threshold:
                    # Avoid matching with the same complaint id during re-evaluation
                    if complaint_id and meta.get("complaint_id") == complaint_id:
                        continue
                    best_match = meta

        if best_match and min_distance <= threshold:
            return True, best_match, min_distance
        return False, None, min_distance

    def register_image_hash(
        self,
        curr_hash: str,
        complaint_id: Optional[str] = None,
        category: str = "",
        title: str = ""
    ) -> None:
        """Registers an image perceptual hash in the in-memory cache with eviction."""
        if not curr_hash or curr_hash == "0000000000000000":
            return
        if len(self._hash_registry) >= self.max_registry_size:
            # Evict oldest 20%
            keys = list(self._hash_registry.keys())
            for k in keys[: int(self.max_registry_size * 0.2)]:
                self._hash_registry.pop(k, None)

        self._hash_registry[curr_hash] = {
            "complaint_id": complaint_id or f"CMP-{int(time.time()*1000)%1000000}",
            "timestamp": time.time(),
            "category": category,
            "title": title
        }

    def evaluate(
        self,
        img: Optional[Image.Image],
        image_findings: Dict[str, Any],
        complaint_context: Dict[str, Any],
        evidence_match: str = "MATCH",
        vlm_fraud_data: Optional[Dict[str, Any]] = None,
        complaint_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive Multimodal Spam & Fraud Risk Evaluation.
        Returns:
        - spam_score: float (0.0 to 1.0)
        - fraud_risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
        - fraud_indicators: List[str]
        - clearance_tier: 'AUTO_CLEARED' | 'STANDARD_REVIEW' | 'FLAGGED_FRAUD_REVIEW' | 'MANDATORY_OFFICER_TRIAGE'
        - image_hash: str
        - is_recycled_duplicate: bool
        """
        complaint_category = complaint_context.get("category", "").strip()
        complaint_subcategory = complaint_context.get("subcategory", "").strip()
        title = complaint_context.get("title", "").strip()
        description = complaint_context.get("description", "").strip()

        detected_incident = image_findings.get("detected_incident", "")
        visual_category = image_findings.get("visual_category") or ""
        visual_severity = image_findings.get("visual_severity", "UNKNOWN")
        image_quality = image_findings.get("image_quality", "GOOD")
        is_digital_doc = image_findings.get("is_digital_document", False)

        fraud_indicators: List[str] = []
        raw_score: float = 0.05  # Base baseline noise

        # 1. Perceptual dHash & Recycled Image Analysis
        image_hash = "0000000000000000"
        is_recycled = False
        duplicate_meta = None

        if img is not None:
            image_hash = self.compute_dhash(img)
            is_dup, dup_meta, dist = self.check_duplicate_image(
                curr_hash=image_hash,
                complaint_id=complaint_id,
                category=complaint_category
            )
            if is_dup:
                is_recycled = True
                duplicate_meta = dup_meta
                raw_score += 0.45
                fraud_indicators.append(
                    f"RECYCLED_EVIDENCE_HASH: Matches prior complaint ({dup_meta.get('complaint_id')}) with distance {dist} bits"
                )

        # 2. Digital Document / Mobile Screenshot uploaded for Physical Street Hazard
        is_physical_hazard_claimed = (
            complaint_category in PHYSICAL_CIVIC_CATEGORIES or
            any(w in f"{title} {description}".lower() for w in [
                "pothole", "crater", "road", "manhole", "pipe burst", "sewage", "waterlogging",
                "garbage", "dump", "pole", "wire", "tree", "fire", "leak"
            ])
        )

        if is_digital_doc and is_physical_hazard_claimed:
            raw_score += 0.65
            fraud_indicators.append(
                "DIGITAL_SCREENSHOT_FOR_PHYSICAL_CLAIM: Digital mobile screen or financial slip uploaded for physical civic infrastructure hazard"
            )

        # 3. Semantic Difference (Neutral Context Divergence, not fraud)
        if evidence_match == "MISMATCH":
            raw_score += 0.12
            fraud_indicators.append(
                f"CONTEXT_DIVERGENCE: Visual scene ({detected_incident}) differs from reported department ({complaint_category})"
            )

        # 4. Low Fidelity / Uninformative Blur Masking
        if image_quality in ["BLURRY", "DAMAGED_IMAGE", "UNRELATED_IMAGE", "INSUFFICIENT_EVIDENCE"]:
            raw_score += 0.35
            fraud_indicators.append(
                f"LOW_FIDELITY_MASKING: Image quality degraded ({image_quality}); lacks corroborative visual signal"
            )

        # 5. Flat Uniform Synthetic Artifacts
        if image_findings.get("is_flat_synthetic", False):
            raw_score += 0.40
            fraud_indicators.append(
                "SYNTHETIC_OR_BLANK_IMAGE: High pixel uniformity indicating blank canvas or non-photographic artifact"
            )

        # 6. VLM Advanced Vision-Language Forensic Signal
        if vlm_fraud_data and isinstance(vlm_fraud_data, dict):
            vlm_spam = float(vlm_fraud_data.get("spam_score", 0.0))
            if vlm_spam > 0.40:
                raw_score = max(raw_score, vlm_spam)
                for ind in vlm_fraud_data.get("fraud_indicators", []):
                    if ind not in fraud_indicators:
                        fraud_indicators.append(ind)

        # 7. Beneficial Corroboration Discounts (Clean Authentic Physical Match)
        if evidence_match == "MATCH" and image_quality == "GOOD" and not is_digital_doc and not is_recycled:
            raw_score = max(0.02, raw_score - 0.20)

        # 8. Clamp final spam score
        spam_score = round(max(0.01, min(0.99, raw_score)), 2)

        # 9. Determine Fraud Risk Level
        if spam_score >= 0.70:
            fraud_risk_level = "CRITICAL"
        elif spam_score >= 0.50:
            fraud_risk_level = "HIGH"
        elif spam_score >= 0.25:
            fraud_risk_level = "MEDIUM"
        else:
            fraud_risk_level = "LOW"

        # 10. Determine Automated Clearance Tier
        if spam_score < 0.25 and evidence_match == "MATCH" and image_quality == "GOOD" and visual_severity != "CRITICAL":
            clearance_tier = "AUTO_CLEARED"
        elif spam_score >= 0.60 or evidence_match == "MISMATCH":
            clearance_tier = "FLAGGED_FRAUD_REVIEW"
        elif visual_severity == "CRITICAL" or image_quality in ["BLURRY", "DAMAGED_IMAGE", "UNRELATED_IMAGE", "INSUFFICIENT_EVIDENCE"]:
            clearance_tier = "MANDATORY_OFFICER_TRIAGE"
        else:
            clearance_tier = "STANDARD_REVIEW"

        # Register hash if it is a genuine upload
        if img is not None and not is_recycled:
            self.register_image_hash(
                curr_hash=image_hash,
                complaint_id=complaint_id,
                category=complaint_category,
                title=title
            )

        return {
            "spam_score": spam_score,
            "fraud_risk_level": fraud_risk_level,
            "fraud_indicators": fraud_indicators,
            "clearance_tier": clearance_tier,
            "image_hash": image_hash,
            "is_recycled_duplicate": is_recycled,
            "duplicate_reference": duplicate_meta,
            "detector_version": self.detector_version
        }

spam_fraud_detector = SpamFraudDetector()
