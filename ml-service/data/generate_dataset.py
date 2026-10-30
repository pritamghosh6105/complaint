"""
CivicPulse AI — Synthetic Dataset Generator for All 30 Canonical Departments
Generates balanced, diverse, high-quality complaints in English only.
Includes contrast cases, fatal incident variations, executive summaries, and multi-department relationships.
"""

import os
import sys
import random
import json
import pandas as pd
import numpy as np

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure parent directory is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(current_dir, "..")))

from src.prediction.taxonomy_constants import (
    CANONICAL_30_DEPARTMENTS,
    DEPARTMENT_SUBCATEGORIES
)

random.seed(42)
np.random.seed(42)

BASE_LAT = 22.9750
BASE_LNG = 88.4340

STREETS = [
    "Station Road", "Gandhi Marg", "Netaji Subhash Avenue", "Market Bypass",
    "Hospital Road", "College Street", "Lake View Road", "Industrial Estate Road",
    "School Lane", "Temple Road", "Old Court Road", "Railway Colony Road",
    "Bazaar Street", "Ring Road", "Kalyani Highway", "Barrackpore Trunk Road",
    "Kabi Nazrul Sarani", "Rabindra Path", "Shanti Nagar Main Road", "Green Park Avenue"
]

LANDMARKS = [
    "City Central Station", "General Hospital Gate #2", "Municipal Market",
    "Government Girls High School", "Clock Tower Crossing", "Post Office Square",
    "Public Library", "Kalyani Stadium", "Bus Terminus", "Sub-Divisional Court",
    "Community Health Center", "Industrial Park Gate #1", "Children's Park",
    "Water Tank #4", "Electricity Substation", "Town Hall Complex"
]

LOCATION_TYPES = ["Residential", "Commercial", "Industrial", "School", "Hospital", "Highway", "Market", "Slum Area", "Public Park"]

# Detailed Templates for All 30 Canonical Departments
DEPARTMENT_TEMPLATES = {
    "Police & Law Enforcement": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Police & Law Enforcement"],
        "is_crime": 1,
        "base_res_days": 1.5,
        "samples": [
            # Fatal incidents with unknown/unspecified cause or criminal investigation
            ("Death Investigation / Suspicious or Unexplained Death (pending verification)",
             "One Man Is Killed — Complaint. Executive Summary: A fatal incident has occurred resulting in the death of one individual. The complainant seeks an official inquiry and appropriate action from the relevant authorities. Physical Realities: The incident took place at an unspecified location within the municipal jurisdiction. Details regarding the exact site, surrounding environment, and circumstances remain limited. Life Safety Risk: The incident resulted in the loss of a life. There is no indication of an ongoing safety hazard or immediate threat to the public at present. Citizen Impact and Appeal: The complainant requests that municipal police or the appropriate law-enforcement department conduct a thorough investigation, issue an official report, and take necessary measures to ensure accountability.",
             "One Man Is Killed — Complaint", "HIGH", "High", "en", "Fatal Incident / Death", False, [], True),

            ("Death Investigation / Suspicious or Unexplained Death (pending verification)",
             "A dead body was found near {landmark} this morning with mysterious circumstances. Complainant requests that the police register an unnatural death case and start an immediate formal inquiry.",
             "Unexplained Dead Body Discovered Near {landmark}", "HIGH", "High", "en", "Fatal Incident / Death", False, [], True),

            ("Death Investigation / Suspicious or Unexplained Death (pending verification)",
             "An individual was found deceased under unexplained circumstances near {street}. The exact cause of death remains undetermined and no obvious weapon was located. We formally request the local police station to initiate an official inquest and investigation.",
             "Unexplained Fatality and Police Inquest Request on {street}", "HIGH", "High", "en", "Fatal Incident / Death", False, [], True),

            ("Death Investigation / Suspicious or Unexplained Death (pending verification)",
             "Unidentified deceased person discovered close to {landmark} under mysterious conditions. Local residents report no prior dispute. Requesting the police department to register an unnatural death report and conduct a forensic examination.",
             "Unnatural Death Inquiry and Forensic Investigation Request", "HIGH", "High", "en", "Fatal Incident / Death", False, [], True),

            ("Theft / Burglary",
             "Burglars broke into a locked residential flat near {street} last night and decamped with cash and valuables. Complainant demands police patrolling and registration of an FIR.",
             "Residential Flat Burglary on {street}", "MEDIUM", "Medium", "en", "Theft / Property Crime", True, [], False),

            ("Theft / Burglary",
             "A retail grocery shop near {street} was broken into late last night. The shutter lock was severed, cash drawer emptied, and store inventory stolen. Requesting police fingerprint inspection and case registration.",
             "Commercial Shop Break-in and Burglary on {street}", "MEDIUM", "Medium", "en", "Theft / Property Crime", True, [], False),

            ("Physical Assault",
             "A group of miscreants violently assaulted a shopkeeper on {street} causing grievous head injuries. Urgent police intervention and arrest of culprits requested.",
             "Violent Physical Assault on Shopkeeper", "HIGH", "High", "en", "Physical Violence / Assault", True, [], False),

            ("Physical Assault",
             "An active violent altercation with sharp weapons is unfolding right now near {street}. Several citizens have sustained injuries. Immediate emergency police force dispatch requested!",
             "Active Violent Assault and Emergency Police Dispatch Request", "CRITICAL", "Critical", "en", "Physical Violence / Assault", True, [], False),

            ("Robbery / Armed Snatching",
             "Armed motorcycle snatchers snatched gold chain at gunpoint near {landmark}. Residents request permanent police picket.",
             "Armed Snatching Incident Near {landmark}", "HIGH", "High", "en", "Theft / Property Crime", True, [], False),

            ("Missing Person Report",
             "A 14-year-old child has gone missing since yesterday afternoon from {street}. Family requests urgent police search operation.",
             "Missing Child Search Request", "HIGH", "High", "en", "Missing Person", True, [], True),

            ("Public Violence / Rioting",
             "Clash between rival groups near {street} causing stone pelting and vandalism of public property. Immediate police deployment needed.",
             "Public Clash and Property Vandalism", "CRITICAL", "Critical", "en", "Physical Violence / Assault", True, [], False)
        ]
    },

    "Cyber Crime": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Cyber Crime"],
        "is_crime": 1,
        "base_res_days": 2.0,
        "samples": [
            ("UPI / Payment Gateway Fraud",
             "Unauthorized debit of ₹35,000 from savings account via fraudulent UPI payment request after receiving fake electricity bill notice.",
             "Unauthorized UPI Transaction Debit ₹35,000", "HIGH", "High", "en", "Cyber / Financial Fraud", True, [], False),

            ("UPI / Payment Gateway Fraud",
             "Complainant was deceived by an impersonation text message leading to an unauthorized UPI transfer of ₹20,000 to an unknown account. Requesting cyber crime cell to freeze fraudulent transactions.",
             "Unauthorized UPI Transfer via Social Engineering Scam", "HIGH", "High", "en", "Cyber / Financial Fraud", True, [], False),

            ("Net Banking Fraud",
             "Account compromised and ₹80,000 transferred through net banking without OTP verification. Complainant requests cyber nodal officer intervention.",
             "Net Banking Compromise and Fund Siphoning", "HIGH", "High", "en", "Cyber / Financial Fraud", True, [], False),

            ("Phishing / Scam Calls",
             "Scammers posing as bank managers calling senior citizens on {street} asking for debit card CVV and OTP.",
             "Fraudulent Banking Phishing Calls", "MEDIUM", "Medium", "en", "Cyber / Financial Fraud", True, [], False),

            ("Phishing / Scam Calls",
             "Citizen received deceptive phone calls pretending to be bank customer support asking for card details and OTP. Unauthorized net banking login attempted. Requesting cyber crime investigation.",
             "Deceptive Bank Impersonation and Phishing Attempt", "MEDIUM", "Medium", "en", "Cyber / Financial Fraud", True, [], False),

            ("Account Hacking / Unauthorized Access",
             "Someone hacked my email and social media profile, sending threatening and defamatory messages to contacts.",
             "Hacked Social Media Profile and Extortion", "HIGH", "High", "en", "Cyber Harassment", True, [], False),

            ("Identity Theft / Loan Impersonation",
             "Fraudsters forged my PAN card and Aadhaar details to take a fraudulent digital instant loan in my name.",
             "Identity Theft and Fraudulent Digital Loan", "HIGH", "High", "en", "Cyber / Financial Fraud", True, [], False)
        ]
    },

    "Women & Child Safety": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Women & Child Safety"],
        "is_crime": 1,
        "base_res_days": 1.0,
        "samples": [
            ("Street Harassment / Eve Teasing",
             "Female students returning from college are repeatedly being followed, harassed, and subjected to lewd remarks near {landmark}.",
             "Repeated Harassment of Women Near {landmark}", "HIGH", "High", "en", "Women & Child Safety / Harassment", True, ["Police & Law Enforcement"], False),

            ("Street Harassment / Eve Teasing",
             "Female students and working women returning home near {street} are repeatedly subjected to vulgar remarks and stalking every evening. Requesting deployment of women police patrol team.",
             "Persistent Street Harassment and Stalking on {street}", "HIGH", "High", "en", "Women & Child Safety / Harassment", True, ["Police & Law Enforcement"], False),

            ("Stalking & Threat",
             "A woman is continuously being stalked and threatened on her daily transit route along {street}. Immediate safety protection sought.",
             "Continuous Stalking and Threat to Safety", "HIGH", "High", "en", "Women & Child Safety / Harassment", True, ["Police & Law Enforcement"], False),

            ("Child Abuse / Child Labour",
             "Minor child being subjected to hazardous physical labor and beatings inside a commercial garage near {street}. Urgent child welfare rescue required.",
             "Child Labor and Physical Abuse Rescue Request", "CRITICAL", "Critical", "en", "Child Welfare / Abuse", True, ["Police & Law Enforcement"], True),

            ("Unsafe Corridor / Transit Hazard",
             "The dark walking underpass near {landmark} has zero illumination and has become extremely unsafe for women commuters after 7 PM.",
             "Unsafe Transit Corridor for Women", "HIGH", "High", "en", "Safety Hazard", True, ["Street Lighting & Electrical"], False)
        ]
    },

    "Traffic & Road Safety": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Traffic & Road Safety"],
        "is_crime": 0,
        "base_res_days": 1.5,
        "samples": [
            # Fatal collision contrast case
            ("Fatal Vehicle Collision",
             "A severe road crash between a speeding dumper truck and a motorcycle occurred on {street}. One rider died on the spot due to impact. Complainant reports collision and requests traffic police enforcement.",
             "Fatal Road Collision Between Truck and Bike on {street}", "HIGH", "High", "en", "Traffic Safety / Collision", True, ["Police & Law Enforcement"], True),

            ("Fatal Vehicle Collision",
             "A fatal vehicular collision occurred on {street} when a speeding commercial lorry struck a pedestrian. The victim was pronounced dead on scene. Requesting traffic department investigation into signal violation.",
             "Fatal Pedestrian Collision on {street}", "HIGH", "High", "en", "Traffic Safety / Collision", True, ["Police & Law Enforcement"], True),

            ("Dangerous / Rash Driving",
             "Buses and heavy container trucks overspeeding recklessly along {street} causing near-fatal collisions every day. Speed radar requested.",
             "Reckless Heavy Vehicle Speeding on {street}", "HIGH", "High", "en", "Traffic Violation", True, [], False),

            ("Traffic Signal Failure",
             "Traffic signal lights completely non-functional at {landmark} intersection for three days, causing dangerous gridlocks and accidents.",
             "Defective Traffic Signals at Major Junction", "MEDIUM", "Medium", "en", "Signal Failure", True, [], False),

            ("Illegal / Obstructive Parking",
             "Commercial vehicles parked on both sides of {street} blocking emergency ambulances and causing total gridlock.",
             "Obstructive Commercial Parking Blocking Road", "MEDIUM", "Medium", "en", "Illegal Parking", True, [], False),

            ("Missing Road Signage / Zebra Crossing",
             "Pedestrian zebra crossing markings and school zone warning signboards are missing outside {landmark}.",
             "Missing Pedestrian Crossing Signage", "LOW", "Low", "en", "Road Safety Signage", True, [], False)
        ]
    },

    "Roads & Public Works": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Roads & Public Works"],
        "is_crime": 0,
        "base_res_days": 3.0,
        "samples": [
            ("Pothole / Surface Crater",
             "Massive deep potholes on {street} have damaged multiple vehicles and two-wheeler tires. Road resurfacing and bitumen leveling urgently needed.",
             "Large Dangerous Potholes on Main Road", "MEDIUM", "Medium", "en", "Road / Infrastructure Surface Damage", True, [], False),

            ("Pothole / Surface Crater",
             "Multiple severe potholes across a 200-meter stretch of {street} have already caused several two-wheeler falls and axle damage. Immediate road resurfacing needed.",
             "Severe Pothole Cluster and Road Surface Damage on {street}", "MEDIUM", "Medium", "en", "Road / Infrastructure Surface Damage", True, [], False),

            ("Road Cave-in / Sinkhole",
             "Large sinkhole caved in on {street} after heavy rainfall. Carriageway is collapsing and needs emergency barricading and civil works reconstruction.",
             "Carriageway Cave-in and Sinkhole Hazard", "HIGH", "High", "en", "Road / Infrastructure Surface Damage", True, [], False),

            ("Broken / Eroded Road",
             "Entire tarmac surface of {street} has eroded away leaving exposed sharp boulders and rubble. Road completely unmotorable.",
             "Eroded Road Surface Requiring Reconstruction", "MEDIUM", "Medium", "en", "Road / Infrastructure Surface Damage", True, [], False),

            ("Damaged Bridge / Flyover",
             "Expansion joints on {landmark} flyover have cracked with concrete chunks peeling off. Structural civil engineering inspection needed.",
             "Damaged Expansion Joint on Flyover", "HIGH", "High", "en", "Infrastructure Defect", True, [], False),

            ("Broken Divider / Railing",
             "Crash barrier median divider knocked down on {street}. Twisted iron railings protruding into traffic lane.",
             "Broken Road Divider Railing Hazard", "LOW", "Low", "en", "Road Infrastructure", True, [], False)
        ]
    },

    "Drainage & Sewerage": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Drainage & Sewerage"],
        "is_crime": 0,
        "base_res_days": 2.0,
        "samples": [
            ("Open / Missing Manhole Cover",
             "A deep drainage manhole cover is broken and missing on {street} right in front of {landmark}. Poses grave risk of citizens falling in.",
             "Open Missing Manhole Cover on Pedestrian Path", "HIGH", "High", "en", "Drainage / Sewerage Hazard", True, [], False),

            ("Open / Missing Manhole Cover",
             "An uncovered stormwater manhole on {street} poses severe risk to nighttime motorists and pedestrians. Heavy rain is filling it with murky water. Urgent cover installation requested.",
             "Dangerous Uncovered Manhole on {street}", "HIGH", "High", "en", "Drainage / Sewerage Hazard", True, [], False),

            ("Sewage Water Overflow",
             "Underground sewage pipeline choked and black foul-smelling sewer water overflowing onto {street} entering ground floor houses.",
             "Foul Sewage Overflow on Residential Street", "HIGH", "High", "en", "Sewerage Hazard", True, ["Public Health & Sanitation"], False),

            ("Blocked / Clogged Drain",
             "Storm water drain choked with plastic debris near {landmark}, causing water stagnation and unbearable stench.",
             "Choked Stormwater Drain Requiring Jetting", "MEDIUM", "Medium", "en", "Drain Blockage", True, [], False),

            ("Monsoon Waterlogging",
             "Severe waterlogging of two feet knee-deep dirty water on {street} for four days after monsoon rain due to lack of drainage slope.",
             "Severe Street Waterlogging Due to Choked Drains", "MEDIUM", "Medium", "en", "Waterlogging", True, [], False)
        ]
    },

    "Water Supply": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Water Supply"],
        "is_crime": 0,
        "base_res_days": 2.0,
        "samples": [
            ("Pipeline Burst / Leakage",
             "Main drinking water distribution pipeline burst under {street}, wasting thousands of liters of treated water and flooding road.",
             "Drinking Water Mains Pipe Burst", "HIGH", "High", "en", "Water Supply Defect", True, [], False),

            ("Contaminated / Muddy Drinking Water",
             "Municipal tap water supplied to households on {street} is yellow, muddy, and smelling of drainage seepage. Unfit for consumption.",
             "Muddy and Contaminated Drinking Water Supply", "HIGH", "High", "en", "Water Contamination", True, ["Public Health & Sanitation"], False),

            ("Contaminated / Muddy Drinking Water",
             "Municipal piped drinking water in {street} has been coming out brown and foul-smelling for the past four days. Several households report gastrointestinal illness.",
             "Severely Contaminated Municipal Drinking Water on {street}", "HIGH", "High", "en", "Water Contamination", True, ["Public Health & Sanitation"], False),

            ("Low Water Pressure / No Supply",
             "No municipal drinking water supply in {street} for the past three consecutive days. Residents requesting emergency water tankers.",
             "Zero Water Supply in Residential Ward", "HIGH", "High", "en", "Water Scarcity", True, [], False),

            ("Broken Public Tap / Standpost",
             "Public roadside drinking water standpost tap broken off near {landmark}, water continuously gushing onto pavement.",
             "Broken Public Standpost Water Tap", "LOW", "Low", "en", "Water Waste", True, [], False)
        ]
    },

    "Solid Waste Management": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Solid Waste Management"],
        "is_crime": 0,
        "base_res_days": 1.5,
        "samples": [
            ("Overflowing Garbage Vat / Bin",
             "Community garbage vat on {street} overflowing with tons of uncollected solid waste onto road, attracting stray dogs and flies.",
             "Overflowing Garbage Vat on {street}", "MEDIUM", "Medium", "en", "Solid Waste Accumulation", True, [], False),

            ("Overflowing Garbage Vat / Bin",
             "Community waste container at {street} has not been cleared for over five days. Rotting garbage is spilling onto the road, emitting sickening stench and attracting stray animals.",
             "Overflowing Garbage Container and Stagnant Waste on {street}", "MEDIUM", "Medium", "en", "Solid Waste Accumulation", True, [], False),

            ("Illegal Open Waste Dumping",
             "Commercial market vendors illegally dumping rotting vegetable and poultry waste on open public land near {landmark}.",
             "Illegal Commercial Waste Dumping", "MEDIUM", "Medium", "en", "Illegal Dumping", True, [], False),

            ("Missed Door-to-Door Collection",
             "Waste collection compactor vehicle has not visited {street} for the past five days. Households forced to store waste.",
             "Missed Door-to-Door Waste Collection", "LOW", "Low", "en", "Waste Collection Delay", True, [], False),

            ("Dead Animal Carcass Removal",
             "Dead animal carcass lying decomposing on roadside near {street}. Urgent sanitary removal and bleaching powder disinfection requested.",
             "Dead Animal Carcass Removal Request", "HIGH", "High", "en", "Sanitary Emergency", True, [], False),

            ("Hazardous Biomedical Waste",
             "Used syringes, blood bags, and clinical waste dumped openly on footpath outside private diagnostic clinic near {street}.",
             "Hazardous Biomedical Waste Dumped on Footpath", "CRITICAL", "Critical", "en", "Biohazard", True, ["Public Health & Sanitation"], True)
        ]
    },

    "Street Lighting & Electrical": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Street Lighting & Electrical"],
        "is_crime": 0,
        "base_res_days": 2.0,
        "samples": [
            ("Streetlight Completely Off",
             "All eight streetlights along {street} have been completely non-functional for a week, leaving residential lane in total darkness.",
             "Complete Streetlight Outage on {street}", "MEDIUM", "Medium", "en", "Public Lighting Outage", True, [], False),

            ("Streetlight Completely Off",
             "Six consecutive LED streetlights along {street} have been defunct for two weeks, turning the residential corridor pitch dark and raising severe safety concerns.",
             "Multiple Defunct Streetlights on {street}", "MEDIUM", "Medium", "en", "Public Lighting Outage", True, [], False),

            ("Flickering / Damaged LED",
             "LED luminaire on street pole #14 outside {landmark} flickering violently and short-circuiting.",
             "Flickering LED Streetlight Fixture", "LOW", "Low", "en", "Lighting Defect", True, [], False),

            ("Damaged / Leaning Light Pole",
             "Galvanized street lighting pole leaning dangerously at a 45-degree angle towards roadway after truck scrape on {street}.",
             "Leaning Dangerous Streetlight Pole", "HIGH", "High", "en", "Physical Hazard", True, [], False),

            ("Exposed High-Mast Junction Box",
             "High-mast illumination tower base junction box open with exposed 440V live copper terminals at children playground near {landmark}.",
             "Exposed High-Mast Base Terminal Box", "HIGH", "High", "en", "Electrical Hazard", True, [], False)
        ]
    },

    "Public Health & Sanitation": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Public Health & Sanitation"],
        "is_crime": 0,
        "base_res_days": 2.5,
        "samples": [
            ("Mosquito Breeding & Dengue Risk",
             "Stagnant dirty water accumulated in open abandoned plots on {street} creating extensive mosquito breeding. Multiple dengue cases reported.",
             "Mosquito Breeding and Dengue Outbreak Risk", "HIGH", "High", "en", "Health & Vector Hazard", True, [], False),

            ("Mosquito Breeding & Dengue Risk",
             "Severe mosquito infestation due to stagnant water near {landmark}. Multiple dengue fever cases have been confirmed in nearby households. Urgent larvicidal fogging requested.",
             "Dengue Outbreak Risk and Heavy Mosquito Infestation Near {landmark}", "HIGH", "High", "en", "Health & Vector Hazard", True, [], False),

            ("Public Toilet & Urinal Hygiene",
             "Municipal public toilet complex at {landmark} is severely unhygienic with broken flush valves and lack of disinfectant cleaning.",
             "Filthy Unhygienic Municipal Public Toilet", "MEDIUM", "Medium", "en", "Sanitation Defect", True, [], False),

            ("Stagnant Water Vector Control",
             "Waterlogged puddles in market square near {street} have become infested with insect larvae. Fogging machine required.",
             "Vector Fogging Required for Mosquito Larvae", "MEDIUM", "Medium", "en", "Vector Control", True, [], False),

            ("Food Market Sanitation",
             "Rotting fish and meat waste dumped directly into open drain by bazaar vendors without disinfection outside {landmark}.",
             "Unhygienic Bazaar Meat Market Waste Disposal", "MEDIUM", "Medium", "en", "Market Sanitation", True, [], False)
        ]
    },

    "Fire & Emergency Services": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Fire & Emergency Services"],
        "is_crime": 0,
        "base_res_days": 1.0,
        "samples": [
            ("Residential Structure Fire",
             "Flames and heavy smoke billowing from second-floor apartment on {street}. People trapped inside! Immediate fire brigade dispatch requested!",
             "Active Residential Building Fire with Trapped Persons", "CRITICAL", "Critical", "en", "Fire / Thermal Hazard", True, ["Disaster Management", "Police & Law Enforcement"], True),

            ("Residential Structure Fire",
             "Massive fire broken out in a residential apartment building on {street}. Thick black smoke and visible flames erupting from the second floor. Immediate fire tender mobilization needed!",
             "Major Apartment Fire Outbreak on {street}", "CRITICAL", "Critical", "en", "Fire / Thermal Hazard", True, ["Disaster Management"], True),

            ("LPG Cylinder Leak / Blast",
             "Domestic LPG cooking gas cylinder leaking heavily and hissing with strong odor in tenement on {street}. Explosion risk!",
             "Severe LPG Gas Cylinder Leak Explosion Risk", "CRITICAL", "Critical", "en", "Explosion Hazard", True, [], True),

            ("Commercial / Factory Fire Hazard",
             "Chemical warehouse on {street} storing flammable solvents with completely blocked fire exits and no extinguishers.",
             "Commercial Fire Safety Violations and Chemical Hazard", "HIGH", "High", "en", "Fire Safety", True, [], False),

            ("Fire Hydrant Damage",
             "Underground municipal fire emergency hydrant valve vandalized and broken near {landmark}.",
             "Damaged Emergency Fire Hydrant", "LOW", "Low", "en", "Infrastructure Maintenance", True, [], False)
        ]
    },

    "Disaster Management": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Disaster Management"],
        "is_crime": 0,
        "base_res_days": 2.0,
        "samples": [
            ("Flood Inundation & Rescue",
             "River water entered residential localities across {street} submerging homes under 4 feet of water. Stranded residents require boat rescue and dry food.",
             "Severe Inundation and Flood Rescue Needed", "CRITICAL", "Critical", "en", "Disaster / Flooding / Cyclone", True, ["Health & Hospitals"], True),

            ("Flood Inundation & Rescue",
             "River embankment breach has flooded low-lying residential sectors near {landmark}. Over 80 households are marooned with waist-deep water. Emergency disaster rescue and relief requested.",
             "Severe Flooding and Embankment Inundation Near {landmark}", "CRITICAL", "Critical", "en", "Disaster / Flooding / Cyclone", True, [], True),

            ("Cyclone Damage & Uprooted Trees",
             "Severe cyclone winds uprooted six massive banyan trees blocking main highway on {street} and damaging electric poles.",
             "Cyclone Uprooted Trees Blocking Highway", "HIGH", "High", "en", "Disaster / Storm", True, ["Roads & Public Works", "Electricity & Power"], False),

            ("River Embankment Breach",
             "Earthen flood embankment along canal near {landmark} has developed 30-meter breach. Water gushing towards village.",
             "Canal Embankment Breach Threatening Submersion", "CRITICAL", "Critical", "en", "Disaster Breach", True, ["Water Supply"], True),

            ("Emergency Relief & Shelter",
             "Families displaced by seasonal river erosion taking shelter along road embankment require plastic tarpaulins and clean drinking water.",
             "Disaster Relief Materials Request for Displaced Families", "HIGH", "High", "en", "Disaster Relief", True, [], False)
        ]
    },

    "Environment & Pollution": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Environment & Pollution"],
        "is_crime": 0,
        "base_res_days": 3.0,
        "samples": [
            ("Industrial Smoke & Air Emissions",
             "Industrial factory near {street} releasing dense toxic black sulfur smoke throughout the night causing breathing distress to nearby residents.",
             "Toxic Industrial Smoke and Chemical Emissions", "HIGH", "High", "en", "Environmental / Pollution Hazard", True, [], False),

            ("Chemical Effluent Discharge",
             "Electroplating workshop discharging untreated acidic chemical waste into open pond near {landmark}, killing fish and poisoning groundwater.",
             "Chemical Acid Discharge Poisoning Water Body", "HIGH", "High", "en", "Pollution / Effluent", True, ["Fisheries & Wildlife"], False),

            ("Chemical Effluent Discharge",
             "Nearby industrial processing plant on {street} is discharging untreated dark chemical exhaust every night, causing acute breathing difficulties and throat irritation among residents.",
             "Hazardous Industrial Chemical Emissions on {street}", "HIGH", "High", "en", "Pollution / Effluent", True, [], False),

            ("Noise Pollution & Illegal Loudspeakers",
             "High-decibel DJ sound boxes blaring continuously past midnight near hospital and school zone on {street} violating pollution norms.",
             "Illegal High-Decibel Noise Pollution at Night", "MEDIUM", "Medium", "en", "Noise Pollution", True, ["Police & Law Enforcement"], False),

            ("Water Body Plastic Pollution",
             "Local water reservoir near {landmark} completely choked with non-biodegradable single-use plastic waste and discarded thermocol.",
             "Heavy Plastic Contamination of Public Water Reservoir", "LOW", "Low", "en", "Environmental Cleanup", True, [], False)
        ]
    },

    "Parks & Public Spaces": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Parks & Public Spaces"],
        "is_crime": 0,
        "base_res_days": 3.0,
        "samples": [
            ("Damaged Swings & Playground",
             "Iron swings and children slides in public municipal park on {street} are broken with sharp rusted edges causing injury risks to toddlers.",
             "Broken Playground Swings in Children Park", "MEDIUM", "Medium", "en", "Public Park Maintenance", True, [], False),

            ("Damaged Swings & Playground",
             "The children's playground slide and swing set at {landmark} public park are broken with sharp rusted metal edges exposed. Children risk severe lacerations. Repair urgently requested.",
             "Hazardous Broken Playground Equipment in {landmark} Park", "MEDIUM", "Medium", "en", "Public Park Maintenance", True, [], False),

            ("Park Lighting Outage",
             "All floodlights inside the central public garden on {street} are dead, encouraging antisocial elements to congregate in darkness.",
             "Central Public Park Lighting Blackout", "LOW", "Low", "en", "Park Maintenance", True, [], False),

            ("Broken Benches & Boundary Wall",
             "Concrete seating benches smashed and park perimeter boundary wall broken near {landmark}.",
             "Vandalized Benches in Municipal Park", "LOW", "Low", "en", "Park Maintenance", True, [], False),

            ("Unmaintained Green Space",
             "Public promenade grass overgrown with wild bushes and weeds harboring snakes near {street}.",
             "Overgrown Weeds in Public Walking Track", "LOW", "Low", "en", "Park Maintenance", True, [], False)
        ]
    },

    "Building & Municipal Engineering": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Building & Municipal Engineering"],
        "is_crime": 0,
        "base_res_days": 3.5,
        "samples": [
            # Fatal structural collapse contrast case
            ("Structural Crack & Collapse Hazard",
             "A three-story building collapsed on {street} trapping people under masonry rubble. One worker died due to concrete slab collapse. Civil engineering structural inspection and rescue required.",
             "Fatal Building Structural Collapse on {street}", "CRITICAL", "Critical", "en", "Building / Structural Collapse Hazard", True, ["Fire & Emergency Services", "Police & Law Enforcement"], True),

            ("Dangerous Dilapidated Building",
             "Centenary dilapidated commercial structure on {street} has huge vertical cracks and balcony crumbling onto busy pedestrian footpath.",
             "Dangerous Dilapidated Building Structural Hazard", "HIGH", "High", "en", "Building / Structural Collapse Hazard", True, [], False),

            ("Dangerous Dilapidated Building",
             "Old three-story masonry structure on {street} exhibits massive structural cracks along load-bearing walls. Masonry chunks are falling onto the public sidewalk. Demolition and safety inspection notice requested.",
             "Imminent Structural Collapse Risk on {street}", "HIGH", "High", "en", "Building / Structural Collapse Hazard", True, [], False),

            ("Unauthorized / Illegal Construction",
             "Illegal fifth floor being constructed without sanctioned building plan or municipal structural safety clearance on {street}.",
             "Unauthorized Multi-Story Illegal Construction", "MEDIUM", "Medium", "en", "Illegal Construction", True, [], False),

            ("Unsafe Scaffold / Site Hazard",
             "High-rise construction site on {street} operating without safety nets; falling bricks and scaffolding poles endangering passersby.",
             "Unsafe Construction Scaffold Without Safety Net", "HIGH", "High", "en", "Site Hazard", True, [], False)
        ]
    },

    "Land & Land Records": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Land & Land Records"],
        "is_crime": 0,
        "base_res_days": 4.0,
        "samples": [
            ("Encroachment on Govt Land",
             "Government earmarked vesting land and public pond on {street} is being illegally filled with soil and encroached by private land grabbers.",
             "Illegal Encroachment on Government Vested Land", "HIGH", "High", "en", "Land Encroachment", True, ["Police & Law Enforcement"], False),

            ("Encroachment on Govt Land",
             "Unauthorized commercial construction is encroaching upon demarcated government land and drainage buffer near {landmark}. Requesting land revenue department inspection and eviction.",
             "Illegal Encroachment on Government Vested Land Near {landmark}", "HIGH", "High", "en", "Land Encroachment", True, [], False),

            ("Mutation Record Discrepancy",
             "Citizen applied for land mutation certificate six months ago. Record of Rights (RoR) shows wrong plot Khatian and plot number.",
             "Discrepancy in Land Mutation Record of Rights", "MEDIUM", "Medium", "en", "Land Records Defect", True, [], False),

            ("Forged Land Deed / Fraudulent Sale",
             "Fraudulent land syndicate forged sale deed for ancestral plot #241 on {street} without owner consent.",
             "Forged Property Deed and Land Registry Fraud", "HIGH", "High", "en", "Land Fraud", True, ["Police & Law Enforcement"], False),

            ("Land Boundary Dispute",
             "Demarcation dispute between adjacent commercial plots on {street} due to missing municipal pillar markers.",
             "Official Land Boundary Demarcation Survey Request", "LOW", "Low", "en", "Land Survey", True, [], False)
        ]
    },

    "Housing & Urban Development": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Housing & Urban Development"],
        "is_crime": 0,
        "base_res_days": 4.0,
        "samples": [
            ("Housing Scheme Disbursement Delay",
             "Beneficiary sanctioned under government housing scheme has not received second installment funds for roof construction despite verification.",
             "Delay in Housing Scheme Beneficiary Installment", "MEDIUM", "Medium", "en", "Housing Scheme Delay", True, [], False),

            ("Slum Civic Infrastructure",
             "Slum settlement cluster on {street} lacks basic paved access pathways, stormwater channels, and community sanitation facilities.",
             "Slum Rehabilitation Basic Infrastructure Request", "MEDIUM", "Medium", "en", "Urban Amenities", True, [], False),

            ("Affordable Housing Structural Defect",
             "Newly handed over municipal affordable housing block on {street} has persistent wall dampness and plumbing leakage in all units.",
             "Construction Quality Defects in Urban Housing Flats", "MEDIUM", "Medium", "en", "Housing Defect", True, [], False),

            ("Urban Colony Basic Amenities",
             "Approved residential urban layout scheme on {street} still lacks planned internal connectivity and drainage integration.",
             "Pending Civic Development in Urban Colony", "LOW", "Low", "en", "Urban Planning", True, [], False)
        ]
    },

    "Electricity & Power": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Electricity & Power"],
        "is_crime": 0,
        "base_res_days": 1.5,
        "samples": [
            ("Open Live Wire / Electrical Shock Risk",
             "High-tension 11kV live power cable snapped and dangling two feet above flooded road on {street}. Extreme electrocution threat to pedestrians!",
             "High-Tension Live Wire Snapped on Road", "CRITICAL", "Critical", "en", "Electricity / Electrical Shock Risk", True, [], True),

            ("Open Live Wire / Electrical Shock Risk",
             "Overhead high-tension 11kV electrical power cable has snapped and lies sparking on waterlogged pavement on {street}. Extremely lethal electrocution hazard right now. Cut power immediately!",
             "Snapped 11kV Live Cable on Pavement on {street}", "CRITICAL", "Critical", "en", "Electricity / Electrical Shock Risk", True, [], True),

            ("Transformer Sparking / Overheating",
             "Distribution transformer sparking loudly with heavy smoke and oil leaking near market on {street}. Explosion risk.",
             "Distribution Transformer Sparking and Overheating", "HIGH", "High", "en", "Transformer Defect", True, [], False),

            ("Prolonged Power Blackout",
             "Entire residential neighborhood on {street} has been without power for over 18 hours following minor feeder tripping.",
             "Prolonged Feeder Power Blackout Across Ward", "MEDIUM", "Medium", "en", "Power Outage", True, [], False),

            ("Frequent High Voltage Fluctuation",
             "Severe voltage surging from 160V to 300V continuously burning domestic home appliances on {street}.",
             "Dangerous Power Voltage Fluctuations", "MEDIUM", "Medium", "en", "Voltage Fluctuation", True, [], False),

            ("Defective Electricity Meter",
             "Digital power meter display blank for two months resulting in arbitrary estimated overbilling by utility company.",
             "Defective Electric Meter and Erroneous Billing", "LOW", "Low", "en", "Meter Defect", True, [], False)
        ]
    },

    "Public Transport": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Public Transport"],
        "is_crime": 0,
        "base_res_days": 2.5,
        "samples": [
            ("Bus Route Cancellation / Absence",
             "State transport bus route #42 connecting {street} to railway terminus has stopped operating evening trips, stranding hundreds of commuters.",
             "Cancellation of Scheduled Public Bus Trips", "MEDIUM", "Medium", "en", "Public Transit Disruption", True, [], False),

            ("Bus Route Cancellation / Absence",
             "State transport buses on route connecting {landmark} are missing scheduled morning peak-hour departures, causing immense distress to office goers and school children.",
             "Severe Public Bus Service Disruption and Missed Trips Near {landmark}", "MEDIUM", "Medium", "en", "Public Transit Disruption", True, [], False),

            ("Passenger Overcharging / Conductor Conduct",
             "Private and state bus conductors refusing printed tickets and overcharging passengers arbitrary fares on {street} route.",
             "Illegal Fare Overcharging by Bus Conductors", "LOW", "Low", "en", "Fare Violation", True, ["Consumer Affairs"], False),

            ("Dilapidated Municipal Bus Condition",
             "Buses deployed on route {street} have broken passenger seats, rusted flooring, and leaking roofs in rain.",
             "Unsafe Dilapidated Public Bus Condition", "LOW", "Low", "en", "Vehicle Safety", True, [], False),

            ("Missing Bus Shelter",
             "Major commuter bus stop outside {landmark} has no shelter or shed, leaving passengers drenched in heavy monsoon downpour.",
             "Passenger Waiting Shed Construction Request", "LOW", "Low", "en", "Transit Infrastructure", True, [], False)
        ]
    },

    "Railway-related Public Complaints": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Railway-related Public Complaints"],
        "is_crime": 0,
        "base_res_days": 3.0,
        "samples": [
            ("Station Platform Amenities Defect",
             "Drinking water taps and passenger fans completely dead on platform #2 of {landmark} railway station. Escalator non-functional.",
             "Platform Amenities and Escalator Breakdown at Railway Station", "MEDIUM", "Medium", "en", "Railway Amenities", True, [], False),

            ("Dangerous Level Crossing Gate Delay",
             "Railway level crossing gate #12 on {street} remains closed for 45 minutes continuously causing massive ambulance blockades.",
             "Prolonged Railway Level Crossing Gate Closure", "HIGH", "High", "en", "Railway Gate Blockage", True, ["Traffic & Road Safety"], False),

            ("Station Approach Sanitation",
             "Platform #2 and station concourse at {landmark} are littered with uncleaned food containers and foul waste. Restroom facilities lack water supply.",
             "Severe Unsanitary Conditions at {landmark} Railway Platform", "MEDIUM", "Medium", "en", "Railway Sanitation", True, ["Solid Waste Management"], False),

            ("Passenger Overhead Bridge Damage",
             "Foot overbridge stairs at suburban railway station are cracked with loose concrete slabs risking passenger falls.",
             "Cracked Railway Foot Overbridge Stairs", "HIGH", "High", "en", "Railway Safety", True, [], False),

            ("Railway Station Approach Sanitation",
             "Open defecation and commercial encroachment blocking passenger booking counter outside suburban station.",
             "Sanitation and Encroachment at Railway Station Entrance", "MEDIUM", "Medium", "en", "Railway Approach", True, [], False)
        ]
    },

    "Health & Hospitals": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Health & Hospitals"],
        "is_crime": 0,
        "base_res_days": 1.5,
        "samples": [
            # Fatal medical negligence contrast case
            ("Hospital Medical Negligence Inquiry",
             "Patient admitted for minor fever died after being administered wrong intravenous drug at government hospital. Family alleges gross medical negligence and demands immediate investigation into hospital authorities.",
             "Fatal Patient Death Due to Alleged Medical Negligence", "HIGH", "High", "en", "Hospital / Healthcare Service Issue", True, ["Police & Law Enforcement"], True),

            ("Hospital Medical Negligence Inquiry",
             "A patient succumbed to death at the government hospital following alleged gross medical negligence and unavailability of emergency oxygen. The family appeals for an independent inquiry.",
             "Alleged Medical Negligence and Fatal Inquiry Request at Hospital", "HIGH", "High", "en", "Hospital / Healthcare Service Issue", True, ["Police & Law Enforcement"], True),

            ("Hospital Emergency Services Unavailable",
             "Emergency casualty ward at sub-divisional hospital turned away critical accident victim citing doctor unavailability.",
             "Emergency Casualty Services Refusal at Sub-Divisional Hospital", "CRITICAL", "Critical", "en", "Emergency Medical Refusal", True, [], True),

            ("Shortage of Critical Medicine / Oxygen",
             "General hospital pharmacy has had zero stock of lifesaving insulin, anti-rabies vaccines, and IV saline for two weeks.",
             "Zero Stock of Essential Emergency Medicines at Hospital", "HIGH", "High", "en", "Medicine Shortage", True, [], False),

            ("Primary Health Center Doctor Absence",
             "Government Primary Health Center (PHC) on {street} remaining locked during working hours with doctor absent for 10 days.",
             "Chronic Doctor Absenteeism at Primary Health Center", "MEDIUM", "Medium", "en", "Health Center Defect", True, [], False)
        ]
    },

    "Food & Public Distribution": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Food & Public Distribution"],
        "is_crime": 0,
        "base_res_days": 2.5,
        "samples": [
            ("Ration Shop PDS Irregularity",
             "Ration dealer at Fair Price Shop #42 on {street} diverting subsidized rice and wheat to black market and denying biometric receipts.",
             "Ration Dealer Black Marketing and Biometric Malpractice", "HIGH", "High", "en", "Food Distribution Fraud", True, [], False),

            ("Denial of Allocated Ration Card Grains",
             "Ration dealer refused to disburse monthly allocated rice and wheat to eligible Antyodaya ration cardholders on {street}.",
             "Denial of Subsidized Food Grains to Beneficiaries", "HIGH", "High", "en", "Food Security Denial", True, [], False),

            ("Adulterated / Rotten Food Grains",
             "Rice supplied through PDS public distribution system on {street} is infested with weevils, fungus, and stone particles.",
             "Infested Substandard Food Grains Distributed by PDS", "MEDIUM", "Medium", "en", "Food Quality Hazard", True, [], False),

            ("Adulterated / Rotten Food Grains",
             "Fair price ration dealer near {street} is distributing moldy, pest-infested rice and wheat to subsidized cardholders. Requesting immediate food inspection and sample testing.",
             "Substandard and Spoiled Ration Grain Distribution on {street}", "MEDIUM", "Medium", "en", "Food Quality Hazard", True, [], False),

            ("Fair Price Shop Overcharging",
             "PDS ration shop charging ₹5 extra per kg above government subsidized rates on statutory commodities.",
             "Unauthorized Price Surcharge at Fair Price Shop", "LOW", "Low", "en", "Price Violation", True, ["Consumer Affairs"], False)
        ]
    },

    "Consumer Affairs": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Consumer Affairs"],
        "is_crime": 0,
        "base_res_days": 3.0,
        "samples": [
            ("Retailer Charging Above MRP",
             "Retail grocery and packaged milk vendors on {street} systematically charging ₹5 to ₹10 above maximum retail price (MRP).",
             "Systematic Charging Above Maximum Retail Price (MRP)", "MEDIUM", "Medium", "en", "Consumer / Retailer Overcharging", True, [], False),

            ("Retailer Charging Above MRP",
             "Commercial retailer near {landmark} is unlawfully demanding ₹15 to ₹25 above the printed Maximum Retail Price on packaged consumer goods and rejecting receipts.",
             "Unlawful Overcharging Above Printed MRP Near {landmark}", "MEDIUM", "Medium", "en", "Consumer / Retailer Overcharging", True, [], False),

            ("Faulty Commercial Weighing Scales",
             "Sweet shops and vegetable stalls at market near {landmark} using tampered digital weighing scales shortchanging consumers by 100g per kg.",
             "Tampered Commercial Scales Defrauding Consumers", "MEDIUM", "Medium", "en", "Weight Manipulation", True, [], False),

            ("Warranty Refusal / Unfair Trade Practice",
             "Authorized electronics dealer refusing replacement on defective television purchased two weeks ago despite valid manufacturer warranty.",
             "Refusal of Warranty Replacement by Electronics Retailer", "LOW", "Low", "en", "Warranty Dispute", True, [], False),

            ("Counterfeit Goods & False Advertising",
             "Shops on {street} selling counterfeit automotive motor oil labeled as genuine brand leading to engine breakdown.",
             "Sale of Counterfeit Spurious Automotive Engine Oil", "HIGH", "High", "en", "Spurious Goods", True, ["Police & Law Enforcement"], False)
        ]
    },

    "Education – Schools": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Education – Schools"],
        "is_crime": 0,
        "base_res_days": 3.0,
        "samples": [
            ("School Building Urgent Repair / Roof Seepage",
             "Roof of primary school classroom building on {street} leaking water onto electric wires and desks during classes. Structural danger to children.",
             "Severe Roof Seepage in Primary School Building", "HIGH", "High", "en", "School / Primary Education Defect", True, ["Building & Municipal Engineering"], False),

            ("School Building Urgent Repair / Roof Seepage",
             "Damaged concrete ceiling in government primary school on {street} has developed severe cracks and plaster falling. Poses serious injury risk to students during class hours.",
             "Severe Classroom Structural Damage in Primary School on {street}", "HIGH", "High", "en", "School / Primary Education Defect", True, [], False),

            ("Broken School Toilets & Drinking Water",
             "Girls high school on {street} has zero functional toilets and drinking water purifier broken for past two terms.",
             "No Functional Toilets or Safe Water in Girls School", "HIGH", "High", "en", "School Sanitation", True, ["Public Health & Sanitation"], False),

            ("Mid-day Meal Quality Concern",
             "Rotten pulses and unhygienic contaminated food served in school mid-day meal scheme causing illness in 15 students.",
             "Substandard Contaminated Mid-day Meal in Government School", "HIGH", "High", "en", "Mid-day Meal Contamination", True, ["Health & Hospitals"], False),

            ("Classroom Furniture & Blackboard Damage",
             "Primary school on {street} lacks basic desks and benches; young students forced to sit on damp floor in winter.",
             "Lack of Desks and Benches in School Classrooms", "LOW", "Low", "en", "School Infrastructure", True, [], False)
        ]
    },

    "Higher Education": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Higher Education"],
        "is_crime": 0,
        "base_res_days": 3.5,
        "samples": [
            ("University Examination Result Discrepancy",
             "University semester examination marksheets of 120 final-year college students contain erroneous zero marks in practical evaluation.",
             "Evaluation Error in University Semester Marksheet", "MEDIUM", "Medium", "en", "Higher Education / Exam Discrepancy", True, [], False),

            ("University Examination Result Discrepancy",
             "Multiple final semester college students discovered severe tabulation errors and omitted practical marks in university mark sheets. Expedited re-evaluation requested.",
             "University Examination Mark Sheet Discrepancy", "MEDIUM", "Medium", "en", "Higher Education / Exam Discrepancy", True, [], False),

            ("Degree Certificate Issuance Delay",
             "College graduate applied for degree certificate two years ago, but university examination branch has not issued document.",
             "Undue Delay in Issuing Official Degree Certificate", "LOW", "Low", "en", "Certificate Delay", True, [], False),

            ("College Campus Infrastructure Defect",
             "Science laboratory facilities in government degree college on {street} have defunct safety showers and broken chemical exhaust ducts.",
             "Unsafe Laboratory Infrastructure in Government College", "MEDIUM", "Medium", "en", "Campus Infrastructure", True, [], False),

            ("College Anti-Ragging Grievance",
             "Hostel boarders in polytechnic college campus being subjected to physical and psychological ragging by senior students.",
             "Anti-Ragging Complaint in Government College Hostel", "HIGH", "High", "en", "Campus Safety / Ragging", True, ["Police & Law Enforcement"], False)
        ]
    },

    "Labour & Employment": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Labour & Employment"],
        "is_crime": 0,
        "base_res_days": 3.0,
        "samples": [
            # Fatal workplace accident contrast case
            ("Workplace Fatality / Industrial Injury Compensation",
             "A construction worker died after falling from an unshielded tenth-floor scaffold on {street}. Contractor had provided no safety harnesses. Complainant demands labour commissioner inquiry and compensation.",
             "Fatal Construction Worker Fall and Lack of Safety Gear", "HIGH", "High", "en", "Workplace / Labour Dispute", True, ["Police & Law Enforcement"], True),

            ("Workplace Fatality / Industrial Injury Compensation",
             "An industrial worker tragically died following a heavy machinery collapse at a factory on {street}. Complainant alleges gross violation of occupational safety guidelines and seeks inquiry.",
             "Workplace Industrial Fatality and Safety Inquiry Request on {street}", "HIGH", "High", "en", "Workplace / Labour Dispute", True, ["Police & Law Enforcement"], True),

            ("Unpaid Worker Wages / Salary Withheld",
             "Contractor at municipal project on {street} has withheld three months wages of 45 sanitation workers without justification.",
             "Withholding of Wages for 45 Sanitation Workers", "HIGH", "High", "en", "Wage Violation", True, [], False),

            ("Violation of Minimum Wage Compliance",
             "Garment factory in industrial zone paying workers ₹180 daily, severely violating statutory state minimum wage standards.",
             "Statutory Minimum Wage Violation in Garment Unit", "MEDIUM", "Medium", "en", "Minimum Wage", True, [], False),

            ("Hazardous Workplace Without Safety Gear",
             "Welders and chemical plant laborers working inside confined boiler spaces without helmets, masks, or ventilation.",
             "Lack of Occupational Safety Gear in Hazardous Unit", "MEDIUM", "Medium", "en", "Workplace Safety", True, [], False)
        ]
    },

    "Agriculture": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Agriculture"],
        "is_crime": 0,
        "base_res_days": 3.5,
        "samples": [
            ("Irrigation Canal Water Siltation",
             "Agricultural feeder irrigation canal choked with heavy silt and sand, cutting off water supply to 300 acres of paddy fields.",
             "Choked Feeder Canal Depriving Farmers of Irrigation", "HIGH", "High", "en", "Agricultural / Irrigation Defect", True, ["Water Supply"], False),

            ("Irrigation Canal Water Siltation",
             "Agricultural irrigation canal serving farmland near {street} is heavily silted and choked with weeds, completely cutting off water to standing paddy crops.",
             "Irrigation Canal Blockage and Water Scarcity on {street}", "HIGH", "High", "en", "Agricultural / Irrigation Defect", True, [], False),

            ("Defective Agricultural Tube-well",
             "Government deep tube-well motor burnt out three weeks ago near {street}. Crop saplings withering due to lack of water.",
             "Government Agricultural Deep Tubewell Motor Failure", "MEDIUM", "Medium", "en", "Tubewell Defect", True, [], False),

            ("Substandard Crop Seeds / Fertilizer",
             "Certified paddy seeds purchased from local agricultural cooperative had zero germination rate causing total crop failure.",
             "Substandard Agricultural Certified Seeds Germination Failure", "HIGH", "High", "en", "Seed Quality Dispute", True, ["Consumer Affairs"], False),

            ("Flood Crop Damage Compensation Claim",
             "Excessive rainwater inundated 150 bighas of vegetable fields; farmers request official crop loss survey and subsidy.",
             "Crop Loss Assessment Survey and Compensation Request", "MEDIUM", "Medium", "en", "Crop Compensation", True, [], False)
        ]
    },

    "Animal Resources": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Animal Resources"],
        "is_crime": 0,
        "base_res_days": 2.5,
        "samples": [
            ("Stray Cattle & Livestock Road Obstruction",
             "Large herd of 25 stray cattle abandoned on {street} causing traffic gridlocks and vehicle accidents every evening.",
             "Stray Cattle Obstruction and Collision Hazard on Road", "MEDIUM", "Medium", "en", "Animal / Livestock Menace", True, ["Traffic & Road Safety"], False),

            ("Stray Cattle & Livestock Road Obstruction",
             "Dozens of stray cattle congregate continuously on {street} causing traffic gridlock and two-wheeler skids every night. Municipal cattle shelter impoundment requested.",
             "Stray Cattle Obstruction and Traffic Collision Hazard on {street}", "MEDIUM", "Medium", "en", "Animal / Livestock Menace", True, [], False),

            ("Stray Dog Bite Menace & Rabies Drive",
             "Pack of aggressive stray dogs attacked multiple pedestrians on {street} biting three children. Urgent rabies vaccination drive needed.",
             "Aggressive Stray Dog Bite Menace and Vaccination Request", "HIGH", "High", "en", "Rabies Risk", True, ["Public Health & Sanitation"], False),

            ("Veterinary Clinic Doctor Absence",
             "Government veterinary hospital on {street} remaining locked with veterinary surgeon absent, leaving diseased cattle untreated.",
             "Veterinary Doctor Absenteeism at Animal Clinic", "MEDIUM", "Medium", "en", "Veterinary Absence", True, [], False),

            ("Injured Animal Emergency Care",
             "Stray cow severely injured and bleeding on roadside after collision near {landmark}. Urgent veterinary care requested.",
             "Emergency Medical Treatment for Injured Livestock", "HIGH", "High", "en", "Injured Animal", True, [], False)
        ]
    },

    "Forest & Wildlife": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Forest & Wildlife"],
        "is_crime": 0,
        "base_res_days": 3.0,
        "samples": [
            ("Illegal Tree Cutting & Timber Smuggling",
             "Illegal logging syndicate chopping down mature teak and sal timber trees in government reserve forest tract near {street}.",
             "Illegal Timber Tree Felling in Reserve Forest", "HIGH", "High", "en", "Forest / Wildlife Tree Cutting", True, ["Police & Law Enforcement"], False),

            ("Illegal Tree Cutting & Timber Smuggling",
             "Unidentified poachers are actively cutting down mature protected trees in the reserve forest section near {landmark}. Immediate forest department patrol and vehicle seizure requested.",
             "Illegal Timber Felling and Deforestation Near {landmark}", "HIGH", "High", "en", "Forest / Wildlife Tree Cutting", True, [], False),

            ("Wild Animal Intrusion in Village",
             "Herd of wild elephants strayed into village settlement near {street} damaging huts and standing grain crops.",
             "Wild Elephant Herd Intrusion in Village", "HIGH", "High", "en", "Wildlife Conflict", True, [], False),

            ("Forest Boundary Encroachment",
             "Commercial resort setting up illegal concrete boundary pillars inside demarcated reserve forest buffer zone.",
             "Encroachment on Forest Boundary Buffer Zone", "MEDIUM", "Medium", "en", "Forest Encroachment", True, ["Land & Land Records"], False),

            ("Poaching / Wildlife Protection Violation",
             "Poachers setting metal wire snares to trap spotted deer and wild birds in wetland forest patch near {landmark}.",
             "Illegal Animal Snaring and Poaching in Forest", "HIGH", "High", "en", "Poaching", True, ["Police & Law Enforcement"], False)
        ]
    },

    "Public Grievance / General Administration": {
        "subcategories": DEPARTMENT_SUBCATEGORIES["Public Grievance / General Administration"],
        "is_crime": 0,
        "base_res_days": 3.0,
        "samples": [
            ("Delay in Government Service Application",
             "Citizen applied for statutory caste and income certificate at municipal administration desk four months ago; application arbitrarily stalled.",
             "Undue Delay in Issuing Statutory Government Certificate", "MEDIUM", "Medium", "en", "Public Grievance / Administrative Delay", True, [], False),

            ("Delay in Government Service Application",
             "Citizen's domicile and character certificate application has been pending without updates for more than six months at the administrative sub-divisional office. Redressal requested.",
             "Unexplained Administrative Delay in Citizen Service Processing", "MEDIUM", "Medium", "en", "Public Grievance / Administrative Delay", True, [], False),

            ("Official Corruption / Bribe Solicitation",
             "Dealing clerk at municipal revenue office demanding cash bribe of ₹3,000 to process routine trade license renewal.",
             "Bribe Solicitation by Revenue Office Staff", "HIGH", "High", "en", "Administrative Corruption", True, [], False),

            ("Citizen Charter Timeline Non-Compliance",
             "Administrative office routinely violating citizen charter mandatory turnaround timelines for civic services.",
             "Violation of Statutory Citizen Charter Timelines", "LOW", "Low", "en", "Charter Violation", True, [], False),

            ("Public Officer Unresponsiveness / Harassment",
             "Sub-divisional desk officer behaved abusively and refused to accept formal public grievance petition from citizen.",
             "Unprofessional and Abusive Conduct by Administrative Officer", "MEDIUM", "Medium", "en", "Public Officer Conduct", True, [], False)
        ]
    }
}

def generate_complaints(target_samples: int = 6000) -> pd.DataFrame:
    """
    Generates balanced, diverse, high-quality complaints across all 30 canonical departments.
    Ensures ~200 samples per department with rich syntactic variations, English-only domain coverage,
    and distinct contrast cases.
    """
    records = []
    samples_per_dept = target_samples // len(CANONICAL_30_DEPARTMENTS)
    
    complaint_id_counter = 1
    
    print(f"Generating ~{samples_per_dept} samples per department for {len(CANONICAL_30_DEPARTMENTS)} departments...")
    
    for dept in CANONICAL_30_DEPARTMENTS:
        dept_data = DEPARTMENT_TEMPLATES.get(dept)
        if not dept_data:
            raise ValueError(f"Missing templates for canonical department: {dept}")
            
        base_samples = dept_data["samples"]
        subcats = dept_data["subcategories"]
        is_crime_default = dept_data.get("is_crime", 0)
        base_res_days = dept_data.get("base_res_days", 2.5)
        
        dept_records_count = 0
        
        while dept_records_count < samples_per_dept:
            # Pick a base sample
            subcat, text_tpl, title_tpl, prio, sev, lang, inc_type, cause_known, sec_depts, human_review = random.choice(base_samples)
            
            # Fill variables
            street = random.choice(STREETS)
            landmark = random.choice(LANDMARKS)
            
            # Text augmentation / variations
            text = text_tpl.format(street=street, landmark=landmark)
            title = title_tpl.format(street=street, landmark=landmark)
            
            # Occasionally add formal prefixes or context to mirror real user submissions
            if dept_records_count % 5 == 0 and not text.startswith("One Man Is Killed"):
                prefix = random.choice([
                    f"Official Civic Complaint Regarding {title}. Submitted for municipal jurisdiction inspection. ",
                    f"Grievance Report: Location at {street} near {landmark}. Citizen appeal to relevant authorities: ",
                    f"Formal Notice: Issue reported along {street}. "
                ])
                text = prefix + text
                
            loc_type = random.choice(LOCATION_TYPES)
            affected = random.choice([5, 15, 30, 50, 100, 250, 500, 1200])
            duration = random.randint(1, 30)
            
            # Calculate coordinates near base
            lat = round(BASE_LAT + random.uniform(-0.06, 0.06), 5)
            lng = round(BASE_LNG + random.uniform(-0.06, 0.06), 5)
            ward = f"Ward {random.randint(1, 35)}"
            address = f"{street}, near {landmark}, {ward}"
            
            # Resolution days variation
            res_days = round(max(0.5, base_res_days + random.uniform(-0.5, 1.2)), 1)
            
            records.append({
                "complaint_id": f"CMP-SYN-{complaint_id_counter:05d}",
                "complaint_text": f"{title} — {text}",
                "title": title,
                "category": dept,
                "subcategory": subcat,
                "department": dept,
                "secondary_departments": json.dumps(sec_depts),
                "priority": prio,
                "severity": sev,
                "location_type": loc_type,
                "affected_citizens": affected,
                "duration_days": duration,
                "emergency_flag": 1 if prio == "CRITICAL" else 0,
                "is_crime": is_crime_default,
                "incident_type": inc_type,
                "cause_known": 1 if cause_known else 0,
                "requires_human_review": 1 if human_review else 0,
                "resolution_days": res_days,
                "latitude": lat,
                "longitude": lng,
                "ward": ward,
                "address": address,
                "is_synthetic": 1
            })
            
            complaint_id_counter += 1
            dept_records_count += 1

    df = pd.DataFrame(records)
    print(f"Generated total {len(df)} samples across {df['category'].nunique()} canonical departments.")
    return df

if __name__ == "__main__":
    out_path = os.path.join(current_dir, "civic_complaints_dataset.csv")
    df = generate_complaints(6000)
    df.to_csv(out_path, index=False, encoding='utf-8')
    print(f"Saved dataset successfully to {out_path}")
