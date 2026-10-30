import os
import sys

# Ensure project root in sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.prediction.category_predictor import CategoryPredictor
from src.prediction.priority_predictor import PriorityPredictor

def run_tests():
    cp = CategoryPredictor()
    pp = PriorityPredictor()

    test_cases_30 = [
        (1, 'Theft reported at a residential property.', 'Unknown individuals entered a house and stole valuable belongings. The resident requests an official police investigation.', 'Police & Law Enforcement'),
        (2, 'Unauthorized UPI transaction.', 'Money was transferred from my bank account without my authorization after a suspicious online transaction.', 'Cyber Crime'),
        (3, 'Repeated harassment near a bus stop.', 'A woman is repeatedly being followed and harassed while travelling home.', 'Women & Child Safety'),
        (4, 'Traffic signal not working at a busy junction.', 'Vehicles are crossing the junction without functioning traffic signals, creating accident risks.', 'Traffic & Road Safety'),
        (5, 'Large pothole on the main road.', 'A large pothole is damaging vehicles and disrupting road movement.', 'Roads & Public Works'),
        (6, 'Open manhole near a residential street.', 'A manhole cover is missing, leaving a dangerous opening in the roadside drainage system.', 'Drainage & Sewerage'),
        (7, 'Contaminated drinking water supplied to homes.', 'Tap water has an unusual smell and visible contamination.', 'Water Supply'),
        (8, 'Garbage not collected for several days.', 'Waste is accumulating at the designated community collection point.', 'Solid Waste Management'),
        (9, 'Streetlights not working in our lane.', 'Several streetlights have stopped functioning, leaving the residential lane poorly illuminated.', 'Street Lighting & Electrical'),
        (10, 'Mosquito breeding in stagnant public water.', 'Stagnant water has accumulated and is creating mosquito-breeding conditions.', 'Public Health & Sanitation'),
        (11, 'Fire reported in a residential building.', 'Smoke and flames are visible inside a building and immediate fire response is requested.', 'Fire & Emergency Services'),
        (12, 'Severe flooding affecting multiple villages.', 'Floodwater has entered homes and residents require disaster-response assistance.', 'Disaster Management'),
        (13, 'Industrial smoke polluting the surrounding area.', 'Smoke and emissions from an industrial facility are affecting nearby residents.', 'Environment & Pollution'),
        (14, 'Public park playground equipment damaged.', 'Broken playground equipment is making the public park unsafe.', 'Parks & Public Spaces'),
        (15, 'Cracks appearing in an unsafe residential building.', 'Large structural cracks have appeared and an engineering inspection is requested.', 'Building & Municipal Engineering'),
        (16, 'Incorrect land mutation record.', 'The ownership mutation record contains incorrect details requiring land-record correction.', 'Land & Land Records'),
        (17, 'Housing scheme application issue.', 'An eligible household is facing an unresolved issue with an urban housing scheme.', 'Housing & Urban Development'),
        (18, 'Electricity outage in several residential streets.', 'Multiple households have been without electricity following a local supply failure.', 'Electricity & Power'),
        (19, 'Public bus service repeatedly missing scheduled trips.', 'The public bus route is experiencing repeated service disruptions.', 'Public Transport'),
        (20, 'Railway station passenger facility damaged.', 'Passenger facilities at a railway station are damaged and require railway authority attention.', 'Railway-related Public Complaints'),
        (21, 'Hospital emergency services unavailable.', 'Patients are unable to access the required emergency medical services at a hospital.', 'Health & Hospitals'),
        (22, 'Ration distribution not provided to eligible household.', 'An eligible ration-card holder has not received the allocated food grains.', 'Food & Public Distribution'),
        (23, 'Shop charging more than the displayed price.', 'A retailer is charging consumers above the displayed product price.', 'Consumer Affairs'),
        (24, 'School building requires urgent maintenance.', 'Damaged classroom facilities are affecting school students.', 'Education – Schools'),
        (25, 'University examination result discrepancy.', 'A university examination result contains an apparent evaluation or marks-entry error.', 'Higher Education'),
        (26, 'Employer has not paid workers their wages.', 'Employees have not received their due salaries despite completing their work.', 'Labour & Employment'),
        (27, 'Irrigation water unavailable for agricultural fields.', 'Farmers are unable to access irrigation water for their crops.', 'Agriculture'),
        (28, 'Stray cattle causing problems in residential areas.', 'Stray livestock are creating road obstruction and require appropriate animal-resource intervention.', 'Animal Resources'),
        (29, 'Illegal tree cutting in protected forest area.', 'Trees are being cut without apparent authorization in a forest area.', 'Forest & Wildlife'),
        (30, 'Delay in a general government service application.', 'A citizen\'s application remains unresolved and requires administrative grievance assistance.', 'Public Grievance / General Administration')
    ]

    print("================================================================================")
    print("CIVICPULSE AI 30-DEPARTMENT AUTHORITATIVE CLASSIFICATION TEST SUITE")
    print("================================================================================")
    passed_count = 0
    results = []

    for idx, title, desc, expected in test_cases_30:
        res = cp.predict(desc, title)
        primary = res['primaryDepartment']
        sub = res['subcategory']
        conf = res['departmentConfidence']
        is_match = (primary == expected)
        if is_match:
            passed_count += 1
            status_str = "PASS"
        else:
            status_str = "FAIL"
        
        results.append({
            "id": idx,
            "expected": expected,
            "predicted": primary,
            "subcategory": sub,
            "confidence": conf,
            "status": status_str
        })
        print(f"[{idx:02d}] {status_str} | Expected: {expected:<35} | Got: {primary:<35} (Sub: {sub}) (Conf: {conf:.2f})")

    print("================================================================================")
    print(f"FINAL SCORE: {passed_count}/30 TEST CASES PASSED ({passed_count/30*100:.1f}%)")
    print("================================================================================")

    # English Contrast Cases Validation
    print("\n--- CONTRAST CASES VALIDATION (English-Only) ---")
    contrast_cases = [
        ("A man has died under suspicious circumstances. Please investigate.", "Police & Law Enforcement"),
        ("A fatal vehicular collision occurred on the highway resulting in death.", "Traffic & Road Safety"),
        ("A patient died at the hospital due to alleged gross medical negligence.", "Health & Hospitals")
    ]
    for text, exp_dept in contrast_cases:
        res = cp.predict(text)
        is_p = (res['primaryDepartment'] == exp_dept)
        print(f"[CONTRAST] Got: {res['primaryDepartment']:<30} | Subcat: {res['subcategory']:<35} | Pass: {is_p}")

    return passed_count == 30

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
