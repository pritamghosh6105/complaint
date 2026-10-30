"""
CivicPulse AI — Authoritative 30 Canonical Department Taxonomy Constants
Single source of truth across ML training, prediction API, and routing.
"""

CANONICAL_30_DEPARTMENTS = [
    "Police & Law Enforcement",
    "Cyber Crime",
    "Women & Child Safety",
    "Traffic & Road Safety",
    "Roads & Public Works",
    "Drainage & Sewerage",
    "Water Supply",
    "Solid Waste Management",
    "Street Lighting & Electrical",
    "Public Health & Sanitation",
    "Fire & Emergency Services",
    "Disaster Management",
    "Environment & Pollution",
    "Parks & Public Spaces",
    "Building & Municipal Engineering",
    "Land & Land Records",
    "Housing & Urban Development",
    "Electricity & Power",
    "Public Transport",
    "Railway-related Public Complaints",
    "Health & Hospitals",
    "Food & Public Distribution",
    "Consumer Affairs",
    "Education – Schools",
    "Higher Education",
    "Labour & Employment",
    "Agriculture",
    "Animal Resources",
    "Forest & Wildlife",
    "Public Grievance / General Administration"
]

# Aliases and normalization mapping
DEPARTMENT_NAME_NORMALIZATION = {
    "Police & Law Enforcement": "Police & Law Enforcement",
    "Cyber Crime": "Cyber Crime",
    "Women & Child Safety": "Women & Child Safety",
    "Traffic & Road Safety": "Traffic & Road Safety",
    "Roads & Public Works": "Roads & Public Works",
    "Drainage & Sewerage": "Drainage & Sewerage",
    "Water Supply": "Water Supply",
    "Solid Waste Management": "Solid Waste Management",
    "Street Lighting & Electrical": "Street Lighting & Electrical",
    "Public Health & Sanitation": "Public Health & Sanitation",
    "Fire & Emergency Services": "Fire & Emergency Services",
    "Disaster Management": "Disaster Management",
    "Environment & Pollution": "Environment & Pollution",
    "Parks & Public Spaces": "Parks & Public Spaces",
    "Building & Municipal Engineering": "Building & Municipal Engineering",
    "Land & Land Records": "Land & Land Records",
    "Housing & Urban Development": "Housing & Urban Development",
    "Electricity & Power": "Electricity & Power",
    "Public Transport": "Public Transport",
    "Railway-related Public Complaints": "Railway-related Public Complaints",
    "Health & Hospitals": "Health & Hospitals",
    "Food & Public Distribution": "Food & Public Distribution",
    "Consumer Affairs": "Consumer Affairs",
    "Education - Schools": "Education – Schools",
    "Education – Schools": "Education – Schools",
    "Education & School Infrastructure": "Education – Schools",
    "Higher Education": "Higher Education",
    "Labour & Employment": "Labour & Employment",
    "Agriculture": "Agriculture",
    "Agriculture & Irrigation": "Agriculture",
    "Animal Resources": "Animal Resources",
    "Animal Husbandry & Veterinary": "Animal Resources",
    "Forest & Wildlife": "Forest & Wildlife",
    "Forest & Wildlife Protection": "Forest & Wildlife",
    "Public Grievance / General Administration": "Public Grievance / General Administration",
    "Public Grievance / General Admin": "Public Grievance / General Administration",
    "Healthcare & Hospital Facilities": "Health & Hospitals",
    "Food & Supplies (PDS)": "Food & Public Distribution",
    "Consumer Affairs & Fair Price": "Consumer Affairs"
}

# Subcategory definitions for all 30 departments
DEPARTMENT_SUBCATEGORIES = {
    "Police & Law Enforcement": [
        "Death Investigation / Suspicious or Unexplained Death (pending verification)",
        "Theft / Burglary",
        "Physical Assault",
        "Robbery / Armed Snatching",
        "Missing Person Report",
        "Public Violence / Rioting",
        "Extortion / Intimidation"
    ],
    "Cyber Crime": [
        "UPI / Payment Gateway Fraud",
        "Net Banking Fraud",
        "Phishing / Scam Calls",
        "Account Hacking / Unauthorized Access",
        "Cyber Harassment / Stalking",
        "Identity Theft / Loan Impersonation"
    ],
    "Women & Child Safety": [
        "Street Harassment / Eve Teasing",
        "Stalking & Threat",
        "Domestic Violence Grievance",
        "Child Abuse / Child Labour",
        "Unsafe Corridor / Transit Hazard"
    ],
    "Traffic & Road Safety": [
        "Fatal Vehicle Collision",
        "Dangerous / Rash Driving",
        "Traffic Signal Failure",
        "Illegal / Obstructive Parking",
        "Chronic Traffic Congestion",
        "Missing Road Signage / Zebra Crossing"
    ],
    "Roads & Public Works": [
        "Pothole / Surface Crater",
        "Road Cave-in / Sinkhole",
        "Broken / Eroded Road",
        "Damaged Bridge / Flyover",
        "Broken Divider / Railing"
    ],
    "Drainage & Sewerage": [
        "Open / Missing Manhole Cover",
        "Sewage Water Overflow",
        "Blocked / Clogged Drain",
        "Monsoon Waterlogging",
        "Foul Sewer Odor"
    ],
    "Water Supply": [
        "Pipeline Burst / Leakage",
        "Contaminated / Muddy Drinking Water",
        "Low Water Pressure / No Supply",
        "Broken Public Tap / Standpost"
    ],
    "Solid Waste Management": [
        "Overflowing Garbage Vat / Bin",
        "Illegal Open Waste Dumping",
        "Missed Door-to-Door Collection",
        "Dead Animal Carcass Removal",
        "Hazardous Biomedical Waste"
    ],
    "Street Lighting & Electrical": [
        "Streetlight Completely Off",
        "Flickering / Damaged LED",
        "Damaged / Leaning Light Pole",
        "Exposed High-Mast Junction Box"
    ],
    "Public Health & Sanitation": [
        "Mosquito Breeding & Dengue Risk",
        "Public Toilet & Urinal Hygiene",
        "Stagnant Water Vector Control",
        "Food Market Sanitation"
    ],
    "Fire & Emergency Services": [
        "Residential Structure Fire",
        "Commercial / Factory Fire Hazard",
        "LPG Cylinder Leak / Blast",
        "Fire Hydrant Damage"
    ],
    "Disaster Management": [
        "Flood Inundation & Rescue",
        "Cyclone Damage & Uprooted Trees",
        "Emergency Relief & Shelter",
        "River Embankment Breach"
    ],
    "Environment & Pollution": [
        "Industrial Smoke & Air Emissions",
        "Chemical Effluent Discharge",
        "Noise Pollution & Illegal Loudspeakers",
        "Water Body Plastic Pollution"
    ],
    "Parks & Public Spaces": [
        "Damaged Swings & Playground",
        "Park Lighting Outage",
        "Broken Benches & Boundary Wall",
        "Unmaintained Green Space"
    ],
    "Building & Municipal Engineering": [
        "Dangerous Dilapidated Building",
        "Structural Crack & Collapse Hazard",
        "Unauthorized / Illegal Construction",
        "Unsafe Scaffold / Site Hazard"
    ],
    "Land & Land Records": [
        "Encroachment on Govt Land",
        "Mutation Record Discrepancy",
        "Forged Land Deed / Fraudulent Sale",
        "Land Boundary Dispute"
    ],
    "Housing & Urban Development": [
        "Housing Scheme Disbursement Delay",
        "Slum Civic Infrastructure",
        "Affordable Housing Structural Defect",
        "Urban Colony Basic Amenities"
    ],
    "Electricity & Power": [
        "Transformer Sparking / Overheating",
        "Open Live Wire / Electrical Shock Risk",
        "Prolonged Power Blackout",
        "Frequent High Voltage Fluctuation",
        "Defective Electricity Meter"
    ],
    "Public Transport": [
        "Bus Route Cancellation / Absence",
        "Passenger Overcharging / Conductor Conduct",
        "Dilapidated Municipal Bus Condition",
        "Missing Bus Shelter"
    ],
    "Railway-related Public Complaints": [
        "Railway Station Approach Sanitation",
        "Station Platform Amenities Defect",
        "Dangerous Level Crossing Gate Delay",
        "Passenger Overhead Bridge Damage"
    ],
    "Health & Hospitals": [
        "Hospital Emergency Services Unavailable",
        "Shortage of Critical Medicine / Oxygen",
        "Hospital Medical Negligence Inquiry",
        "Primary Health Center Doctor Absence"
    ],
    "Food & Public Distribution": [
        "Ration Shop PDS Irregularity",
        "Adulterated / Rotten Food Grains",
        "Denial of Allocated Ration Card Grains",
        "Fair Price Shop Overcharging"
    ],
    "Consumer Affairs": [
        "Retailer Charging Above MRP",
        "Counterfeit Goods & False Advertising",
        "Warranty Refusal / Unfair Trade Practice",
        "Faulty Commercial Weighing Scales"
    ],
    "Education – Schools": [
        "School Building Urgent Repair / Roof Seepage",
        "Broken School Toilets & Drinking Water",
        "Mid-day Meal Quality Concern",
        "Classroom Furniture & Blackboard Damage"
    ],
    "Higher Education": [
        "University Examination Result Discrepancy",
        "College Campus Infrastructure Defect",
        "Degree Certificate Issuance Delay",
        "College Anti-Ragging Grievance"
    ],
    "Labour & Employment": [
        "Unpaid Worker Wages / Salary Withheld",
        "Workplace Fatality / Industrial Injury Compensation",
        "Violation of Minimum Wage Compliance",
        "Hazardous Workplace Without Safety Gear"
    ],
    "Agriculture": [
        "Irrigation Canal Water Siltation",
        "Defective Agricultural Tube-well",
        "Substandard Crop Seeds / Fertilizer",
        "Flood Crop Damage Compensation Claim"
    ],
    "Animal Resources": [
        "Stray Cattle & Livestock Road Obstruction",
        "Stray Dog Bite Menace & Rabies Drive",
        "Veterinary Clinic Doctor Absence",
        "Injured Animal Emergency Care"
    ],
    "Forest & Wildlife": [
        "Illegal Tree Cutting & Timber Smuggling",
        "Wild Animal Intrusion in Village",
        "Forest Boundary Encroachment",
        "Poaching / Wildlife Protection Violation"
    ],
    "Public Grievance / General Administration": [
        "Delay in Government Service Application",
        "Official Corruption / Bribe Solicitation",
        "Citizen Charter Timeline Non-Compliance",
        "Public Officer Unresponsiveness / Harassment"
    ]
}
