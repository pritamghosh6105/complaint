import urllib.request
import json
import sys

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

tests = [
    {
        'dept': 'Water Supply',
        'text': 'Severe drinking water pipe burst flooding the residential street with continuous water supply leakage.'
    },
    {
        'dept': 'Drainage & Sewerage',
        'text': 'Drainage canal is completely choked with plastic waste causing overflowing dirty sewage onto public road.'
    },
    {
        'dept': 'Cyber Crime',
        'text': 'My bank account was compromised and 25000 rupees was stolen through unauthorized online transactions.'
    },
    {
        'dept': 'Police & Law Enforcement',
        'text': 'Last night thieves broke open the front lock of our house and stole cash and gold jewelry.'
    },
    {
        'dept': 'Electricity & Power',
        'text': 'High voltage electric pole has tilted dangerously after the storm and live wires are hanging down near a public school.'
    }
]

def run_e2e_test():
    print("=== ML SERVICE PREDICTION TEST (/predict/all) ===")
    all_passed = True
    for t in tests:
        req = urllib.request.Request(
            'http://127.0.0.1:8000/predict/all',
            data=json.dumps({
                'text': t['text'],
                'severity': 'Medium',
                'location_type': 'Residential'
            }).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        try:
            with urllib.request.urlopen(req) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                cat = res.get('category_prediction', {})
                pri = res.get('priority_prediction', {})
                res_time = res.get('resolution_prediction', {})
                summary = res.get('summary', {})
                pred_dept = cat.get('primaryDepartment') or cat.get('category')
                is_pass = pred_dept == t['dept']
                if not is_pass:
                    all_passed = False
                print(f"[{'PASS' if is_pass else 'FAIL'}] Expected: {t['dept']} | Predicted: {pred_dept}")
                print(f"  Input: {t['text'][:60]}...")
                print(f"  Subcategory: {cat.get('subcategory')}")
                print(f"  Priority: {pri.get('priority')} | SLA: {pri.get('sla_hours')} hrs")
                print(f"  Est. Resolution: {res_time.get('estimated_hours')} hrs")
                print()
        except Exception as e:
            print(f"Error testing {t['dept']}: {e}")
            all_passed = False
    return all_passed

if __name__ == '__main__':
    run_e2e_test()
