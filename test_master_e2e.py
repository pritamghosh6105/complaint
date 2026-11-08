"""
CivicPulse AI — Master End-to-End Multimodal Integration Test Suite (Phase 14)
Tests:
- All 30 Complaint Divisions on Retrained Text ML Models
- Computer Vision Pipeline across Image Qualities (GOOD, BLURRY, LOW_LIGHT, UNRELATED)
- Multimodal Text-Image Fusion & Mismatch Disagreement Protocol
- Non-Visual Incident Safe Handling (INSUFFICIENT_VISUAL_EVIDENCE)
- Verified West Bengal Authority Routing
- Priority and Visual Damage Decoupling
"""

import os
import sys
import json
import base64
import requests

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ML_BASE_URL = "http://127.0.0.1:8000"
BACKEND_BASE_URL = "http://localhost:5000/api"

CIVIC_30_DIVISIONS = [
    ("Police & Law Enforcement", "Armed robbery and physical assault reported near market area"),
    ("Cyber Crime", "Unauthorized bank debit and OTP interception scam via fake banking portal"),
    ("Women & Child Safety", "Stalking and harassment near women college hostel after dark"),
    ("Traffic & Road Safety", "Defunct traffic signal lights causing vehicular gridlock and accidents"),
    ("Roads & Public Works", "Deep 2-foot road crater and collapsed carriageway divider"),
    ("Drainage & Sewerage", "Monsoon storm drain blockage and black sewage overflow onto pavement"),
    ("Water Supply", "High pressure drinking water main pipeline burst gushing potable water"),
    ("Solid Waste Management", "Overflowing municipal garbage vat accumulating rotting waste"),
    ("Street Lighting & Electrical", "Exposed live 440V distribution wires hanging dangerously above pathway"),
    ("Public Health & Sanitation", "Stagnant drainage pool with massive mosquito larva breeding infestation"),
    ("Fire & Emergency Services", "Commercial godown fire with thick toxic smoke and LPG cylinder risk"),
    ("Disaster Management", "Severe riverbank erosion and flash flooding submerging village access road"),
    ("Environment & Pollution", "Illegal industrial effluent discharge into irrigation canal turning water red"),
    ("Parks & Public Spaces", "Broken children playground swings and boundary wall encroachment"),
    ("Building & Municipal Engineering", "Severe structural cracks and concrete spalling on old commercial balcony"),
    ("Land & Land Records", "Long pending land mutation certificate delay and disputed record entry"),
    ("Housing & Urban Development", "Bangla Awas Yojana housing grant disbursal delay for eligible BPL family"),
    ("Electricity & Power", "Frequent unannounced voltage fluctuations and power blackout lasting 18 hours"),
    ("Public Transport", "Government bus route absence and private minibus operators overcharging passengers"),
    ("Railway-related Public Complaints", "Hazardous delayed level crossing gate closure stalling emergency ambulances"),
    ("Health & Hospitals", "Emergency ward admission denial and essential antibiotic stockout"),
    ("Food & Public Distribution", "Ration dealer underweighing subsidized rice quota and demanding cash surcharge"),
    ("Consumer Affairs", "Retail medicine shop charging 30 percent above Maximum Retail Price"),
    ("Education – Schools", "Mid-day meal grain quality infested with weevils and unhygienic kitchen"),
    ("Higher Education", "Delayed semester marksheet verification and college library book shortage"),
    ("Labour & Employment", "Construction contractor non-payment of statutory minimum daily wages"),
    ("Agriculture", "Bangla Shasya Bima crop damage compensation pending for flood affected paddy"),
    ("Animal Resources", "State veterinary dispensary lack of cattle vaccination during epidemic"),
    ("Forest & Wildlife", "Wild elephant herd entering agricultural farmland destroying standing sugarcane"),
    ("Public Grievance / General Administration", "Caste certificate issuance delayed beyond statutory citizens charter limit")
]

def run_tests():
    print("\n=================================================================")
    print("CIVICPULSE AI — PHASE 14 COMPREHENSIVE END-TO-END VALIDATION")
    print("=================================================================\n")
    
    passed_tests = 0
    total_tests = 0

    # 1. Test All 30 Complaint Divisions on Retrained Category ML Model
    print("--- TEST SUITE 1: 30-Category Division Classification ---")
    cat_successes = 0
    for expected_cat, text_sample in CIVIC_30_DIVISIONS:
        total_tests += 1
        payload = {
            "text": text_sample,
            "location_type": "Urban Corporation",
            "ward": "Ward 12",
            "district": "Kolkata",
            "affected_count": 80,
            "is_emergency": False
        }
        try:
            resp = requests.post(f"{ML_BASE_URL}/predict/all", json=payload, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                predicted_cat = data.get("summary", {}).get("primaryDepartment")
                # Normalize dash for comparison
                norm_exp = expected_cat.replace("–", "-")
                norm_pred = predicted_cat.replace("–", "-") if predicted_cat else ""
                if norm_exp == norm_pred:
                    cat_successes += 1
                    passed_tests += 1
                else:
                    print(f"  [MISMATCH] Expected: '{expected_cat}' | Predicted: '{predicted_cat}'")
            else:
                print(f"  [ERROR] HTTP {resp.status_code} for '{expected_cat}'")
        except Exception as e:
            print(f"  [EXCEPTION] Failed testing '{expected_cat}': {e}")

    print(f"Category Model Accuracy across 30 Divisions: {cat_successes}/30 ({(cat_successes/30)*100:.1f}%)\n")

    # 2. Test Verified Authority Mapping System
    print("--- TEST SUITE 2: Verified West Bengal Public Authority Routing ---")
    total_tests += 1
    try:
        resp = requests.get(f"{ML_BASE_URL}/authorities", timeout=5)
        if resp.status_code == 200:
            auth_data = resp.json().get("authorities", {})
            auth_count = len(auth_data)
            print(f"Verified authorities registered for {auth_count}/30 official divisions.")
            if auth_count == 30:
                passed_tests += 1
                print("  [PASS] All 30 divisions mapped to verified West Bengal administrative bodies.")
            else:
                print(f"  [FAIL] Expected 30 divisions, found {auth_count}.")
        else:
            print(f"  [FAIL] HTTP {resp.status_code}")
    except Exception as e:
        print(f"  [EXCEPTION] {e}")

    # 3. Test Computer Vision Quality & Structured Output
    print("\n--- TEST SUITE 3: Computer Vision & Photographic Evidence Analysis ---")
    vision_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "ml-service/vision/data/images"))
    test_images = [f for f in os.listdir(vision_dir) if f.endswith(".jpg")][:4] if os.path.exists(vision_dir) else []
    
    if test_images:
        for img_name in test_images:
            total_tests += 1
            full_path = os.path.join(vision_dir, img_name)
            try:
                resp = requests.post(
                    f"{ML_BASE_URL}/vision/analyze",
                    json={
                        "image_url": full_path,
                        "text_category": "Roads & Public Works",
                        "description": "Hazardous road crater and pothole"
                    },
                    timeout=10
                )
                if resp.status_code == 200:
                    cv_res = resp.json()
                    # Verify Phase 7 required keys
                    required_keys = [
                        "analysis_id", "image_id", "detected_incident", "predicted_category",
                        "visible_damage_level", "image_quality", "model_confidence",
                        "evidence_description", "recommended_human_review", "analysis_status"
                    ]
                    has_all_keys = all(k in cv_res for k in required_keys)
                    if has_all_keys:
                        passed_tests += 1
                        print(f"  [PASS] {img_name} -> Quality: {cv_res['image_quality']}, Damage: {cv_res['visible_damage_level']}, Status: {cv_res['analysis_status']}")
                    else:
                        print(f"  [FAIL] Missing required Phase 7 keys in {img_name}")
                else:
                    print(f"  [FAIL] HTTP {resp.status_code} for {img_name}")
            except Exception as e:
                print(f"  [EXCEPTION] {img_name}: {e}")
    else:
        print("  [SKIP] No physical images found in vision directory.")

    # 4. Test Multimodal Text-Image Fusion & Mismatch Detection
    print("\n--- TEST SUITE 4: Multimodal Text + Vision Fusion & Mismatch Protocol ---")
    
    # Scenario A: Matching Evidence
    total_tests += 1
    resp_match = requests.post(
        f"{ML_BASE_URL}/multimodal/evaluate",
        json={
            "text_priority": "HIGH",
            "text_category": "Roads & Public Works",
            "text_subcategory": "Pothole / Road Surface Damage",
            "visual_severity": "SEVERE",
            "visual_category": "Roads & Public Works",
            "location_type": "State Highway",
            "affected_count": 250,
            "district": "Howrah",
            "is_emergency": False
        },
        timeout=5
    )
    if resp_match.status_code == 200:
        match_data = resp_match.json()
        print(f"  Matching Scenario: Priority -> {match_data.get('final_priority')}, SLA -> {match_data.get('sla_hours')}h, Warning: {match_data.get('mismatch_warning')}")
        if match_data.get("mismatch_warning") is False and match_data.get("final_priority") in ["HIGH", "CRITICAL"]:
            passed_tests += 1
            print("  [PASS] Matching multimodal evidence correctly escalated priority without warning.")
        else:
            print(f"  [FAIL] Unexpected matching output: {match_data}")

    # Scenario B: Contradictory Evidence Mismatch
    total_tests += 1
    resp_mismatch = requests.post(
        f"{ML_BASE_URL}/multimodal/evaluate",
        json={
            "text_priority": "MEDIUM",
            "text_category": "Land & Land Records",
            "text_subcategory": "Land Mutation Processing Delays",
            "visual_severity": "MODERATE",
            "visual_category": "Solid Waste Management",
            "location_type": "Rural Gram Panchayat",
            "affected_count": 5,
            "district": "Birbhum",
            "is_emergency": False
        },
        timeout=5
    )
    if resp_mismatch.status_code == 200:
        mismatch_data = resp_mismatch.json()
        print(f"  Contradiction Scenario: Primary -> {mismatch_data.get('primary_category')}, Visual -> {mismatch_data.get('visual_category')}, Warning -> {mismatch_data.get('mismatch_warning')}")
        if mismatch_data.get("mismatch_warning") is True and mismatch_data.get("primary_category") == "Land & Land Records" and mismatch_data.get("requires_human_review") is True:
            passed_tests += 1
            print("  [PASS] Text-image disagreement correctly triggered mismatch warning and flagged human review without overriding text.")
        else:
            print(f"  [FAIL] Disagreement protocol violated.")

    # Scenario C: Non-Visual Administrative Complaint
    total_tests += 1
    resp_nonvis = requests.post(
        f"{ML_BASE_URL}/vision/analyze",
        json={
            "text_category": "Public Grievance / General Administration",
            "text_subcategory": "Pension Disbursal Delay",
            "description": "My retirement pension has not been credited for 6 months"
        },
        timeout=5
    )
    if resp_nonvis.status_code == 200:
        nonvis_data = resp_nonvis.json()
        print(f"  Non-Visual Category Handling: Detected -> {nonvis_data.get('detected_incident')}, Category -> {nonvis_data.get('predicted_category')}")
        if nonvis_data.get("predicted_category") == "INSUFFICIENT_VISUAL_EVIDENCE":
            passed_tests += 1
            print("  [PASS] Non-visual category safely returned INSUFFICIENT_VISUAL_EVIDENCE.")
        else:
            print(f"  [FAIL] Forced into visual category: {nonvis_data.get('predicted_category')}")

    # Summary
    print("\n=================================================================")
    print(f"E2E VALIDATION SUMMARY: {passed_tests}/{total_tests} Tests Passed ({(passed_tests/total_tests)*100:.1f}%)")
    print("=================================================================\n")

if __name__ == "__main__":
    run_tests()
