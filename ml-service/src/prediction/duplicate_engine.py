import os
import math
import joblib
import numpy as np
from typing import List, Dict, Any
from sklearn.metrics.pairwise import cosine_similarity
from src.preprocessing.text_cleaner import clean_text

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../models"))
VECTORIZER_PATH = os.path.join(MODELS_DIR, "duplicate_vectorizer.joblib")

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates in meters using Haversine formula.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    return R * c

class DuplicateEngine:
    def __init__(self):
        self.vectorizer = None
        self._load_vectorizer()
        
    def _load_vectorizer(self):
        if os.path.exists(VECTORIZER_PATH):
            try:
                self.vectorizer = joblib.load(VECTORIZER_PATH)
            except Exception as e:
                print(f"Error loading duplicate vectorizer: {e}")
                self.vectorizer = None
                
    def check_duplicate(
        self,
        new_text: str,
        new_lat: float,
        new_lng: float,
        existing_complaints: List[Dict[str, Any]],
        text_weight: float = 0.6,
        geo_weight: float = 0.4,
        threshold: float = 0.65,
        max_geo_radius_meters: float = 350.0
    ) -> Dict[str, Any]:
        """
        Calculates hybrid spatio-textual duplicate score against a list of active complaints.
        """
        if not existing_complaints:
            return {
                "is_duplicate": False,
                "max_similarity": 0.0,
                "matched_complaint_id": None,
                "matches": []
            }
            
        if self.vectorizer is None:
            self._load_vectorizer()
            
        new_clean = clean_text(new_text)
        if not new_clean:
            return {"is_duplicate": False, "max_similarity": 0.0, "matched_complaint_id": None, "matches": []}
            
        # Extract and clean existing texts (both title and description)
        existing_cleaned = [
            clean_text(f"{c.get('title') or ''} {c.get('description') or c.get('complaint_text') or ''}") 
            for c in existing_complaints
        ]
        
        # Calculate Text Cosine Similarity
        if self.vectorizer is not None:
            try:
                all_vectors = self.vectorizer.transform([new_clean] + existing_cleaned)
                new_vec = all_vectors[0:1]
                exist_vecs = all_vectors[1:]
                text_sims = cosine_similarity(new_vec, exist_vecs)[0]
            except Exception:
                # Fallback to Jaccard similarity if vector transform fails
                words_new = set(new_clean.split())
                text_sims = []
                for ec in existing_cleaned:
                    words_e = set(ec.split())
                    inter = len(words_new.intersection(words_e))
                    union = len(words_new.union(words_e)) or 1
                    text_sims.append(inter / union)
                text_sims = np.array(text_sims)
        else:
            words_new = set(new_clean.split())
            text_sims = []
            for ec in existing_cleaned:
                words_e = set(ec.split())
                inter = len(words_new.intersection(words_e))
                union = len(words_new.union(words_e)) or 1
                text_sims.append(inter / union)
            text_sims = np.array(text_sims)
            
        matches = []
        max_fused_score = 0.0
        best_match_id = None
        
        for idx, item in enumerate(existing_complaints):
            t_sim = float(text_sims[idx])
            
            c_lat = float(item.get("latitude") or 0.0)
            c_lng = float(item.get("longitude") or 0.0)
            
            # Compute distance if valid coordinates
            if abs(new_lat) > 0.1 and abs(c_lat) > 0.1:
                dist_m = haversine_distance(new_lat, new_lng, c_lat, c_lng)
                geo_sim = max(0.0, 1.0 - (dist_m / max_geo_radius_meters))
            else:
                dist_m = 9999.0
                geo_sim = 0.0
                
            fused_score = (text_weight * t_sim) + (geo_weight * geo_sim)
            
            if fused_score >= threshold or (t_sim >= 0.70 and dist_m <= 1500):
                tracking_code = item.get("tracking_id") or f"CMP-{item.get('id')}"
                dist_label = f"{int(round(dist_m))} meters" if dist_m < 1000 else f"{round(dist_m / 1000, 1)} km"
                match_data = {
                    "complaint_id": item.get("id") or item.get("tracking_id"),
                    "tracking_id": tracking_code,
                    "title": item.get("title") or item.get("category"),
                    "distance_meters": round(dist_m, 1),
                    "distance_label": dist_label,
                    "text_similarity": round(t_sim * 100, 1),
                    "geo_proximity_score": round(geo_sim * 100, 1),
                    "combined_similarity": round(max(fused_score, t_sim * 0.8) * 100, 1),
                    "summary_label": f"Similarity: {int(round(t_sim * 100))}% | Distance: {dist_label} | Existing Complaint: {tracking_code}"
                }
                matches.append(match_data)
                
                if fused_score > max_fused_score:
                    max_fused_score = fused_score
                    best_match_id = match_data["complaint_id"]
                    
        # Sort matches by highest combined similarity
        matches.sort(key=lambda x: x["combined_similarity"], reverse=True)
        
        return {
            "is_duplicate": len(matches) > 0,
            "max_similarity": round(max_fused_score * 100, 1),
            "matched_complaint_id": best_match_id,
            "matches": matches[:5]
        }
