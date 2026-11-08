"""
CivicPulse AI — Multimodal Visual AI Regression Test Suite
Tests all 10 mandatory evaluation scenarios:
1. UPI fraud + open manhole -> MISMATCH (Priority decoupled)
2. UPI fraud + UPI screenshot -> PARTIAL_MATCH
3. Road pothole + pothole image -> MATCH
4. Open manhole + open manhole image -> MATCH (CRITICAL visual severity)
5. Garbage complaint + unrelated image -> MISMATCH / INSUFFICIENT_EVIDENCE
6. Water contamination + unrelated image -> MISMATCH / INSUFFICIENT_EVIDENCE
7. Complaint + blurry image -> INSUFFICIENT_EVIDENCE
8. Complaint with no image -> PENDING_ANALYSIS
9. Contradictory evidence -> Flagged for human review
10. Same image evaluated across two distinct complaint contexts
"""

import sys
import os
import json
from PIL import Image, ImageDraw
import numpy as np

# Ensure ml-service is on path
current_dir = os.path.dirname(os.path.abspath(__file__))
ml_service_dir = os.path.join(current_dir, "ml-service")
sys.path.insert(0, ml_service_dir)

from vision.src.structured_vision_engine import structured_vision_engine
from vision.src.matching.evidence_matcher import evidence_matcher
from src.prediction.multimodal_fusion import multimodal_fusion

def run_tests():
    print("=" * 80)
    print("CIVICPULSE AI — MULTIMODAL VISUAL EVIDENCE REGRESSION SUITE")
    print("=" * 80)

    results = []

    # Prepare test assets
    manhole_img_path = os.path.abspath("backend/uploads/evidence-open-1793476818741-187843532.jpg")
    pothole_img_path = os.path.abspath("ml-service/vision/data/images/CIV-IMG-00001_pothole_good.jpg")
    unrelated_img_path = os.path.abspath("ml-service/vision/data/images/CIV-IMG-00133_unrelated_scene_good.jpg")

    # Create synthetic UPI screenshot
    upi_screenshot = Image.new("RGB", (360, 800), color=(250, 250, 252))
    draw = ImageDraw.Draw(upi_screenshot)
    draw.rectangle([20, 40, 340, 100], fill=(240, 245, 255), outline=(200, 220, 245), width=2)
    draw.rectangle([20, 140, 340, 300], fill=(255, 255, 255), outline=(220, 225, 230), width=1)
    draw.rectangle([40, 180, 200, 210], fill=(20, 20, 30)) # simulated text line
    draw.rectangle([40, 230, 280, 250], fill=(80, 80, 90)) # simulated text line
    draw.rectangle([40, 360, 320, 420], fill=(22, 163, 74)) # payment success green pill
    upi_path = os.path.abspath("backend/uploads/test_upi_screenshot.png")
    upi_screenshot.save(upi_path)

    # Create blurry image
    blurry_img = Image.new("RGB", (640, 480), color=(128, 128, 128))
    blurry_path = os.path.abspath("backend/uploads/test_blurry.jpg")
    blurry_img.save(blurry_path)

    # -------------------------------------------------------------
    # Scenario 1: UPI fraud complaint + open manhole image
    # -------------------------------------------------------------
    print("\n--- TEST 1: UPI Fraud Complaint + Open Manhole Image ---")
    res1 = structured_vision_engine.analyze_evidence(
        image_url=manhole_img_path,
        text_category="Cyber Crime",
        text_subcategory="Financial Banking Fraud (UPI/Card)",
        title="Unauthorized UPI deduction of Rs 25,000",
        description="Someone fraudulently transferred money from my UPI app without my consent."
    )
    # Multimodal priority evaluation
    fusion1 = multimodal_fusion.evaluate(
        text_priority="MEDIUM",
        text_category="Cyber Crime",
        text_subcategory="Financial Banking Fraud (UPI/Card)",
        visual_severity=res1["visual_severity"],
        visual_label="open_manhole",
        visual_category=res1["image_findings"].get("visual_category"),
        evidence_consistency=res1["evidence_match"]
    )
    match1 = res1["evidence_match"] == "MISMATCH"
    priority1_safe = fusion1["final_priority"] == "MEDIUM" # NOT escalated to CRITICAL despite manhole
    warning1 = res1["mismatch_warning"] is True
    print(f"  Visual Finding: {res1['detected_incident']} ({res1['visual_severity']})")
    print(f"  Evidence Match: {res1['evidence_match']} (Expected: MISMATCH)")
    print(f"  Explanation: {res1['explanation']}")
    print(f"  Final Priority: {fusion1['final_priority']} (Priority decoupled from manhole: {priority1_safe})")
    print(f"  Decision Reason: {fusion1['decision_reason']}")
    t1_pass = match1 and priority1_safe and warning1
    results.append(("Scenario 1: UPI Fraud + Open Manhole (MISMATCH & Priority Decoupled)", t1_pass))

    # -------------------------------------------------------------
    # Scenario 2: UPI fraud complaint + UPI transaction screenshot
    # -------------------------------------------------------------
    print("\n--- TEST 2: UPI Fraud Complaint + UPI Transaction Screenshot ---")
    res2 = structured_vision_engine.analyze_evidence(
        image_url=upi_path,
        text_category="Cyber Crime",
        text_subcategory="Financial Banking Fraud (UPI/Card)",
        title="UPI Fraud Transfer",
        description="Rs 15,000 debited fraudulently via UPI."
    )
    match2 = res2["evidence_match"] == "PARTIAL_MATCH"
    is_doc2 = res2["image_findings"].get("is_digital_document", False) is True
    print(f"  Visual Finding: {res2['detected_incident']}")
    print(f"  Is Digital Document: {is_doc2}")
    print(f"  Evidence Match: {res2['evidence_match']} (Expected: PARTIAL_MATCH)")
    print(f"  Confidence: {res2['confidence']} (Expected: Valid score or None, never fake 0.85)")
    print(f"  Explanation: {res2['explanation']}")
    t2_pass = match2 and is_doc2
    results.append(("Scenario 2: UPI Fraud + UPI Screenshot (PARTIAL_MATCH)", t2_pass))

    # -------------------------------------------------------------
    # Scenario 3: Road pothole complaint + pothole image
    # -------------------------------------------------------------
    print("\n--- TEST 3: Road Pothole Complaint + Pothole Image ---")
    res3 = structured_vision_engine.analyze_evidence(
        image_url=pothole_img_path,
        text_category="Roads & Public Works",
        text_subcategory="Pothole / Surface Crater",
        title="Deep dangerous pothole on Grand Trunk Road",
        description="Large crater in the middle of carriageway causing accidents."
    )
    match3 = res3["evidence_match"] == "MATCH"
    print(f"  Visual Finding: {res3['detected_incident']}")
    print(f"  Evidence Match: {res3['evidence_match']} (Expected: MATCH)")
    print(f"  Visual Severity: {res3['visual_severity']}")
    t3_pass = match3
    results.append(("Scenario 3: Road Pothole + Pothole Image (MATCH)", t3_pass))

    # -------------------------------------------------------------
    # Scenario 4: Open manhole complaint + open manhole image
    # -------------------------------------------------------------
    print("\n--- TEST 4: Open Manhole Complaint + Open Manhole Image ---")
    res4 = structured_vision_engine.analyze_evidence(
        image_url=manhole_img_path,
        text_category="Drainage & Sewerage",
        text_subcategory="Open / Missing Manhole Cover",
        title="Uncovered sewer manhole on crowded street",
        description="Missing iron cover over subterranean drainage chamber."
    )
    fusion4 = multimodal_fusion.evaluate(
        text_priority="HIGH",
        text_category="Drainage & Sewerage",
        text_subcategory="Open / Missing Manhole Cover",
        visual_severity=res4["visual_severity"],
        visual_label="open_manhole",
        visual_category=res4["image_findings"].get("visual_category"),
        evidence_consistency=res4["evidence_match"]
    )
    match4 = res4["evidence_match"] == "MATCH"
    sev4 = res4["visual_severity"] == "CRITICAL"
    print(f"  Visual Finding: {res4['detected_incident']}")
    print(f"  Evidence Match: {res4['evidence_match']} (Expected: MATCH)")
    print(f"  Visual Severity: {res4['visual_severity']} (Expected: CRITICAL)")
    print(f"  Fused Operational Priority: {fusion4['final_priority']}")
    t4_pass = match4 and sev4
    results.append(("Scenario 4: Open Manhole + Open Manhole Image (MATCH & CRITICAL Severity)", t4_pass))

    # -------------------------------------------------------------
    # Scenario 5: Garbage dump complaint + unrelated image
    # -------------------------------------------------------------
    print("\n--- TEST 5: Garbage Dump Complaint + Unrelated Image ---")
    res5 = structured_vision_engine.analyze_evidence(
        image_url=unrelated_img_path,
        text_category="Solid Waste Management",
        text_subcategory="Overflowing Garbage Vat / Bin",
        title="Overflowing trash bin on street corner",
        description="Garbage piling up on footpath."
    )
    match5 = res5["evidence_match"] in ["MISMATCH", "INSUFFICIENT_EVIDENCE"]
    print(f"  Visual Finding: {res5['detected_incident']}")
    print(f"  Evidence Match: {res5['evidence_match']} (Expected: MISMATCH / INSUFFICIENT_EVIDENCE)")
    t5_pass = match5
    results.append(("Scenario 5: Garbage Dump + Unrelated Image (Not False MATCH)", t5_pass))

    # -------------------------------------------------------------
    # Scenario 6: Water contamination complaint + unrelated image
    # -------------------------------------------------------------
    print("\n--- TEST 6: Water Contamination Complaint + Unrelated Image ---")
    res6 = structured_vision_engine.analyze_evidence(
        image_url=unrelated_img_path,
        text_category="Water Supply",
        text_subcategory="Drinking Water Contamination",
        title="Turbid tap water with foul smell",
        description="Tap water has brown discoloration."
    )
    match6 = res6["evidence_match"] in ["MISMATCH", "INSUFFICIENT_EVIDENCE"]
    print(f"  Visual Finding: {res6['detected_incident']}")
    print(f"  Evidence Match: {res6['evidence_match']}")
    t6_pass = match6
    results.append(("Scenario 6: Water Contamination + Unrelated Image (MISMATCH / INSUFFICIENT)", t6_pass))

    # -------------------------------------------------------------
    # Scenario 7: Complaint + blurry/unusable image
    # -------------------------------------------------------------
    print("\n--- TEST 7: Complaint + Blurry Image ---")
    res7 = structured_vision_engine.analyze_evidence(
        image_url=blurry_path,
        text_category="Roads & Public Works",
        text_subcategory="Pothole / Surface Crater",
        title="Road pothole",
        description="Pothole on street."
    )
    match7 = res7["evidence_match"] == "INSUFFICIENT_EVIDENCE"
    print(f"  Quality: {res7['image_quality']}")
    print(f"  Evidence Match: {res7['evidence_match']} (Expected: INSUFFICIENT_EVIDENCE)")
    print(f"  Confidence: {res7['confidence']} (Expected: None / Uncalibrated)")
    t7_pass = match7
    results.append(("Scenario 7: Complaint + Blurry Image (INSUFFICIENT_EVIDENCE)", t7_pass))

    # -------------------------------------------------------------
    # Scenario 8: Complaint with no image
    # -------------------------------------------------------------
    print("\n--- TEST 8: Complaint with No Image ---")
    res8 = structured_vision_engine.analyze_evidence(
        text_category="Roads & Public Works",
        text_subcategory="Pothole / Surface Crater",
        title="Pothole on street",
        description="No image uploaded yet."
    )
    match8 = res8["evidence_match"] == "PENDING_ANALYSIS"
    print(f"  Evidence Match: {res8['evidence_match']} (Expected: PENDING_ANALYSIS)")
    print(f"  Analysis Status: {res8['analysis_status']}")
    t8_pass = match8
    results.append(("Scenario 8: Complaint with No Image (PENDING_ANALYSIS)", t8_pass))

    # -------------------------------------------------------------
    # Scenario 9: Contradictory evidence
    # -------------------------------------------------------------
    print("\n--- TEST 9: Contradictory Evidence (Minor Pothole vs Open Manhole) ---")
    res9 = structured_vision_engine.analyze_evidence(
        image_url=manhole_img_path,
        text_category="Roads & Public Works",
        text_subcategory="Minor Road Surface Crack",
        title="Small road crack",
        description="Minor crack on the sidewalk."
    )
    needs_review9 = res9["recommended_human_review"] is True
    print(f"  Detected Incident: {res9['detected_incident']}")
    print(f"  Evidence Match: {res9['evidence_match']}")
    print(f"  Human Review Required: {res9['recommended_human_review']} (Expected: True)")
    t9_pass = needs_review9
    results.append(("Scenario 9: Contradictory Evidence (Flagged for Human Review)", t9_pass))

    # -------------------------------------------------------------
    # Scenario 10: Same open manhole image across two distinct complaints
    # -------------------------------------------------------------
    print("\n--- TEST 10: Same Image Evaluated in 2 Distinct Contexts ---")
    eval_cyber = structured_vision_engine.analyze_evidence(
        image_url=manhole_img_path,
        text_category="Cyber Crime",
        text_subcategory="Financial Banking Fraud (UPI/Card)",
        title="UPI Payment Fraud",
        description="Cyber financial crime."
    )
    eval_drainage = structured_vision_engine.analyze_evidence(
        image_url=manhole_img_path,
        text_category="Drainage & Sewerage",
        text_subcategory="Open / Missing Manhole Cover",
        title="Open sewer manhole danger",
        description="Subterranean cavity hazard."
    )
    ctx10_pass = (eval_cyber["evidence_match"] == "MISMATCH") and (eval_drainage["evidence_match"] == "MATCH")
    print(f"  Context A (Cyber Crime): {eval_cyber['evidence_match']} (Expected: MISMATCH)")
    print(f"  Context B (Drainage):    {eval_drainage['evidence_match']} (Expected: MATCH)")
    t10_pass = ctx10_pass
    results.append(("Scenario 10: Dynamic Contextual Matching Across Complaints", t10_pass))

    # -------------------------------------------------------------
    # Summary Report
    # -------------------------------------------------------------
    print("\n" + "=" * 80)
    print("REGRESSION TEST RESULTS SUMMARY")
    print("=" * 80)
    passed_count = sum(1 for _, p in results if p)
    for name, p in results:
        status_str = "PASS [OK]" if p else "FAIL [X]"
        print(f"  {status_str} - {name}")
    print(f"\nTotal Tests: {len(results)} | Passed: {passed_count} | Failed: {len(results) - passed_count}")
    print("=" * 80)

    # Cleanup temp test files
    for p in [upi_path, blurry_path]:
        try:
            if os.path.exists(p):
                os.remove(p)
        except Exception:
            pass

    return passed_count == len(results)

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
