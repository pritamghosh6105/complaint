"""
CivicPulse AI — West Bengal Public Administration Verified Authority Mapping
Maps all 30 Canonical Complaint Categories to authentic, real-world public authorities in West Bengal.
Distinguishes State Government Departments, Directorates, Police Units, Municipal Corporations,
Panchayat Authorities, Public Utilities, and Central/Railway Bodies.
"""

from typing import Dict, List, Any

VERIFIED_WEST_BENGAL_AUTHORITIES: Dict[str, Dict[str, Any]] = {
    "Police & Law Enforcement": {
        "primary_authority": "West Bengal Police (Directorate of Police, Home & Hill Affairs Department)",
        "primary_type": "Police Force / Law Enforcement Unit",
        "secondary_authority": "Kolkata Police (within Kolkata jurisdiction) / Respective Police Commissionerate / CID West Bengal",
        "secondary_type": "Specialized Police Wing / Executive Magistrate",
        "nodal_officer": "Inspector In-Charge (I.C.) / Officer In-Charge (O.C.) of Local Police Station (Thana)",
        "escalation_authority": "Superintendent of Police (SP) / Commissioner of Police (CP) / Sub-Divisional Police Officer (SDPO)",
        "emergency_helpline": "112 / 100",
        "jurisdiction_notes": "Kolkata municipal area falls under Kolkata Police; remainder of state falls under West Bengal Police across 22 districts and 6 commissionerates."
    },
    "Cyber Crime": {
        "primary_authority": "Cyber Crime Police Station (CID West Bengal / District Cyber Cell)",
        "primary_type": "Specialized Law Enforcement Directorate",
        "secondary_authority": "National Cyber Crime Reporting Portal (1930 State Nodal Desk)",
        "secondary_type": "Central Financial Fraud Reporting Unit",
        "nodal_officer": "Nodal Cyber Crime Police Inspector / Digital Forensics Officer",
        "escalation_authority": "Special Superintendent of Police (Cyber Crime CID West Bengal)",
        "emergency_helpline": "1930",
        "jurisdiction_notes": "Handles online financial fraud, UPI siphoning, net banking compromise, phishing, impersonation, and digital harassment."
    },
    "Women & Child Safety": {
        "primary_authority": "Women Police Station / Dedicated Women Help Desk (West Bengal Police / Kolkata Police)",
        "primary_type": "Specialized Law Enforcement Wing",
        "secondary_authority": "Department of Women & Child Development and Social Welfare / West Bengal Commission for Protection of Child Rights",
        "secondary_type": "State Government Statutory Body & Welfare Directorate",
        "nodal_officer": "Officer In-Charge Women Police Station / Child Welfare Police Officer (CWPO)",
        "escalation_authority": "District Magistrate (Chairperson District Child Protection Unit) / SP (Crime Against Women Cell)",
        "emergency_helpline": "1090 (Women Helpline) / 1098 (Childline) / 112",
        "jurisdiction_notes": "Coordinates urgent victim protection, harassment redressal, child labour rescue, and domestic grievance intervention."
    },
    "Traffic & Road Safety": {
        "primary_authority": "Traffic Police Guard / District Traffic Wing (West Bengal Police / Kolkata Traffic Police)",
        "primary_type": "Traffic Enforcement Directorate",
        "secondary_authority": "Transport Department, Government of West Bengal (Regional Transport Authority - RTA / RTO)",
        "secondary_type": "State Administrative Department",
        "nodal_officer": "Traffic Inspector (TI) / Officer In-Charge Traffic Guard",
        "escalation_authority": "Deputy Commissioner of Police (Traffic) / Superintendent of Police (Traffic)",
        "emergency_helpline": "1073 / 112",
        "jurisdiction_notes": "Responsible for traffic signaling, junction congestion control, carriageway obstruction, accident investigation, and pedestrian crossing safety."
    },
    "Roads & Public Works": {
        "primary_authority": "Public Works Department (PWD - Roads Wing), Government of West Bengal",
        "primary_type": "State Infrastructure Department",
        "secondary_authority": "Concerned Municipal Corporation / Municipality (Urban Roads) OR Panchayats & Rural Development (Rural Roads / WBSRDA)",
        "secondary_type": "Urban Local Body (ULB) / Rural Local Body (RLB)",
        "nodal_officer": "Assistant Engineer (AE) / Executive Engineer (EE), PWD Roads Division",
        "escalation_authority": "Superintending Engineer (SE) / Chief Engineer (PWD Roads)",
        "emergency_helpline": "1800-345-0322",
        "jurisdiction_notes": "PWD handles State Highways and Major District Roads; municipal bodies manage municipal lanes; WBSRDA manages Gram Sadak rural roads."
    },
    "Drainage & Sewerage": {
        "primary_authority": "Municipal Corporation / Municipality Sewerage & Drainage Wing (Urban) OR Irrigation & Waterways Department (Canals / Outfalls)",
        "primary_type": "Urban Local Body / State Department",
        "secondary_authority": "Kolkata Metropolitan Development Authority (KMDA) / Public Health Engineering Department (PHED)",
        "secondary_type": "Regional Planning Authority / State Department",
        "nodal_officer": "Borough Executive Engineer (Drainage) / Sub-Divisional Officer (Irrigation)",
        "escalation_authority": "Municipal Commissioner / Chief Engineer (Irrigation & Waterways)",
        "emergency_helpline": "Local Civic Helpline / 1916",
        "jurisdiction_notes": "Responsible for subterranean storm water mains, sewer desilting, open manhole safety, monsoon waterlogging pumping, and culvert maintenance."
    },
    "Water Supply": {
        "primary_authority": "Public Health Engineering Department (PHED), Government of West Bengal (Rural & Semi-Urban)",
        "primary_type": "State Utility Department",
        "secondary_authority": "Municipal Water Supply Department (within Municipal Corporations & Municipalities)",
        "secondary_type": "Urban Local Body Utility Wing",
        "nodal_officer": "Assistant Engineer (PHED Sub-Division) / Municipal Water Works Superintendent",
        "escalation_authority": "Executive Engineer (PHED Division) / Member Mayor-in-Council (Water Supply)",
        "emergency_helpline": "1800-345-5654",
        "jurisdiction_notes": "Manages drinking water pipeline repairs, chlorination, water quality testing, deep tubewell maintenance, and emergency mobile tankers."
    },
    "Solid Waste Management": {
        "primary_authority": "Solid Waste Management / Conservancy Department of Local Municipal Corporation or Municipality (Urban)",
        "primary_type": "Urban Local Body Directorate",
        "secondary_authority": "Gram Panchayat / Block Development Office (Panchayats & Rural Development Department - Rural)",
        "secondary_type": "Rural Local Body Administrative Tier",
        "nodal_officer": "Sanitary Inspector (SI) / Conservancy Supervisor",
        "escalation_authority": "Chief Municipal Health Officer / Executive Officer (Municipality) / BDO (Rural)",
        "emergency_helpline": "Municipal Citizen Helpline",
        "jurisdiction_notes": "Responsible for municipal bin clearing, open dump remediation, carcass disposal, door-to-door collection, and bio-waste compliance."
    },
    "Street Lighting & Electrical": {
        "primary_authority": "Electrical Engineering Department of Municipal Corporation / Municipality / Gram Panchayat",
        "primary_type": "Local Body Engineering Cell",
        "secondary_authority": "West Bengal State Electricity Distribution Company Limited (WBSEDCL) / CESC Limited (Kolkata/Howrah/Hooghly)",
        "secondary_type": "State Power Distribution Utility / Licensed Private Utility",
        "nodal_officer": "Assistant Engineer (Electrical) / Station Manager (WBSEDCL Customer Care Centre)",
        "escalation_authority": "Divisional Engineer (WBSEDCL) / Municipal Borough Executive",
        "emergency_helpline": "19121 (WBSEDCL) / 1912 (CESC)",
        "jurisdiction_notes": "Streetlights and high-mast towers are maintained by civic bodies; power supply feeders and transformers are operated by WBSEDCL or CESC."
    },
    "Public Health & Sanitation": {
        "primary_authority": "Department of Health & Family Welfare (Vector Control & Public Health Wing), Government of West Bengal",
        "primary_type": "State Public Health Directorate",
        "secondary_authority": "Municipal Health Department / Block Primary Health Centre (BPHC)",
        "secondary_type": "Civic Health Directorate / Rural Health Unit",
        "nodal_officer": "Borough Medical Officer of Health (BMOH) / Block Medical Officer of Health (BMOH)",
        "escalation_authority": "Chief Medical Officer of Health (CMOH) of District",
        "emergency_helpline": "1800-345-3261",
        "jurisdiction_notes": "Covers dengue vector control, larvicide fogging, public toilet sanitation, epidemic surveillance, and waterborne disease outbreaks."
    },
    "Fire & Emergency Services": {
        "primary_authority": "West Bengal Fire & Emergency Services Directorate (WBFES)",
        "primary_type": "Emergency Response Directorate",
        "secondary_authority": "Disaster Management & Civil Defence Department / Local Police Station",
        "secondary_type": "Disaster Coordination Body / Law Enforcement",
        "nodal_officer": "Station Officer (SO) / Divisional Fire Officer (DFO)",
        "escalation_authority": "Director General of Fire Services, West Bengal",
        "emergency_helpline": "101 / 112",
        "jurisdiction_notes": "Immediate deployment for structural blazes, LPG leakage, transformer fire, industrial explosion, chemical hazards, and building rescue."
    },
    "Disaster Management": {
        "primary_authority": "Department of Disaster Management & Civil Defence, Government of West Bengal",
        "primary_type": "State Disaster Management Directorate",
        "secondary_authority": "District Disaster Management Authority (DDMA chaired by District Magistrate) / State Disaster Response Force (SDRF)",
        "secondary_type": "District Statutory Authority / Specialized Rescue Unit",
        "nodal_officer": "District Disaster Management Officer (DDMO) / Sub-Divisional Disaster Management Officer",
        "escalation_authority": "District Magistrate & District Collector / Principal Secretary (Disaster Management)",
        "emergency_helpline": "1070 (State Emergency Operations Centre) / 1077 (District EOC)",
        "jurisdiction_notes": "Handles cyclonic storm damage, riverbank embankment breach, flood inundation, major structural collapse rescue, and relief distribution."
    },
    "Environment & Pollution": {
        "primary_authority": "West Bengal Pollution Control Board (WBPCB), Department of Environment",
        "primary_type": "State Statutory Pollution Control Regulator",
        "secondary_authority": "District Magistrate (Environment Monitoring Cell) / Local Police / Urban Local Body",
        "secondary_type": "District Administrative Directorate",
        "nodal_officer": "Environmental Engineer / Regional Officer (WBPCB Regional Office)",
        "escalation_authority": "Member Secretary, West Bengal Pollution Control Board",
        "emergency_helpline": "1800-345-3390",
        "jurisdiction_notes": "Industrial effluent discharge, hazardous black smoke, decibel limit violations (loudspeakers/DJ), construction dust, and canal contamination."
    },
    "Parks & Public Spaces": {
        "primary_authority": "Parks & Gardens Department of Municipal Corporation / Municipality",
        "primary_type": "Urban Local Body Directorate",
        "secondary_authority": "Kolkata Metropolitan Development Authority (KMDA) / Urban Development & Municipal Affairs Department",
        "secondary_type": "State Urban Development Agency",
        "nodal_officer": "Superintendent of Parks & Gardens / Assistant Horticultural Officer",
        "escalation_authority": "Member Mayor-in-Council (Parks & Gardens) / Executive Officer",
        "emergency_helpline": "Local Municipal Control Room",
        "jurisdiction_notes": "Maintains community parks, children play swings, open gym installations, lake perimeters, park lighting, and public garden walkways."
    },
    "Building & Municipal Engineering": {
        "primary_authority": "Building Department of Municipal Corporation / Municipality / Municipal Engineering Directorate (MED)",
        "primary_type": "Urban Local Body Statutory Regulatory Directorate",
        "secondary_authority": "Urban Development & Municipal Affairs Department, Government of West Bengal",
        "secondary_type": "State Administrative Department",
        "nodal_officer": "Executive Engineer (Building) / Municipal Borough Surveyor",
        "escalation_authority": "Chief Municipal Building Architect / Municipal Commissioner",
        "emergency_helpline": "Municipal Building Department Grievance Cell",
        "jurisdiction_notes": "Handles unauthorized / illegal floor additions, dangerous dilapidated masonry collapse hazards, building plan deviations, and unsafe foundation excavation."
    },
    "Land & Land Records": {
        "primary_authority": "Land & Land Reforms and Refugee Relief & Rehabilitation Department, Government of West Bengal",
        "primary_type": "State Revenue & Land Records Directorate",
        "secondary_authority": "Directorate of Land Records & Surveys (DLR&S) / Sub-Divisional Officer (SDO)",
        "secondary_type": "State Survey Directorate / Sub-Divisional Magistrate",
        "nodal_officer": "Block Land & Land Reforms Officer (BL&LRO)",
        "escalation_authority": "District Land & Land Reforms Officer (DL&LRO) / Additional District Magistrate (LR)",
        "emergency_helpline": "1800-345-6655 (Banglarbhumi Portal Helpline)",
        "jurisdiction_notes": "RoR / Khatian correction, mutation delay grievances, unauthorized filling of water bodies/ponds, demarcation disputes, and encroachment on vested land."
    },
    "Housing & Urban Development": {
        "primary_authority": "Urban Development and Municipal Affairs (UD&MA) Department, Government of West Bengal",
        "primary_type": "State Urban Planning & Housing Department",
        "secondary_authority": "West Bengal Housing Board / State Urban Development Agency (SUDA) / WBHIDCO",
        "secondary_type": "State Development Authority / Housing Agency",
        "nodal_officer": "Executive Engineer (Housing) / Project Director (SUDA)",
        "escalation_authority": "Principal Secretary (UD&MA) / Housing Commissioner",
        "emergency_helpline": "1800-120-8182",
        "jurisdiction_notes": "Housing scheme delays, municipal infrastructure development projects, slum rehabilitation amenities, and urban township public facilities."
    },
    "Electricity & Power": {
        "primary_authority": "West Bengal State Electricity Distribution Company Limited (WBSEDCL)",
        "primary_type": "State Power Distribution Public Sector Undertaking",
        "secondary_authority": "CESC Limited (within Kolkata, Howrah, and parts of Hooghly) / Department of Power, Government of West Bengal",
        "secondary_type": "Licensed Private Power Utility / State Administrative Department",
        "nodal_officer": "Station Manager (Customer Care Centre) / Assistant Engineer (Distribution)",
        "escalation_authority": "Divisional Manager (WBSEDCL Division) / Regional Manager",
        "emergency_helpline": "19121 (WBSEDCL) / 1912 (CESC)",
        "jurisdiction_notes": "Handles power blackout restoration, distribution transformer failure, sagging high-tension wires, electricity billing discrepancies, and meter burnt faults."
    },
    "Public Transport": {
        "primary_authority": "Transport Department, Government of West Bengal / State Transport Undertakings (WBTC, SBSTC, NBSTC)",
        "primary_type": "State Transport Undertaking / Directorate",
        "secondary_authority": "Regional Transport Authority (RTA / RTO) / Traffic Police",
        "secondary_type": "District Transport Regulatory Office",
        "nodal_officer": "Depot In-Charge / Regional Transport Officer (RTO)",
        "escalation_authority": "Managing Director (WBTC / SBSTC / NBSTC) / Transport Commissioner",
        "emergency_helpline": "1800-345-3972",
        "jurisdiction_notes": "State bus schedule irregularity, auto-rickshaw fare gouging, bus stop infrastructure maintenance, public vehicle permit compliance, and driver misconduct."
    },
    "Railway-related Public Complaints": {
        "primary_authority": "Indian Railways (Eastern Railway / South Eastern Railway / Northeast Frontier Railway / Metro Railway Kolkata)",
        "primary_type": "Central Railway Zonal Administration",
        "secondary_authority": "Government Railway Police (GRP West Bengal Police) / Railway Protection Force (RPF)",
        "secondary_type": "State Railway Police / Central Railway Security Force",
        "nodal_officer": "Station Master / Commercial Inspector / GRP Thana In-Charge",
        "escalation_authority": "Divisional Railway Manager (DRM - Howrah, Sealdah, Asansol, Malda, Kharagpur, Alipurduar)",
        "emergency_helpline": "139 (RailMadad) / 182",
        "jurisdiction_notes": "Suburban train platform sanitation, station ticket counter delays, foot overbridge hazards, level crossing gate delays, and passenger grievance redressal."
    },
    "Health & Hospitals": {
        "primary_authority": "Department of Health & Family Welfare, Government of West Bengal",
        "primary_type": "State Healthcare Directorate",
        "secondary_authority": "Office of Chief Medical Officer of Health (CMOH) / Medical College & Hospital Superintendent",
        "secondary_type": "District Healthcare Administration / Tertiary Hospital Authority",
        "nodal_officer": "Hospital Superintendent / Block Medical Officer of Health (BMOH)",
        "escalation_authority": "Chief Medical Officer of Health (CMOH) / Director of Health Services (DHS)",
        "emergency_helpline": "1800-345-3261 / 102 (Ambulance)",
        "jurisdiction_notes": "Government hospital emergency counter delays, essential medicine stock-outs, diagnostic machine breakdown, Swasthya Sathi denial, and patient ward hygiene."
    },
    "Food & Public Distribution": {
        "primary_authority": "Department of Food and Supplies, Government of West Bengal",
        "primary_type": "State Public Distribution System (PDS) Directorate",
        "secondary_authority": "Directorate of District Distribution, Procurement and Supply (DDP&S)",
        "secondary_type": "Field Distribution Directorate",
        "nodal_officer": "Inspector of Food & Supplies / Sub-Divisional Controller of Food & Supplies (SCFS)",
        "escalation_authority": "District Controller of Food & Supplies (DCFS) / Director of DDP&S",
        "emergency_helpline": "1800-345-5505 / 1967",
        "jurisdiction_notes": "Fair Price Shop (FPS / Ration shop) irregularities, Khadya Sathi digital ration card corrections, diversion of subsidised foodgrains, and weighing scale fraud."
    },
    "Consumer Affairs": {
        "primary_authority": "Department of Consumer Affairs, Government of West Bengal",
        "primary_type": "State Consumer Protection Directorate",
        "secondary_authority": "Directorate of Legal Metrology / District Consumer Disputes Redressal Commission (DCDRC)",
        "secondary_type": "Weights & Measures Enforcement Wing / Statutory Commission",
        "nodal_officer": "Assistant Director (Consumer Affairs) / Inspector of Legal Metrology",
        "escalation_authority": "President, District Consumer Commission / Director of Consumer Affairs",
        "emergency_helpline": "1800-345-2808",
        "jurisdiction_notes": "Product MRP tampering, deceptive commercial advertising, defective consumer goods warranty denial, underweight packaging, and service contract deficiency."
    },
    "Education – Schools": {
        "primary_authority": "School Education Department, Government of West Bengal",
        "primary_type": "State School Education Directorate",
        "secondary_authority": "West Bengal Board of Secondary Education (WBBSE) / West Bengal Board of Primary Education (WBBPE)",
        "secondary_type": "State Autonomous Educational Boards",
        "nodal_officer": "District Inspector of Schools (DI of Schools - Secondary / Primary) / Sub-Inspector (SI) of Schools at Circle",
        "escalation_authority": "Commissioner of School Education / District Magistrate (Chairperson Sarva Shiksha Mission)",
        "emergency_helpline": "1800-345-6677",
        "jurisdiction_notes": "Government school infrastructure damage, Mid-Day Meal quality and safety, teacher absenteeism, classroom building safety, and admission irregularities."
    },
    "Higher Education": {
        "primary_authority": "Department of Higher Education, Government of West Bengal",
        "primary_type": "State Higher Education Directorate",
        "secondary_authority": "West Bengal State Council of Higher Education / Concerned University Registrar & Vice-Chancellor",
        "secondary_type": "State Higher Education Advisory Body / University Administration",
        "nodal_officer": "College Principal / University Registrar / Joint Director of Public Instruction (DPI)",
        "escalation_authority": "Director of Public Instruction (DPI) / Vice-Chancellor / Principal Secretary (Higher Education)",
        "emergency_helpline": "1800-102-8014",
        "jurisdiction_notes": "College hostel amenities, scholarship disbursal delays (SVMCM), university examination certificate backlog, campus safety, and library facilities."
    },
    "Labour & Employment": {
        "primary_authority": "Labour Department, Government of West Bengal (Labour Commissionerate)",
        "primary_type": "State Labour Regulatory Directorate",
        "secondary_authority": "Directorate of Factories / Directorate of Employment / ESI Directorate",
        "secondary_type": "Industrial Safety & Social Security Directorates",
        "nodal_officer": "Assistant Labour Commissioner (ALC) / Minimum Wages Inspector",
        "escalation_authority": "Deputy Labour Commissioner / Labour Commissioner, Government of West Bengal",
        "emergency_helpline": "1800-103-0009",
        "jurisdiction_notes": "Unpaid minimum wages, non-payment of construction cess benefits, industrial factory floor hazards, child labour rescue, and gratuity settlement disputes."
    },
    "Agriculture": {
        "primary_authority": "Department of Agriculture, Government of West Bengal (Directorate of Agriculture)",
        "primary_type": "State Agricultural Directorate",
        "secondary_authority": "Agricultural Marketing Department / Water Resources Investigation & Development Department (Irrigation)",
        "secondary_type": "State Directorate / Minor Irrigation Utility",
        "nodal_officer": "Assistant Director of Agriculture (ADA) at Block / Krishi Prajukti Sahayak (KPS) at Gram Panchayat",
        "escalation_authority": "Deputy Director of Agriculture (DDA) of District / Director of Agriculture",
        "emergency_helpline": "1800-180-1551 (Kisan Call Centre)",
        "jurisdiction_notes": "Crop damage assessment, Bangla Shasya Bima (BSB) compensation delays, canal irrigation water availability, adulterated fertilizer supply, and seeds procurement."
    },
    "Animal Resources": {
        "primary_authority": "Animal Resources Development (ARD) Department, Government of West Bengal",
        "primary_type": "State Veterinary Directorate",
        "secondary_authority": "Directorate of Animal Husbandry & Veterinary Services",
        "secondary_type": "Veterinary Field Directorate",
        "nodal_officer": "Block Animal Development Officer (BADO) / Veterinary Officer (BLDO)",
        "escalation_authority": "Deputy Director (ARD) of District / Director of Animal Husbandry",
        "emergency_helpline": "1800-345-5555",
        "jurisdiction_notes": "Livestock disease epidemic outbreaks, cattle vaccination delays, State Veterinary Hospital shortages, poultry epidemic intervention, and artificial insemination services."
    },
    "Forest & Wildlife": {
        "primary_authority": "Department of Forests, Government of West Bengal (Directorate of Forests)",
        "primary_type": "State Forestry & Wildlife Directorate",
        "secondary_authority": "Wildlife Division (Principal Chief Conservator of Forests - PCCF Wildlife)",
        "secondary_type": "Specialized Wildlife Directorate",
        "nodal_officer": "Range Forest Officer (RFO) / Beat Officer (BO)",
        "escalation_authority": "Divisional Forest Officer (DFO) / Chief Conservator of Forests (CCF)",
        "emergency_helpline": "1800-345-3862",
        "jurisdiction_notes": "Wild elephant/animal crop depredation, human-wildlife conflict intervention, fallen forest timber blocking roads, illegal tree felling, and tiger/leopard straying."
    },
    "Public Grievance / General Administration": {
        "primary_authority": "Personnel & Administrative Reforms Department (P&AR), Government of West Bengal",
        "primary_type": "State General Administration Department",
        "secondary_authority": "Chief Minister's Office Grievance Redressal Cell / District Magistrate & Collector (District Grievance Cell)",
        "secondary_type": "Apex State Grievance Redressal Directorate",
        "nodal_officer": "Nodal Grievance Redressal Officer / Deputy Magistrate & Deputy Collector (DM&DC)",
        "escalation_authority": "Additional District Magistrate (General) / District Magistrate & Collector",
        "emergency_helpline": "1800-345-5555",
        "jurisdiction_notes": "Cross-departmental citizen grievances, government office delay, caste certificate / domicile certificate backlog, public servant misconduct, and pension delays."
    }
}

def get_authority_for_category(category: str) -> Dict[str, Any]:
    """Returns the verified primary and secondary authority mapping for any canonical category."""
    clean_cat = category.strip()
    if clean_cat in VERIFIED_WEST_BENGAL_AUTHORITIES:
        return VERIFIED_WEST_BENGAL_AUTHORITIES[clean_cat]
    # Check normalized aliases
    from src.prediction.taxonomy_constants import DEPARTMENT_NAME_NORMALIZATION
    norm = DEPARTMENT_NAME_NORMALIZATION.get(clean_cat)
    if norm and norm in VERIFIED_WEST_BENGAL_AUTHORITIES:
        return VERIFIED_WEST_BENGAL_AUTHORITIES[norm]
    # Default fallback
    return VERIFIED_WEST_BENGAL_AUTHORITIES["Public Grievance / General Administration"]
