"""
CivicPulse AI — Image Quality Assessor
Evaluates citizen-uploaded evidence for technical photographic quality, sharpness, illumination,
contrast, and visual usability. Strictly English-only diagnostics.
"""

import os
import joblib

QUALITY_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models/quality_model.joblib"))

import math
import numpy as np
from PIL import Image
from typing import Dict, Any, List, Optional

QUALITY_STATUSES = [
    "GOOD",
    "ACCEPTABLE",
    "BLURRY",
    "LOW_LIGHT",
    "DAMAGED_IMAGE",
    "UNRELATED_IMAGE",
    "INSUFFICIENT_EVIDENCE"
]

class ImageQualityAssessor:
    def __init__(self, blur_threshold: float = 60.0, dark_threshold: float = 40.0, bright_threshold: float = 230.0):
        self.blur_threshold = blur_threshold
        self.dark_threshold = dark_threshold
        self.bright_threshold = bright_threshold
        self.trained_quality_model = None
        if os.path.exists(QUALITY_MODEL_PATH):
            try:
                self.trained_quality_model = joblib.load(QUALITY_MODEL_PATH)
            except Exception:
                pass

    def _fast_laplacian_variance(self, gray_arr: np.ndarray) -> float:
        """Computes variance of the discrete 2D Laplacian operator for sharpness estimation."""
        h, w = gray_arr.shape
        if h < 10 or w < 10:
            return 0.0

        # Subsample if large for low-latency inference
        step = max(1, min(h, w) // 400)
        sub = gray_arr[::step, ::step].astype(np.float32)

        # 3x3 Laplacian discrete kernel
        # [ 0,  1,  0 ]
        # [ 1, -4,  1 ]
        # [ 0,  1,  0 ]
        sh, sw = sub.shape
        if sh < 3 or sw < 3:
            return 0.0

        lap = (
            sub[0:sh-2, 1:sw-1] +
            sub[2:sh,   1:sw-1] +
            sub[1:sh-1, 0:sw-2] +
            sub[1:sh-1, 2:sw] -
            4.0 * sub[1:sh-1, 1:sw-1]
        )
        return float(np.var(lap))

    def assess_quality(self, img: Optional[Image.Image]) -> Dict[str, Any]:
        """
        Assesses photographic quality and returns structured quality report.
        """
        if img is None:
            return {
                "quality": "DAMAGED_IMAGE",
                "quality_note": "Image could not be decoded or file stream is corrupted.",
                "blur_score": 0.0,
                "brightness": 0.0,
                "contrast": 0.0,
                "width": 0,
                "height": 0,
                "resolution_label": "Invalid",
                "issues": ["Corrupted or unreadable image file stream"],
                "is_usable": False
            }

        try:
            width, height = img.size
            if width <= 0 or height <= 0:
                return {
                    "quality": "DAMAGED_IMAGE",
                    "quality_note": "Zero-dimension image header detected.",
                    "blur_score": 0.0, "brightness": 0.0, "contrast": 0.0,
                    "width": width, "height": height, "resolution_label": "Invalid",
                    "issues": ["Zero-dimension image dimensions"], "is_usable": False
                }

            # Convert to RGB for color evaluation and Greyscale for texture/blur
            rgb_img = img.convert('RGB')
            gray_img = img.convert('L')
            gray_arr = np.asarray(gray_img, dtype=np.float32)

            # Compute photometric metrics
            blur_score = self._fast_laplacian_variance(gray_arr)
            brightness = float(np.mean(gray_arr))
            contrast = float(np.std(gray_arr))

            # Resolution check
            is_low_res = width < 240 or height < 240
            is_blurry = blur_score < self.blur_threshold
            is_dark = brightness < self.dark_threshold
            is_overexposed = brightness > self.bright_threshold
            is_low_contrast = contrast < 18.0

            # Check for blank / uniform color images (e.g. solid grey, solid white, screenshot artifact)
            is_uniform = contrast < 4.0 and brightness > 40.0

            issues = []
            if is_uniform:
                issues.append("Image is virtually uniform with negligible visual variance (e.g., solid color / blank capture)")
            if is_blurry:
                issues.append(f"Image appears blurry or out of focus (sharpness score: {round(blur_score, 1)})")
            if is_dark:
                issues.append(f"Image is under-exposed with severe low-light conditions (luminance: {round(brightness, 1)}/255)")
            if is_overexposed:
                issues.append(f"Image is over-exposed or washed out (luminance: {round(brightness, 1)}/255)")
            if is_low_contrast and not is_uniform:
                issues.append("Low tonal contrast detected across color channels")
            if is_low_res:
                issues.append(f"Low resolution capture ({width}x{height} pixels)")

            # Resolution label
            if width >= 1920 or height >= 1920:
                res_label = "Ultra HD / 4K"
            elif width >= 1280 or height >= 1280:
                res_label = "High Definition (HD)"
            elif width >= 640 or height >= 640:
                res_label = "Standard"
            else:
                res_label = "Low Resolution"

            if self.trained_quality_model is not None:
                try:
                    from vision.src.detection.civic_detector import extract_36_features_from_pil
                    q_feats = extract_36_features_from_pil(img)
                    ml_quality = str(self.trained_quality_model.predict([q_feats])[0])
                    is_usable = ml_quality in ["GOOD", "ACCEPTABLE", "LOW_LIGHT"]
                    return {
                        "quality": ml_quality,
                        "quality_note": f"Quality verified as {ml_quality} by calibrated vision assessor.",
                        "blur_score": round(blur_score, 1),
                        "brightness": round(brightness, 1),
                        "contrast": round(contrast, 1),
                        "width": width,
                        "height": height,
                        "resolution_label": res_label,
                        "issues": issues,
                        "is_usable": is_usable
                    }
                except Exception:
                    pass

            # Classification of final quality status
            if is_uniform:
                status = "UNRELATED_IMAGE"
                quality_note = "Image appears to be a blank screen or uniform solid color without civic features."
                is_usable = False
            elif is_dark:
                status = "LOW_LIGHT"
                quality_note = "Photographic evidence was captured in extreme low light. Night enhancement required."
                is_usable = not is_blurry
            elif is_blurry:
                status = "BLURRY"
                quality_note = "Severe camera motion blur or defocus prevents definitive visual confirmation."
                is_usable = False
            elif is_low_res and len(issues) >= 2:
                status = "INSUFFICIENT_EVIDENCE"
                quality_note = "Resolution and contrast are insufficient to isolate physical municipal infrastructure damage."
                is_usable = False
            elif len(issues) == 0:
                status = "GOOD"
                quality_note = "Optimal sharpness, balanced illumination, and high photographic clarity."
                is_usable = True
            else:
                status = "ACCEPTABLE"
                quality_note = f"Evidence is acceptable for administrative inspection. Note: {issues[0]}."
                is_usable = True

            return {
                "quality": status,
                "quality_note": quality_note,
                "blur_score": round(blur_score, 1),
                "brightness": round(brightness, 1),
                "contrast": round(contrast, 1),
                "width": width,
                "height": height,
                "resolution_label": res_label,
                "issues": issues,
                "is_usable": is_usable
            }

        except Exception as e:
            return {
                "quality": "DAMAGED_IMAGE",
                "quality_note": f"Error decoding image stream: {str(e)}",
                "blur_score": 0.0, "brightness": 0.0, "contrast": 0.0,
                "width": 0, "height": 0, "resolution_label": "Invalid",
                "issues": [str(e)], "is_usable": False
            }

image_quality_assessor = ImageQualityAssessor()
