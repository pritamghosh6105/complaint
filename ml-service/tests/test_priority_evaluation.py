import os
import sys
import json

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Add parent to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(current_dir, "..")))

from src.prediction.priority_predictor import PriorityPredictor

TEST_CASES = [
    {
        "id": 1,
        "text": "One streetlight near my house has stopped working. There is no immediate danger.",
        "expected": ["LOW"]
    },
    {
        "id": 2,
        "text": "Several streetlights in our neighborhood have been broken for a week.",
        "expected": ["MEDIUM"]
    },
    {
        "id": 3,
        "text": "A major pothole on a busy road is causing vehicles to suddenly brake and accidents are becoming likely.",
        "expected": ["HIGH"]
    },
    {
        "id": 4,
        "text": "A live electrical wire has fallen onto the road and people could be electrocuted.",
        "expected": ["CRITICAL"]
    },
    {
        "id": 5,
        "text": "Garbage collection was missed once this week.",
        "expected": ["LOW"]
    },
    {
        "id": 6,
        "text": "Garbage has been accumulating for several days in our residential area.",
        "expected": ["MEDIUM"]
    },
    {
        "id": 7,
        "text": "A large pile of waste is creating severe health risks near a crowded market.",
        "expected": ["HIGH"]
    },
    {
        "id": 8,
        "text": "An uncovered manhole is directly beside a school entrance and children could fall into it.",
        "expected": ["CRITICAL"]
    },
    {
        "id": 9,
        "text": "A woman is being repeatedly followed and harassed while returning home.",
        "expected": ["HIGH"]
    },
    {
        "id": 10,
        "text": "A woman is being physically attacked right now.",
        "expected": ["CRITICAL"]
    },
    {
        "id": 11,
        "text": "Someone stole my bicycle yesterday.",
        "expected": ["MEDIUM"]
    },
    {
        "id": 12,
        "text": "Someone is attacking a person right now.",
        "expected": ["CRITICAL"]
    },
    {
        "id": 13,
        "text": "My bank account was charged ₹25,000 due to an online fraud.",
        "expected": ["HIGH"]
    },
    {
        "id": 14,
        "text": "A suspicious message asking for my bank OTP was received.",
        "expected": ["LOW", "MEDIUM"]
    },
    {
        "id": 15,
        "text": "A child is currently in immediate danger.",
        "expected": ["CRITICAL"]
    },
    {
        "id": 16,
        "text": "আমাদের পাড়ার একটি স্ট্রিট লাইট কয়েকদিন ধরে খারাপ। কোনও জরুরি বিপদ নেই।",
        "expected": ["LOW"]
    },
    {
        "id": 17,
        "text": "একটি শিশু এই মুহূর্তে চরম বিপদের মধ্যে আছে, অবিলম্বে সাহায্য প্রয়োজন।",
        "expected": ["CRITICAL"]
    },
    {
        "id": 18,
        "text": "गली की एक स्ट्रीट लाइट खराब है। कोई तत्काल खतरा नहीं है।",
        "expected": ["LOW"]
    },
    {
        "id": 19,
        "text": "एक व्यक्ति पर अभी जानलेवा हमला हो रहा है, तुरंत पुलिस भेजें।",
        "expected": ["CRITICAL"]
    }
]

def run_evaluation():
    predictor = PriorityPredictor()
    passed = 0
    total = len(TEST_CASES)
    
    print("\n" + "="*70)
    print("CIVICPULSE AI PRIORITY MODEL EVALUATION TEST SUITE (19 TESTS)")
    print("="*70)
    
    for case in TEST_CASES:
        res = predictor.predict(case["text"])
        actual = res["priority"]
        is_pass = actual in case["expected"]
        if is_pass:
            passed += 1
            status = "✓ PASS"
        else:
            status = "✗ FAIL"
            
        print(f"[{status}] Test {case['id']}: Expected={case['expected']} | Actual={actual} (ML={res['ml_priority']})")
        print(f"       Text: \"{case['text'][:70]}...\"")
        print(f"       Confidence: {res['confidence']*100:.1f}% | SLA: {res['sla_hours']} hrs | Probabilities: {res['probabilities']}")
        print(f"       Risk Factors: {res['risk_factors']}")
        if res.get("override_reason"):
            print(f"       Emergency Escalation: {res['override_reason']}")
        print("-" * 70)
        
    print(f"\nRESULTS: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    print("="*70 + "\n")
    return passed == total

if __name__ == "__main__":
    success = run_evaluation()
    sys.exit(0 if success else 1)
