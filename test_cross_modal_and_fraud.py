"""
CivicPulse AI — Day 3 Cross-Modal Evidence Matching & Spam/Fraud Test Suite
Tests:
1. Authentic physical hazard evidence -> AUTO_CLEARED, LOW spam, high semantic similarity
2. Digital screenshot for physical claim -> DIGITAL_SCREENSHOT_FOR_PHYSICAL_CLAIM, FLAGGED_FRAUD_REVIEW
3. Digital screenshot for cyber crime -> Legitimate administrative evidence (LOW fraud risk)
4. Blurry masking upload -> LOW_FIDELITY_MASKING, MANDATORY_OFFICER_TRIAGE
5. Recycled duplicate image -> RECYCLED_EVIDENCE_HASH, is_recycled_duplicate
6. Semantic contradiction -> SEMANTIC_CONTRADICTION, FLAGGED_FRAUD_REVIEW
7. Multimodal Fusion Priority Decoupling under fraud risk
"""

import sys
import os
import json
from PIL import Image, ImageDraw

# Add ml-service to path
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_service_dir = os.path.join(current_dir, "ml-service")
sys.path.insert(0, ml_service_dir)

from vision.src.structured_vision_engine import structured_vision_engine
from vision.src.matching.spam_fraud_detector import spam_fraud_detector
from src.prediction.multimodal_fusion import multimodal_fusion

def run_tests():
    print("=" * 80)
    print("CIVICPULSE AI — DAY 3: CROSS-MODAL MATCHING & SPAM/FRAUD TEST SUITE")
    print("=" * 80)

    results = []

    # Prepare paths
    pothole_img_path = os.path.abspath("ml-service/vision/data/images/CIV-IMG-00001_pothole_good.jpg")
    garbage_img_path = os.path.abspath("ml-service/vision/data/images/CIV-IMG-00013_open_manhole_good.jpg") # manhole
    upi_path = os.path.abspath("backend/uploads/test_upi_screenshot.png")
    blurry_path = os.path.abspath("backend/uploads/test_blurry.jpg")

    # Create synthetic test assets if missing
    os.makedirs("backend/uploads", exist_ok=True)
    if not os.path.exists(upi_path):
        upi_screenshot = Image.new("RGB", (360, 800), color=(250, 250, 252))
        draw = ImageDraw.Draw(upi_screenshot)
        draw.rectangle([20, 40, 340, 100], fill=(240, 245, 255), outline=(200, 220, 245), width=2)
        draw.rectangle([20, 140, 340, 300], fill=(255, 255, 255), outline=(220, 225, 230), width=1)
        draw.rectangle([40, 180, 200, 210], fill=(20, 20, 30))
        draw.rectangle([40, 230, 280, 250], fill=(80, 80, 90))
        draw.rectangle([40, 360, 320, 420], fill=(22, 163, 74))
        upi_screenshot.save(upi_path)

    if not os.path.exists(blurry_path):
        blurry_img = Image.new("RGB", (640, 480), color=(128, 128, 128))
        blurry_img.save(blurry_path)

    # -------------------------------------------------------------
    # Scenario 1: Authentic Pothole Photo + Pothole Complaint
    # -------------------------------------------------------------
    print("\n--- TEST 1: Authentic Pothole Photo + Pothole Complaint ---")
    res1 = structured_vision_engine.analyze_evidence(
        image_url=pothole_img_path,
        text_category="Roads & Public Works",
        text_subcategory="Pothole / Surface Crater",
        title="Dangerous deep pothole on Jessore Road",
        description="A massive crater in the asphalt carriageway causing severe vehicle damage and accidents."
    )
    print(f"  Match: {res1['evidence_match']}")
    print(f"  Semantic Similarity: {res1['semantic_similarity']}")
    print(f"  Spam Score: {res1['spam_score']}")
    print(f"  Fraud Risk Level: {res1['fraud_risk_level']}")
    print(f"  Clearance Tier: {res1['clearance_tier']}")

    t1_pass = (
        res1["evidence_match"] == "MATCH" and
        res1["semantic_similarity"] >= 0.75 and
        res1["spam_score"] <= 0.25 and
        res1["fraud_risk_level"] == "LOW" and
        res1["clearance_tier"] in ["AUTO_CLEARED", "STANDARD_REVIEW"]
    )
    results.append(("Scenario 1: Authentic Physical Hazard (AUTO_CLEARED & LOW Fraud Risk)", t1_pass))

    # -------------------------------------------------------------
    # Scenario 2: UPI Screenshot uploaded for Physical Pothole Hazard
    # -------------------------------------------------------------
    print("\n--- TEST 2: Digital Screenshot for Physical Pothole Hazard ---")
    res2 = structured_vision_engine.analyze_evidence(
        image_url=upi_path,
        text_category="Roads & Public Works",
        text_subcategory="Pothole / Surface Crater",
        title="Huge crater on highway",
        description="Deep pothole needs asphalt filling."
    )
    print(f"  Match: {res2['evidence_match']}")
    print(f"  Spam Score: {res2['spam_score']}")
    print(f"  Fraud Risk Level: {res2['fraud_risk_level']}")
    print(f"  Fraud Indicators: {res2['fraud_indicators']}")
    print(f"  Clearance Tier: {res2['clearance_tier']}")

    t2_pass = (
        res2["spam_score"] >= 0.50 and
        res2["fraud_risk_level"] in ["HIGH", "CRITICAL"] and
        any("DIGITAL_SCREENSHOT_FOR_PHYSICAL_CLAIM" in ind for ind in res2["fraud_indicators"]) and
        res2["clearance_tier"] == "FLAGGED_FRAUD_REVIEW"
    )
    results.append(("Scenario 2: Digital Screenshot for Physical Hazard (FLAGGED_FRAUD_REVIEW)", t2_pass))

    # -------------------------------------------------------------
    # Scenario 3: UPI Screenshot uploaded for Genuine Cyber Crime
    # -------------------------------------------------------------
    print("\n--- TEST 3: Digital Screenshot for Legitimate Cyber Crime ---")
    spam_fraud_detector._hash_registry.clear()
    res3 = structured_vision_engine.analyze_evidence(
        image_url=upi_path,
        text_category="Cyber Crime",
        text_subcategory="Financial Banking Fraud (UPI/Card)",
        title="UPI Payment Fraud",
        description="Rs 12,000 was debited fraudulently without OTP."
    )
    print(f"  Match: {res3['evidence_match']}")
    print(f"  Semantic Similarity: {res3['semantic_similarity']}")
    print(f"  Fraud Risk Level: {res3['fraud_risk_level']}")
    print(f"  Fraud Indicators: {res3['fraud_indicators']}")

    t3_pass = (
        res3["evidence_match"] == "PARTIAL_MATCH" and
        res3["semantic_similarity"] >= 0.70 and
        not any("DIGITAL_SCREENSHOT_FOR_PHYSICAL_CLAIM" in ind for ind in res3["fraud_indicators"])
    )
    results.append(("Scenario 3: Digital Screenshot for Legitimate Cyber Claim (Authentic Record)", t3_pass))

    # -------------------------------------------------------------
    # Scenario 4: Blurry / Masking Image Upload
    # -------------------------------------------------------------
    print("\n--- TEST 4: Blurry / Low Fidelity Masking Upload ---")
    res4 = structured_vision_engine.analyze_evidence(
        image_url=blurry_path,
        text_category="Water Supply",
        text_subcategory="Pipeline Burst / Severe Leakage",
        title="Pipeline burst",
        description="Water gushing everywhere."
    )
    print(f"  Match: {res4['evidence_match']}")
    print(f"  Fraud Indicators: {res4['fraud_indicators']}")
    print(f"  Clearance Tier: {res4['clearance_tier']}")

    t4_pass = (
        res4["evidence_match"] == "INSUFFICIENT_EVIDENCE" and
        any("LOW_FIDELITY_MASKING" in ind for ind in res4["fraud_indicators"]) and
        res4["clearance_tier"] in ["MANDATORY_OFFICER_TRIAGE", "FLAGGED_FRAUD_REVIEW"]
    )
    results.append(("Scenario 4: Blurry / Masking Image (LOW_FIDELITY_MASKING Flagged)", t4_pass))

    # -------------------------------------------------------------
    # Scenario 5: Perceptual dHash Duplicate / Recycled Image Check
    # -------------------------------------------------------------
    print("\n--- TEST 5: Recycled Image Duplicate Detection ---")
    # First submission registers hash
    spam_fraud_detector.register_image_hash(
        curr_hash=res1["image_hash"],
        complaint_id="CMP-INITIAL-1001",
        category="Roads & Public Works",
        title="Original pothole report"
    )

    # Second submission with the same image under a new complaint
    img = Image.open(pothole_img_path)
    dup_res = spam_fraud_detector.evaluate(
        img=img,
        image_findings=res1["image_findings"],
        complaint_context={
            "category": "Roads & Public Works",
            "subcategory": "Pothole / Surface Crater",
            "title": "Recycled photo test",
            "description": "Submitting same photo"
        },
        evidence_match="MATCH",
        complaint_id="CMP-NEW-9999"
    )
    print(f"  Is Recycled Duplicate: {dup_res['is_recycled_duplicate']}")
    print(f"  Duplicate Reference: {dup_res['duplicate_reference']}")
    print(f"  Fraud Indicators: {dup_res['fraud_indicators']}")

    t5_pass = (
        dup_res["is_recycled_duplicate"] is True and
        dup_res["duplicate_reference"] is not None and
        any("RECYCLED_EVIDENCE_HASH" in ind for ind in dup_res["fraud_indicators"])
    )
    results.append(("Scenario 5: Perceptual dHash Duplicate Detection (RECYCLED_EVIDENCE_HASH)", t5_pass))

    # -------------------------------------------------------------
    # Scenario 6: Semantic Contradiction (MISMATCH)
    # -------------------------------------------------------------
    print("\n--- TEST 6: Semantic Contradiction (Fire vs Manhole) ---")
    res6 = structured_vision_engine.analyze_evidence(
        image_url=garbage_img_path, # open manhole
        text_category="Fire & Emergency Services",
        text_subcategory="Residential / Commercial Structure Fire",
        title="Active warehouse fire raging",
        description="Flames engulfing the second floor of the chemical depot."
    )
    print(f"  Match: {res6['evidence_match']}")
    print(f"  Semantic Similarity: {res6['semantic_similarity']}")
    print(f"  Spam Score: {res6['spam_score']}")
    print(f"  Fraud Indicators: {res6['fraud_indicators']}")
    print(f"  Clearance Tier: {res6['clearance_tier']}")

    t6_pass = (
        res6["evidence_match"] == "MISMATCH" and
        res6["semantic_similarity"] <= 0.35 and
        any("SEMANTIC_CONTRADICTION" in ind for ind in res6["fraud_indicators"]) and
        res6["clearance_tier"] == "FLAGGED_FRAUD_REVIEW"
    )
    results.append(("Scenario 6: Semantic Contradiction (MISMATCH & FLAGGED_FRAUD_REVIEW)", t6_pass))

    # -------------------------------------------------------------
    # Scenario 7: Multimodal Priority Fusion with Spam/Fraud Decoupling
    # -------------------------------------------------------------
    print("\n--- TEST 7: Multimodal Priority Decoupling under Fraud Risk ---")
    fusion_res = multimodal_fusion.evaluate(
        text_priority="LOW",
        text_category="Roads & Public Works",
        text_subcategory="Pothole / Surface Crater",
        visual_severity="CRITICAL",
        visual_label="open_manhole",
        spam_score=res6["spam_score"],
        fraud_risk_level=res6["fraud_risk_level"],
        fraud_indicators=res6["fraud_indicators"],
        evidence_consistency="MISMATCH"
    )
    print(f"  Final Priority: {fusion_res['final_priority']} (Expected: LOW, decoupled from CRITICAL)")
    print(f"  Clearance Tier: {fusion_res['clearance_tier']}")
    print(f"  Requires Human Review: {fusion_res['requires_human_review']}")

    t7_pass = (
        fusion_res["final_priority"] == "LOW" and
        fusion_res["requires_human_review"] is True and
        fusion_res["clearance_tier"] == "FLAGGED_FRAUD_REVIEW"
    )
    results.append(("Scenario 7: Multimodal Priority Decoupling under Fraud Risk", t7_pass))

    # -------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------
    print("\n" + "=" * 80)
    print("DAY 3 TEST RESULTS SUMMARY")
    print("=" * 80)
    passed = 0
    for name, ok in results:
        status = "PASS [OK]" if ok else "FAIL [X]"
        print(f"  {status} - {name}")
        if ok:
            passed += 1

    total = len(results)
    print(f"\nTotal Tests: {total} | Passed: {passed} | Failed: {total - passed}")
    print("=" * 80)
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
