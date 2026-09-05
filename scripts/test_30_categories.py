import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add ml-service to path
ml_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../ml-service"))
sys.path.append(ml_path)

from src.prediction.category_predictor import CategoryPredictor
from src.prediction.priority_predictor import PriorityPredictor
from src.prediction.resolution_predictor import ResolutionPredictor

TEST_CASES = [
    ("Someone stole my motorcycle from the hospital parking lot.", "Police & Law Enforcement"),
    ("My UPI account was fraudulently debited ₹25,000 without my permission.", "Cyber Crime"),
    ("A group of men are harassing and stalking school girls outside the gate.", "Women & Child Safety"),
    ("Traffic signal at the main market square is completely broken and causing massive traffic jam.", "Traffic & Road Safety"),
    ("Massive pothole on Station Road causing two-wheelers to slip.", "Roads & Public Works"),
    ("Open manhole directly outside school gate with sewage water overflowing.", "Drainage & Sewerage"),
    ("Drinking water pipeline burst and dirty yellow contaminated water coming from taps.", "Water Supply"),
    ("Overflowing municipal garbage bin near the vegetable market has not been cleared for days.", "Solid Waste Management"),
    ("Streetlight pole broken and entire stretch of road in pitch darkness at night.", "Street Lighting & Electrical"),
    ("High dengue risk due to massive mosquito breeding in unhygienic stagnant pool.", "Public Health & Sanitation"),
    ("Commercial building has blocked emergency fire exit with heavy boxes. Fire hazard!", "Fire & Emergency Services"),
    ("Flash flood waterlogging submerged residential houses after cyclone storm.", "Disaster Management"),
    ("Industrial factory releasing thick toxic chemical smoke and polluting the canal.", "Environment & Pollution"),
    ("Broken playground swing with sharp rusted iron edges in children's park.", "Parks & Public Spaces"),
    ("Illegal commercial building being constructed without municipal setback or permit.", "Building & Municipal Engineering"),
    ("Influential person encroaching on government land and building illegal boundary wall.", "Land & Land Records"),
    ("Severe roof leakage and cracked plaster in low-income government housing colony.", "Housing & Urban Development"),
    ("Distribution transformer sparking loudly with heavy voltage fluctuations.", "Electricity & Power"),
    ("Municipal bus route consistently skipping bus stops and leaving passengers stranded.", "Public Transport"),
    ("Railway platform #2 has overflowing filthy toilets and unmaintained track garbage.", "Railway-related Public Complaints"),
    ("Emergency casualty hospital ward has no doctor on duty and shortage of medicines.", "Health & Hospitals"),
    ("Fair price ration dealer under-weighing grains and selling rotten wheat.", "Food & Public Distribution"),
    ("Electronics shop refusing to honor manufacturer warranty for defective product.", "Consumer Affairs"),
    ("Ceiling plaster fell inside primary school classroom, injuring students.", "Education - Schools"),
    ("Senior college students severely ragging and harassing first-year students in hostel.", "Higher Education"),
    ("Factory owner withheld wages of 30 construction laborers for three months.", "Labour & Employment"),
    ("Canal irrigation failed and crops damaged due to fake adulterated seeds.", "Agriculture"),
    ("Pack of aggressive stray dogs attacked children and bit pedestrians.", "Animal Resources"),
    ("Illegal felling and timber smuggling of mature forest trees in reserve forest.", "Forest & Wildlife"),
    ("Municipal clerk demanded bribe to issue birth certificate.", "Public Grievance / General Administration")
]

def run_tests():
    print("=" * 70)
    print("[TEST] EVALUATING CIVICPULSE AI ACROSS ALL 30 DEPARTMENTS")
    print("=" * 70)
    
    cat_pred = CategoryPredictor()
    prio_pred = PriorityPredictor()
    res_pred = ResolutionPredictor()
    
    correct = 0
    total = len(TEST_CASES)
    
    for idx, (text, expected_cat) in enumerate(TEST_CASES, 1):
        res = cat_pred.predict(text)
        predicted_cat = res["category"]
        confidence = res["confidence"]
        subcat = res["subcategory"]
        dept = res["department"]
        is_crime = res["is_crime"]
        is_emergency = res["is_emergency"]
        
        # Priority and resolution
        prio_res = prio_pred.predict(text, category=predicted_cat, severity="High")
        res_res = res_pred.predict(category=predicted_cat, priority=prio_res["priority"], location_type="Residential", ward="Ward 4", affected_count=100)
        
        match = (predicted_cat == expected_cat)
        if match:
            correct += 1
            status = "[PASS]"
        else:
            status = f"[FAIL] (Expected: {expected_cat})"
            
        print(f"[{idx:02d}/30] {status}")
        print(f"       Text: \"{text[:65]}...\"")
        print(f"       Category: {predicted_cat} ({confidence*100:.1f}%) | Subcat: {subcat}")
        print(f"       Dept: {dept} | Priority: {prio_res['priority']} | Est: {res_res['estimated_days']} days | Crime: {is_crime} | Emer: {is_emergency}")
        print("-" * 70)
        
    accuracy = (correct / total) * 100
    print(f"\n[RESULT] FINAL 30-DEPARTMENT TEST SCORE: {correct}/{total} ({accuracy:.1f}%)")
    print("=" * 70)
    return accuracy

if __name__ == "__main__":
    run_tests()
