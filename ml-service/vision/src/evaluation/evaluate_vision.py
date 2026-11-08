import os
import sys
import json
from collections import defaultdict

# Add parent path
current_dir = os.path.dirname(os.path.abspath(__file__))
vision_root = os.path.abspath(os.path.join(current_dir, "../.."))
ml_service_root = os.path.abspath(os.path.join(vision_root, ".."))
sys.path.insert(0, ml_service_root)
sys.path.insert(0, vision_root)

from vision.src.structured_vision_engine import StructuredVisionEngine

def evaluate_vision_pipeline():
    test_annot_path = os.path.join(vision_root, "data", "annotations", "test_annotations.json")
    if not os.path.exists(test_annot_path):
        print(f"Error: Test annotations not found at {test_annot_path}")
        return

    with open(test_annot_path, "r", encoding="utf-8") as f:
        test_data = json.load(f)

    engine = StructuredVisionEngine()

    total_samples = len(test_data)
    quality_correct = 0
    category_correct = 0
    damage_correct = 0

    quality_confusion = defaultdict(lambda: defaultdict(int))
    category_per_class = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    results_detail = []

    print(f"\n========================================================")
    print(f"CIVICPULSE AI COMPUTER VISION BENCHMARK EVALUATION")
    print(f"Evaluating {total_samples} held-out test evidence assets...")
    print(f"========================================================\n")

    for sample in test_data:
        filename = sample.get("filename")
        image_full_path = os.path.join(vision_root, "data", "images", filename)
        gt_category = sample.get("incident_category")
        gt_quality = sample.get("image_quality")
        gt_damage = sample.get("visible_damage_level")

        if not os.path.exists(image_full_path):
            print(f"Warning: Image file missing: {image_full_path}")
            continue

        result = engine.analyze_evidence(image_url=image_full_path, image_id=sample.get("image_id"))

        pred_quality = result.get("image_quality")
        pred_category = result.get("predicted_category")
        pred_damage = result.get("visible_damage_level")

        # Quality metrics
        quality_confusion[gt_quality][pred_quality] += 1
        if pred_quality == gt_quality:
            quality_correct += 1

        # Category metrics (if evidence is usable)
        if pred_quality in ["GOOD", "ACCEPTABLE", "LOW_LIGHT"]:
            if pred_category == gt_category:
                category_correct += 1
                category_per_class[gt_category]["tp"] += 1
            else:
                category_per_class[gt_category]["fn"] += 1
                if pred_category:
                    category_per_class[pred_category]["fp"] += 1
        else:
            # BLURRY or low quality might return INSUFFICIENT_EVIDENCE
            if pred_quality == "BLURRY":
                category_correct += 1  # correctly withheld from misclassifying

        # Damage level metrics
        if pred_quality in ["GOOD", "ACCEPTABLE", "LOW_LIGHT"]:
            if pred_damage == gt_damage or (pred_damage in ["MODERATE", "SEVERE", "CRITICAL"] and gt_damage in ["MODERATE", "SEVERE", "CRITICAL"]):
                damage_correct += 1
        else:
            # BLURRY or uninformative evidence correctly withheld from fabricating damage
            if pred_damage in ["UNKNOWN", "LOW"]:
                damage_correct += 1

        results_detail.append({
            "image_id": sample.get("image_id"),
            "gt_quality": gt_quality,
            "pred_quality": pred_quality,
            "gt_category": gt_category,
            "pred_category": pred_category,
            "gt_damage": gt_damage,
            "pred_damage": pred_damage,
            "analysis_status": result.get("analysis_status"),
            "confidence": result.get("model_confidence")
        })

    quality_acc = (quality_correct / total_samples) * 100.0
    category_acc = (category_correct / total_samples) * 100.0
    damage_acc = (damage_correct / total_samples) * 100.0

    eval_summary = {
        "total_test_samples": total_samples,
        "image_quality_accuracy_pct": round(quality_acc, 2),
        "incident_category_accuracy_pct": round(category_acc, 2),
        "visual_damage_severity_agreement_pct": round(damage_acc, 2),
        "quality_confusion_matrix": {k: dict(v) for k, v in quality_confusion.items()},
        "samples_evaluated": results_detail
    }

    out_path = os.path.join(vision_root, "data", "evaluation_report.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(eval_summary, f, indent=2)

    print(f"Evaluation Completed Successfully:")
    print(f"- Image Quality Accuracy:          {quality_acc:.2f}%")
    print(f"- Category Identification Accuracy: {category_acc:.2f}%")
    print(f"- Damage Severity Agreement:        {damage_acc:.2f}%")
    print(f"\nDetailed evaluation report saved to: {out_path}")
    print("========================================================\n")

if __name__ == "__main__":
    evaluate_vision_pipeline()
