"""
CivicPulse AI — Computer Vision Engine Entrypoint
Delegates to the Phase 7 StructuredVisionEngine for comprehensive image quality,
object detection, damage severity evaluation, and evidence consistency checking.
Strictly English-only. Backward compatible with all existing API routes.
"""

import sys
import os
from typing import Dict, Any, Optional

current_dir = os.path.dirname(os.path.abspath(__file__))
ml_service_dir = os.path.abspath(os.path.join(current_dir, "../.."))
if ml_service_dir not in sys.path:
    sys.path.insert(0, ml_service_dir)

from vision.src.structured_vision_engine import structured_vision_engine

class VisionEngine:
    def __init__(self):
        self.engine = structured_vision_engine
        self.model_name = self.engine.model_name
        self.model_version = self.engine.model_version

    def process_evidence(
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
        Executes vision analysis and returns structured Phase 7 output.
        """
        return self.engine.analyze_evidence(
            image_bytes=image_bytes,
            image_base64=image_base64,
            image_url=image_url,
            text_category=text_category,
            text_subcategory=text_subcategory,
            description=description,
            title=title,
            image_id=image_id
        )

vision_engine = VisionEngine()
