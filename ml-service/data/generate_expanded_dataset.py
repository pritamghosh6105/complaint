"""
CivicPulse AI — Authoritative 30 Canonical Departments Dataset Generator
Generates a realistic, highly diverse, balanced 18,000-record dataset
(600 records per category across 30 canonical West Bengal departments and 23 districts).
Includes edge cases, linguistic variations, power outages, cyber disputes,
fatal collisions vs suspicious deaths, building collapse vs road repair, etc.
"""

import os
import sys
import random
import pandas as pd
from typing import List, Dict, Any

WB_DISTRICTS = [
    {"district": "Kolkata", "thana": "Park Street PS", "subdivision": "Kolkata South", "type": "KMC Urban", "landmarks": ["Park Street Crossing", "Esplanade Metro", "Sealdah Station", "Gariahat Junction", "Shyambazar Five Point"]},
    {"district": "North 24 Parganas", "thana": "Barasat Sadar PS", "subdivision": "Barasat Sadar", "type": "Municipality", "landmarks": ["Barasat Champadali More", "Madhyamgram Chowrastha", "Habra Municipality Market", "Bhatpara Station Road", "Barrackpore Wireless Gate"]},
    {"district": "South 24 Parganas", "thana": "Baruipur PS", "subdivision": "Baruipur", "type": "Semi-Urban", "landmarks": ["Baruipur Kacharibari", "Canning Hospital More", "Diamond Harbour Pier", "Sonarpur Station Bazaar", "Bhangar Bus Stand"]},
    {"district": "Howrah", "thana": "Howrah Sadar PS", "subdivision": "Howrah Sadar", "type": "HMC Urban", "landmarks": ["Howrah Station Bus Terminus", "Kadamtala Bazaar", "Nabanna Approach Road", "Bally Halt Crossing", "Uluberia Industrial Belt"]},
    {"district": "Hooghly", "thana": "Chinsurah PS", "subdivision": "Chinsurah", "type": "Municipality", "landmarks": ["Chinsurah Clock Tower", "Chandannagar Strand Road", "Serampore Battala", "Uttarpara Ferry Ghat", "Arambagh Link Road"]},
    {"district": "Purba Bardhaman", "thana": "Bardhaman Sadar PS", "subdivision": "Bardhaman Sadar", "type": "Sadar Urban", "landmarks": ["Bardhaman Railway Junction", "Curzon Gate Chowk", "Memari Station Bazaar", "Katwa Bus Stand", "Kalna Municipality Ward 8"]},
    {"district": "Paschim Bardhaman", "thana": "Asansol South PS", "subdivision": "Asansol", "type": "Municipal Corporation", "landmarks": ["Asansol City Bus Stand", "Durgapur City Centre", "Raniganj Coal Belt Market", "Burnpur Works Gate", "Andal More"]},
    {"district": "Nadia", "thana": "Kotwali PS", "subdivision": "Krishnanagar Sadar", "type": "Rural-Urban", "landmarks": ["Krishnanagar Rajbari More", "Ranaghat Sub-division Court", "Kalyani ITI More", "Nabadwip Ghat", "Tehatta Bus Stand"]},
    {"district": "Murshidabad", "thana": "Berhampore PS", "subdivision": "Berhampore", "type": "Rural-Urban", "landmarks": ["Berhampore Mohona Bus Stand", "Lalgola Border Checkpost", "Jangipur Hospital Road", "Kandi Sub-divisional Hospital", "Jiaganj Bazaar"]},
    {"district": "Birbhum", "thana": "Suri PS", "subdivision": "Suri Sadar", "type": "Semi-Urban", "landmarks": ["Suri Circuit House", "Bolpur Shantiniketan Tourist Lodge", "Rampurhat Railway Overbridge", "Sainthia Station More", "Dubrajpur Market"]},
    {"district": "Bankura", "thana": "Bankura Sadar PS", "subdivision": "Bankura Sadar", "type": "Semi-Urban", "landmarks": ["Bankura Sammilani Medical College", "Bishnupur Rasmancha Road", "Khatra-Mukutmanipur Road", "Barjora Industrial Area", "Sonamukhi Hospital More"]},
    {"district": "Purulia", "thana": "Purulia Town PS", "subdivision": "Purulia Sadar", "type": "Semi-Urban", "landmarks": ["Purulia Bus Stand", "Raghunathpur Market", "Jhalda Town Square", "Balarampur Bazaar", "Manbazar More"]},
    {"district": "Paschim Medinipur", "thana": "Kotwali PS", "subdivision": "Midnapore Sadar", "type": "Semi-Urban", "landmarks": ["Midnapore Collectorate Compound", "Kharagpur Golbazar", "Ghatal Hospital Road", "Debra Toll Plaza", "Salboni High School Road"]},
    {"district": "Purba Medinipur", "thana": "Tamluk PS", "subdivision": "Tamluk", "type": "Coastal Urban", "landmarks": ["Tamluk Hospital Road", "Haldia Docks Gate 1", "Contai Super Market", "Digha Sea Beach Road", "Mecheda Station Crossing"]},
    {"district": "Jhargram", "thana": "Jhargram PS", "subdivision": "Jhargram", "type": "Forest Fringe", "landmarks": ["Jhargram Palace Crossing", "Lodhasuli More", "Belpahari Block Office", "Gopiballavpur Hospital", "Sankrail Bazaar"]},
    {"district": "Malda", "thana": "English Bazar PS", "subdivision": "Malda Sadar", "type": "Urban-Rural", "landmarks": ["English Bazar Rathbari More", "Old Malda Municipality Gate", "Chanchal Sub-divisional Hospital", "Kaliachak National Highway", "Gazole Market"]},
    {"district": "Uttar Dinajpur", "thana": "Raiganj PS", "subdivision": "Raiganj", "type": "Urban-Rural", "landmarks": ["Raiganj Siliguri More", "Islampur Sub-divisional Court", "Dalkhola Railway Gate", "Kaliyaganj Bazaar", "Hemtabad Hospital Road"]},
    {"district": "Dakshin Dinajpur", "thana": "Balurghat PS", "subdivision": "Balurghat", "type": "Urban-Rural", "landmarks": ["Balurghat Chowrasta", "Gangarampur Bus Stand", "Buniadpur Municipality Road", "Harirampur Bazaar", "Hili Border Road"]},
    {"district": "Jalpaiguri", "thana": "Kotwali PS", "subdivision": "Jalpaiguri Sadar", "type": "Sub-Himalayan", "landmarks": ["Jalpaiguri DBC Road", "Malbazar Clock Tower", "Dhupguri Municipality Market", "Rajganj Block Office", "Mainaguri Hospital Road"]},
    {"district": "Darjeeling", "thana": "Darjeeling Sadar PS", "subdivision": "Darjeeling Sadar", "type": "Hilly Urban", "landmarks": ["Chowrasta Mall", "Ghum Railway Station", "Kurseong Motor Stand", "Mirik Lake Road", "Siliguri Hill Cart Road"]},
    {"district": "Kalimpong", "thana": "Kalimpong PS", "subdivision": "Kalimpong Sadar", "type": "Hilly Urban", "landmarks": ["Damber Chowk", "Lava-Algarah Road", "Gorubathan Tea Plantation Center", "10th Mile Market", "Teesta Bazaar"]},
    {"district": "Alipurduar", "thana": "Alipurduar PS", "subdivision": "Alipurduar Sadar", "type": "Duars Urban", "landmarks": ["Alipurduar Chowpathy", "Falakata Block Hospital", "Birpara Tea Estate Gate", "Jaigaon Bhutan Border", "Madarihat Tourist Lodge"]},
    {"district": "Cooch Behar", "thana": "Kotwali PS", "subdivision": "Cooch Behar Sadar", "type": "Urban-Rural", "landmarks": ["Cooch Behar Palace Gate", "Dinhata Hospital Road", "Tufanganj Sub-divisional Market", "Mathabhanga Town Square", "Mekhliganj Bazaar"]}
]

DEPARTMENT_INCIDENT_PATTERNS = {
    "Police & Law Enforcement": [
        {
            "subcat": "Theft / Burglary",
            "type": "Property Crime",
            "prio": "HIGH", "sev": "High", "is_crime": 1, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "Immediate",
            "title": "House Burglary and Armed Theft of Valuables",
            "desc": "A residence near {landmark} in {district} was broken into during the night by miscreants. Gold jewellery, cash, and documents were stolen while occupants were away. Broken lock latches and entry marks are visible. Immediate FIR registration and police investigation requested.",
            "cause": "Criminal house trespass and burglary by unidentified perpetrators",
            "req_action": "Register formal FIR, dispatch forensic team for fingerprint lifting, and step up night police patrolling"
        },
        {
            "subcat": "Physical Assault",
            "type": "Violent Crime",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 1, "is_emg": 1, "review": 0, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Violent Physical Assault by Armed Group at Public Market",
            "desc": "A group of armed miscreants attacked local shopkeepers on {street} near {landmark} in {district} using iron rods and sharp weapons. Two persons suffered bleeding head injuries and have been rushed to hospital. The attackers are threatening bystanders. Immediate police force intervention needed.",
            "cause": "Armed physical violence and extortion threat in broad daylight",
            "req_action": "Deploy quick reaction police team, arrest attackers, and seize weapons"
        },
        {
            "subcat": "Death Investigation / Suspicious or Unexplained Death (pending verification)",
            "type": "Fatal Incident / Death",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 1, "is_emg": 1, "review": 1, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Unexplained Body Found in Deserted Plot Requiring Police Inquest",
            "desc": "An unidentified deceased individual was discovered lying in a deserted plot near {landmark} in {district}. The cause of death is not specified and remains unexplained with no eyewitnesses. The circumstances remain limited and suspicious. An official law-enforcement inquiry, inquest report, and forensic post-mortem investigation are requested.",
            "cause": "Unexplained fatality requiring judicial inquest and medico-legal autopsy",
            "req_action": "Secure scene of crime, conduct inquest under CrPC Section 174, and dispatch body for post-mortem autopsy"
        },
        {
            "subcat": "Missing Person Report",
            "type": "Missing Person Investigation",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 1, "is_emg": 1, "review": 1, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Urgent Missing Person Report - Elderly Person with Dementia Missing for 24 Hours",
            "desc": "An elderly family member aged 74 left the residence near {landmark} in {district} yesterday afternoon and has not returned. The person suffers from memory loss and requires daily cardiac medication. Local searches at relatives and hospitals have yielded no result. Immediate missing diary entry and police wireless alert requested.",
            "cause": "Vulnerable missing citizen requiring immediate police tracking",
            "req_action": "Log missing person complaint, flash all-stations police wireless message, and inspect public CCTV footage"
        },
        {
            "subcat": "Extortion / Intimidation",
            "type": "Organized Extortion",
            "prio": "HIGH", "sev": "High", "is_crime": 1, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "Immediate",
            "title": "Extortion Demand and Intimidation by Local Goons at Business Premises",
            "desc": "Local syndicate goons entered a commercial shop on {street} near {landmark} demanding illegal extortion money of INR 50,000 under threat of arson and physical harm to staff. CCTV footage clearly captures the faces of the extortionists. Police protection and criminal action requested.",
            "cause": "Illegal extortion and criminal intimidation by anti-social elements",
            "req_action": "Register criminal case under extortion sections and provide immediate security surveillance"
        }
    ],

    "Cyber Crime": [
        {
            "subcat": "UPI / Payment Gateway Fraud",
            "type": "Financial Cyber Fraud",
            "prio": "HIGH", "sev": "High", "is_crime": 1, "is_emg": 0, "review": 0, "res_days": 1.5, "time_sen": "Immediate",
            "title": "Unauthorized UPI Transaction Deductions via Fraudulent Payment Gateway",
            "desc": "Citizen received a deceptive payment link claiming to be an electricity bill update near {landmark} in {district}. Upon scanning the QR code, an unauthorized UPI debit of INR 48,500 was immediately siphoned from their bank account to an unknown beneficiary. Transaction IDs and bank statements are attached. Immediate freezing of destination account requested.",
            "cause": "Phishing QR code and unauthorized electronic fund transfer fraud",
            "req_action": "Flag transaction on National Cyber Crime Portal (1930) and issue debit freeze order to destination bank"
        },
        {
            "subcat": "Net Banking Fraud",
            "type": "Online Banking Compromise",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 1, "is_emg": 1, "review": 0, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Net Banking Credentials Compromised and Life Savings Siphoned",
            "desc": "A fraudulent caller posing as a bank manager deceived a citizen residing near {landmark} into sharing an OTP under the pretext of KYC verification. Within ten minutes, INR 2,15,000 was transferred out across three fraudulent transactions. Complainant's net banking credentials have been compromised. Immediate cyber cell intervention needed.",
            "cause": "Social engineering vishing scam resulting in unauthorized bank account compromise",
            "req_action": "Direct bank nodal officer to freeze destination accounts and initiate cyber forensics trace"
        },
        {
            "subcat": "Account Hacking / Unauthorized Access",
            "type": "Unauthorized Digital Access",
            "prio": "HIGH", "sev": "High", "is_crime": 1, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "High",
            "title": "Email and Social Media Accounts Hacked for Extortion and Defamation",
            "desc": "Complainant's primary email and business accounts were hacked from an unknown IP address near {landmark}. The hacker has changed recovery credentials, posted obscene material, and is messaging contacts demanding cryptocurrency ransoms. IP logs and breach alerts are available. Cyber cell investigation requested.",
            "cause": "Unauthorized account takeover, credential compromise, and digital extortion",
            "req_action": "Serve statutory notice to intermediary platform under IT Act to preserve server IP logs and recover account"
        },
        {
            "subcat": "Cyber Harassment / Stalking",
            "type": "Online Stalking and Defamation",
            "prio": "HIGH", "sev": "High", "is_crime": 1, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "Immediate",
            "title": "Cyber Harassment, Morphed Photos and Threatening Messages",
            "desc": "An anonymous profile on digital messaging platforms is circulating morphed obscene photographs of a female college student residing near {landmark} in {district}. The perpetrator is demanding ransom money while sending threatening messages. Complete digital screenshots and phone logs are attached. Immediate cyber crime action needed.",
            "cause": "Digital harassment, impersonation, and non-consensual electronic transmission of sexually explicit imagery",
            "req_action": "Issue emergency takedown notice to social platform and trace subscriber identity via CDR and IP tracking"
        },
        {
            "subcat": "Identity Theft / Loan Impersonation",
            "type": "Identity Theft / Digital Loan Fraud",
            "prio": "HIGH", "sev": "High", "is_crime": 1, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "High",
            "title": "Fraudulent Instant Loan Taken Using Stolen PAN and Aadhaar Details",
            "desc": "Citizen discovered an unauthorized loan of INR 75,000 disbursed by an unregistered Chinese loan app using their PAN card and forged KYC documents without consent. The citizen lives near {landmark} in {district} and is now receiving abusive recovery calls threatening to morph contacts. Immediate cyber cell action requested.",
            "cause": "Identity theft and predatory rogue lending app extortion",
            "req_action": "File FIR under IT Act, block rogue lending app domains, and notify RBI fraud cell"
        }
    ],

    "Women & Child Safety": [
        {
            "subcat": "Eve Teasing / Public Street Harassment",
            "type": "Street Harassment",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 1, "is_emg": 1, "review": 0, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Persistent Street Harassment and Eve Teasing Near Girls High School",
            "desc": "Groups of rowdy youths assemble daily on {street} near {landmark} in {district} during school dismissal hours, passing vulgar comments, making obscene gestures, and stalking female students. Several students feel unsafe and are terrified to walk down the road. Immediate police presence and anti-harassment patrolling needed.",
            "cause": "Street harassment and stalking in public areas endangering female students",
            "req_action": "Deploy mobile Winners/anti-eve-teasing police patrol team during morning and afternoon school hours"
        },
        {
            "subcat": "Domestic Violence",
            "type": "Domestic Abuse",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 1, "is_emg": 1, "review": 1, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Severe Domestic Violence and Physical Threat to Female Resident",
            "desc": "A female resident living in an apartment near {landmark} in {district} is suffering persistent physical assaults and verbal abuse from an abusive partner. Loud cries for help and breaking furniture were heard by neighbors late last night. The victim has sustained visible bruises and fears for her life. Immediate rescue and intervention required.",
            "cause": "Domestic violence and physical assault endangering woman's life",
            "req_action": "Dispatch local police station duty officer with women protection officer to ensure victim safety"
        },
        {
            "subcat": "Child Abuse / Child Labour",
            "type": "Child Exploitation",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 1, "is_emg": 1, "review": 1, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Underage Children Employed in Hazardous Chemical Factory",
            "desc": "Two young children aged approximately 11 and 13 years are being forcibly employed under hazardous conditions inside an industrial workshop near {landmark} in {district}. The children work 12-hour shifts handling toxic chemicals without safety gear and are subjected to physical abuse. Immediate child welfare rescue requested.",
            "cause": "Illegal child labour, exploitation, and hazardous child abuse",
            "req_action": "Coordinate emergency joint raid with Child Welfare Committee (CWC) and District Labour Department"
        },
        {
            "subcat": "Stalking / Cyber Harassment",
            "type": "Female Stalking",
            "prio": "HIGH", "sev": "High", "is_crime": 1, "is_emg": 0, "review": 0, "res_days": 1.5, "time_sen": "Immediate",
            "title": "Persistent Stalking of Working Woman During Evening Commute",
            "desc": "A working woman returning from work near {landmark} in {district} is being stalked daily by an unidentified motorcyclist who follows her from the bus stop to her housing society gate. The stalker makes suggestive remarks and takes unauthorized photographs. The victim is under extreme psychological distress. Immediate police intervention needed.",
            "cause": "Criminal stalking and intimidation of women in public transit corridors",
            "req_action": "Review intersection surveillance footage, identify motorcycle registration, and apprehend the stalker"
        }
    ],

    "Traffic & Road Safety": [
        {
            "subcat": "Traffic Signal Malfunction & Chaos",
            "type": "Traffic Control Failure",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.0, "time_sen": "High",
            "title": "Four-Way Traffic Signal Inoperative Causing Continuous Gridlock",
            "desc": "The primary four-way automatic traffic signal at {landmark} on {street} in {district} has been completely non-functional for three days. With no traffic constable deployed, vehicles are driving into each other from all directions, causing hour-long traffic jams, near-miss collisions, and severe delays for school buses and ambulances. Immediate traffic police deployment and signal repair needed.",
            "cause": "Microprocessor card failure in traffic signal controller box",
            "req_action": "Deploy manual traffic police officers immediately and dispatch traffic engineering maintenance unit"
        },
        {
            "subcat": "Fatal Vehicle Collision",
            "type": "Fatal Road Accident",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 1, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Fatal Highway Collision Between Truck and Motorcyclist",
            "desc": "A speeding commercial truck collided with a two-wheeler on {street} near {landmark} in {district}, resulting in a fatal road accident and immediate loss of life of the motorcyclist. Traffic on the arterial corridor is blocked. Traffic & Road Safety authorities and police are requested to clear the carriageway, manage traffic diversion, and conduct accident investigation.",
            "cause": "High-speed vehicular collision on arterial highway",
            "req_action": "Clear accident vehicles, restore traffic flow, and register vehicular collision inquiry"
        },
        {
            "subcat": "Dangerous Rash Driving & Drag Racing",
            "type": "Rash Driving Hazard",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.5, "time_sen": "High",
            "title": "Reckless Dumpers and Speeding Trucks Endangering Pedestrians",
            "desc": "Overloaded sand trucks and heavy dumpers are regularly speeding at over 80 km/h through a narrow residential stretch on {street} near {landmark} in {district}. Pedestrians and schoolchildren are terrified to cross the road. Several minor hit-and-run incidents have already occurred this month. Speed bumps and speed enforcement cameras requested.",
            "cause": "Unchecked speeding of heavy goods vehicles through residential zones",
            "req_action": "Install rubberized rumble strips, post traffic radar speed gun squad, and penalize violators"
        },
        {
            "subcat": "Illegal Obstruction & Parking",
            "type": "Illegal Traffic Obstruction",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "Standard",
            "title": "Commercial Trucks Illegally Parked Double-Row Blocking Highway",
            "desc": "Interstate commercial trucks are illegally parked in double rows along both sides of {street} near {landmark} in {district}, reducing a four-lane arterial road to a single narrow lane. Emergency vehicles cannot pass through. Clear 'No Parking' signs are completely ignored by truck operators. Immediate towing and clearance requested.",
            "cause": "Unauthorized commercial vehicle parking on public right-of-way",
            "req_action": "Deploy traffic police recovery tow trucks, remove illegal obstructions, and impose heavy fines"
        }
    ],

    "Roads & Public Works": [
        {
            "subcat": "Potholes & Cratered Road Surface",
            "type": "Road Infrastructure Damage",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 3.0, "time_sen": "High",
            "title": "Massive Deep Potholes and Eroded Asphalt on Arterial Main Road",
            "desc": "A 500-meter stretch of the main road on {street} near {landmark} in {district} has developed dozens of deep craters and severe potholes measuring up to two feet wide. Rainwater fills the holes, making them invisible to two-wheeler riders. Over ten bike skidding incidents have been recorded this week alone. Urgent bituminous macadam repair needed.",
            "cause": "Sub-base erosion and wearing course failure due to heavy vehicular load and poor drainage",
            "req_action": "Deploy PWD road patching team to fill craters with hot-mix asphalt and compact surface"
        },
        {
            "subcat": "Road Cave-In & Sinkhole",
            "type": "Structural Road Failure",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 1.5, "time_sen": "Immediate",
            "title": "Dangerous Road Cave-In and Sinkhole Threatening Vehicles",
            "desc": "A large ten-foot sinkhole has suddenly caved in on the middle of {street} near {landmark} in {district}. The road surface collapsed inwards, leaving an exposed cavern beneath the asphalt. Passing passenger buses are in danger of falling into the abyss. Immediate barricading and structural reconstruction needed.",
            "cause": "Underground subsoil washout and pipeline cavity collapse",
            "req_action": "Erect safety barricades immediately, divert heavy traffic, and initiate concrete backfilling"
        },
        {
            "subcat": "Broken Bridge / Culvert Railing",
            "type": "Bridge Infrastructure Damage",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 2.0, "time_sen": "High",
            "title": "Damaged Culvert Slab and Missing Safety Railing Over Canal",
            "desc": "The concrete culvert bridge on {street} near {landmark} in {district} has developed severe transverse structural cracks, and the concrete safety railing on the canal side has completely fallen into the water. Vehicles traveling at night have no barrier stopping them from plunging into the ten-foot deep canal. Immediate PWD civil inspection and reconstruction needed.",
            "cause": "Structural fatigue and missing guardrail crash barrier",
            "req_action": "Install temporary crash barriers and dispatch structural bridge engineer for load assessment"
        },
        {
            "subcat": "Damaged Footpath & Broken Pavers",
            "type": "Pedestrian Infrastructure Hazard",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 4.0, "time_sen": "Standard",
            "title": "Broken Footpath Paver Tiles and Open Gaps Endangering Pedestrians",
            "desc": "The pedestrian walkway along {street} near {landmark} in {district} has shattered paver blocks, protruding metal rebars, and missing slabs for over 200 meters. Senior citizens and visually impaired pedestrians have tripped and sustained fractures. Pedestrians are forced onto the vehicular carriageway. Urgent footpath repaving requested.",
            "cause": "Broken walkway tiles and lack of municipal pavement maintenance",
            "req_action": "Re-lay interlocking paver tiles and level pedestrian walking corridor"
        }
    ],

    "Drainage & Sewerage": [
        {
            "subcat": "Open & Broken Manhole Cover",
            "type": "Manhole Hazard",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Open Uncovered Deep Sewer Manhole on Busy Pedestrian Road",
            "desc": "An eight-foot deep sewer manhole located on {street} near {landmark} in {district} has had its concrete lid missing for four days. The open pit is surrounded by knee-deep murky water, creating a lethal death trap for pedestrians, children, and two-wheelers. Immediate replacement of the heavy-duty cast iron manhole cover is required.",
            "cause": "Missing or shattered sewer inspection pit cover",
            "req_action": "Install heavy-duty SFRC manhole cover immediately and place luminous warning signage"
        },
        {
            "subcat": "Blocked Sewer & Foul Sludge Overflow",
            "type": "Sewage System Failure",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.5, "time_sen": "High",
            "title": "Underground Sewer Line Blocked - Raw Sewage Flooding Homes",
            "desc": "The main underground drainage line on {street} near {landmark} in {district} is completely choked with solid silt. Black, foul-smelling raw sewage is bubbling out of residential inspection pits and gushing into ground-floor living rooms. Over 80 households cannot use toilets or kitchens. Jetting machine suction needed urgently.",
            "cause": "Choking of municipal trunk sewer by solid waste accumulation and plastic silt",
            "req_action": "Deploy high-pressure hydraulic suction jetting machine to de-silt sewer pipeline"
        },
        {
            "subcat": "Monsoon Waterlogging & Choked Drains",
            "type": "Drainage Inundation",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "High",
            "title": "Severe Waterlogging and Stagnant Stormwater Due to Choked Drains",
            "desc": "Surface storm drains along {street} near {landmark} in {district} are filled to the brim with plastic garbage and construction rubble. Even mild rainfall leaves the entire locality submerged under two feet of stagnant dirty water for over 48 hours. Small businesses cannot open and residents are stranded. Thorough canal desilting requested.",
            "cause": "Uncleaned stormwater drainage channels unable to discharge surface runoff",
            "req_action": "Engage municipal drainage desilting excavators to clear out choked outlet channels"
        }
    ],

    "Water Supply": [
        {
            "subcat": "Contaminated & Muddy Drinking Water",
            "type": "Water Quality Crisis",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Contaminated Muddy Drinking Water from Municipal Supply Lines",
            "desc": "Drinking water supplied through municipal pipeline taps in the residential neighborhood near {landmark} in {district} is coming out yellowish-brown, turbid, and emitting a foul sewage odor. Multiple residents, including children, have fallen sick with diarrhea and gastroenteritis. Supply line contamination must be isolated and repaired immediately.",
            "cause": "Cross-contamination of drinking water main due to adjacent sewer pipe leakage",
            "req_action": "Isolate contaminated water pipeline, collect water samples for laboratory testing, and flush lines"
        },
        {
            "subcat": "Total Water Supply Disruption",
            "type": "Water Supply Failure",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.5, "time_sen": "High",
            "title": "Complete Disruption of Piped Potable Water Supply for 4 Days",
            "desc": "Over 500 families residing on {street} near {landmark} in {district} have not received a single drop of municipal piped drinking water for the past four days. The local overhead reservoir pump has broken down. Residents are forced to purchase costly private tanker water. Immediate water tanker deployment and pump repair needed.",
            "cause": "Centrifugal water pump motor burnout at municipal water booster station",
            "req_action": "Deploy emergency potable water relief tankers and replace burnt water pump assembly"
        },
        {
            "subcat": "Major Pipeline Burst & Water Wastage",
            "type": "Trunk Pipeline Rupture",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.0, "time_sen": "Immediate",
            "title": "High-Pressure Water Main Burst Flooding Public Roadway",
            "desc": "A 300 mm underground drinking water distribution main burst on {street} near {landmark} in {district}. A high-pressure jet of drinking water is shooting 15 feet into the air, wasting thousands of liters of treated water every hour and completely flooding the thoroughfare. Immediate valve shut-off and pipeline welding required.",
            "cause": "Mechanical rupture of aging cast-iron distribution pipeline under pressure spike",
            "req_action": "Close isolation gate valves and dispatch emergency pipeline repair squad"
        }
    ],

    "Solid Waste Management": [
        {
            "subcat": "Overflowing Garbage Vat & Foul Stench",
            "type": "Municipal Waste Crisis",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.5, "time_sen": "Standard",
            "title": "Massive Overflowing Garbage Vat on Main Road Creating Biohazard",
            "desc": "The municipal community garbage vat on {street} near {landmark} in {district} has not been cleared for over six days. Tons of decomposing household waste, vegetable refuse, and medical trash have spilled out onto half the roadway. Stray animals are scattering the waste and the unbearable stench makes breathing difficult. Immediate compactor truck removal needed.",
            "cause": "Failure of municipal solid waste collection contractor to deploy mechanical dumper trucks",
            "req_action": "Dispatch mechanical compactor trucks with hydraulic shovels and sanitize area with bleaching powder"
        },
        {
            "subcat": "Illegal Roadside Waste Dumping",
            "type": "Illegal Waste Disposal",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "Standard",
            "title": "Illegal Dumping of Commercial Debris and Industrial Scrap on Open Plot",
            "desc": "Private commercial operators and construction contractors are illegally dumping truckloads of toxic debris, plastic scrap, and industrial waste into an open public plot on {street} near {landmark} in {district}. Complainants caught dumpers on mobile camera at midnight. Waste removal and strict enforcement requested.",
            "cause": "Unauthorized dumping of commercial solid waste to evade tipping fees",
            "req_action": "Clear accumulated illegal debris, install CCTV surveillance camera, and penalize violators"
        },
        {
            "subcat": "Door-to-Door Waste Collection Halted",
            "type": "Waste Collection Disruption",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.5, "time_sen": "Standard",
            "title": "Door-to-Door Garbage Collection Suspended Across Entire Ward",
            "desc": "The daily door-to-door municipal waste collection vans have stopped visiting the residential neighborhood near {landmark} in {district} for the past ten days. Residents have piles of decomposing kitchen garbage accumulating inside residential premises with nowhere to safely dispose of it. Restoration of regular collection schedule needed.",
            "cause": "Contract dispute between municipality and private waste collection agency",
            "req_action": "Reinstate door-to-door battery collection vehicles and enforce collection timetable"
        }
    ],

    "Street Lighting & Electrical": [
        {
            "subcat": "Dark Street & Defective LED Streetlights",
            "type": "Street Lighting Failure",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "Standard",
            "title": "Complete Stretch of 25 Streetlights Dark for Over Two Weeks",
            "desc": "A continuous one-kilometer stretch of municipal streetlights on {street} near {landmark} in {district} is completely dark every night. Over 25 LED luminaire fixtures are non-operational due to a faulty phase timer circuit. Women, seniors, and students are terrified to walk at night, and anti-social elements gather in the dark. Urgent repair of streetlights needed.",
            "cause": "Faulty timer switch and burnt electrical fuses in municipal lighting feeder pillar",
            "req_action": "Dispatch municipal electrical maintenance boom van to replace burnt drivers and repair phase timer"
        },
        {
            "subcat": "Tilted & Rusted Streetlight Pole",
            "type": "Streetlight Structural Danger",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 1.0, "time_sen": "High",
            "title": "Severely Rusted Streetlight Pole Leaning Over Roadway",
            "desc": "A heavy metal municipal streetlight pole on {street} near {landmark} in {district} has rusted completely through at its base and is tilted dangerously at a 30-degree angle over the busy roadway. Passing buses are brushing against it. A strong wind gust will bring the heavy pole crashing down on pedestrians. Urgent pole replacement required.",
            "cause": "Corrosion and structural base metal fatigue of old tubular electrical pole",
            "req_action": "De-energize pole immediately, erect crane support, and install new galvanized steel pole"
        }
    ],

    "Public Health & Sanitation": [
        {
            "subcat": "Mosquito Breeding & Dengue Outbreak",
            "type": "Vector-Borne Epidemic Threat",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.5, "time_sen": "High",
            "title": "Stagnant Water with Heavy Mosquito Breeding - Dengue Cluster Detected",
            "desc": "A massive pool of stagnant water on an abandoned public plot near {landmark} in {district} has become a massive breeding ground for Aedes mosquitoes. Over twelve local residents in the adjacent apartment complexes have tested positive for Dengue NS1 within the last ten days. No municipal fogging or larvicide spraying has occurred. Immediate public health vector control needed.",
            "cause": "Unchecked accumulation of stagnant rainwater and absence of vector control spraying",
            "req_action": "Conduct immediate thermal fogging, apply Temephos larvicide to stagnant pools, and clear standing water"
        },
        {
            "subcat": "Animal Carcass Removal & Disinfection",
            "type": "Sanitation Biohazard",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Decomposing Stray Cattle Carcass Lying on Public Thoroughfare",
            "desc": "A large dead stray animal carcass has been lying on the roadside of {street} near {landmark} in {district} for over 48 hours. The carcass is bloated, flies are swarming, and the overwhelming smell of decay is creating a severe public health biohazard for surrounding shops and homes. Immediate carcass lifting and chemical disinfection required.",
            "cause": "Decomposition of dead livestock on public road without municipal removal",
            "req_action": "Dispatch animal carcass removal vehicle with lime and bleaching powder for sanitary burial"
        }
    ],

    "Fire & Emergency Services": [
        {
            "subcat": "Residential Structure Fire",
            "type": "Active Fire Emergency",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 0.5, "time_sen": "Immediate",
            "title": "Fire Outbreak in Multi-Storey Residential Apartment Building",
            "desc": "Thick black smoke and visible flames are billowing out from the third floor of a residential apartment building on {street} near {landmark} in {district}. Multiple families are trapped on upper floors and calling for help. Flammable material is stored in adjacent shops. Immediate dispatch of fire tenders with hydraulic skylift ladders is urgently required.",
            "cause": "Electrical short circuit in domestic meter board spreading to furniture",
            "req_action": "Dispatch three fire brigade water tenders with hydraulic rescue ladders immediately"
        },
        {
            "subcat": "Commercial Chemical / Cylinder Explosion Hazard",
            "type": "Explosion and Fire Hazard",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 0.5, "time_sen": "Immediate",
            "title": "Commercial LPG Cylinder Fire and Explosion Risk at Crowded Market",
            "desc": "An commercial LPG gas cylinder has caught fire at a roadside food stall near {landmark} in {district}. Intense flames are engulfing adjacent temporary stalls where multiple additional gas cylinders are stocked. A major explosion is imminent if not doused immediately. Fire brigade and crowd evacuation needed.",
            "cause": "High-pressure gas hose leak catching fire near open cooking burner",
            "req_action": "Deploy fire brigade emergency tender to cool cylinders with foam and isolate perimeter"
        }
    ],

    "Disaster Management": [
        {
            "subcat": "River Embankment Breach & Flood Inundation",
            "type": "Natural Disaster Inundation",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 1, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Major River Embankment Breach Flooding Three Gram Panchayat Villages",
            "desc": "The earthen river embankment along the river near {landmark} in {district} has breached over a 50-meter section following continuous rainfall and tidal surge. River water is rapidly inundating hundreds of mud houses, agricultural paddies, and livestock sheds. Families are stranded on rooftops without food or drinking water. Immediate NDRF/SDRF rescue and sandbag reinforcement needed.",
            "cause": "High river surge eroding unreinforced earthen levee embankment",
            "req_action": "Deploy SDRF motorized rescue boats, establish relief camp, and dump boulders/sandbags into breach"
        },
        {
            "subcat": "Cyclone / Storm Devastation & Uprooted Trees",
            "type": "Severe Weather Destruction",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Severe Storm Devastation - Dozens of Uprooted Trees Blocking Arterial Link",
            "desc": "A violent squall storm has uprooted massive century-old banyan trees and electric poles across {street} near {landmark} in {district}. The main arterial road connecting the sub-division hospital is completely blocked. Snapped power cables are strewn on the road. Immediate disaster response clearing teams equipped with chain saws requested.",
            "cause": "Cyclonic gale-force wind gusts uprooting roadside trees and demolishing infrastructure",
            "req_action": "Mobilize disaster management quick response team with hydraulic tree cutters to restore arterial road"
        }
    ],

    "Environment & Pollution": [
        {
            "subcat": "Industrial Chemical Smoke & Toxic Fumes",
            "type": "Industrial Air Pollution",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "High",
            "title": "Factory Releasing Untreated Toxic Chemical Smoke into Residential Colony",
            "desc": "An industrial manufacturing unit located adjacent to the residential colony near {landmark} in {district} is releasing untreated thick acrid yellow smoke every night between 11 PM and 5 AM. Children and elderly residents are waking up choking with severe coughing, eye burning, and respiratory asthma attacks. Pollution Control Board inspection and closure notice requested.",
            "cause": "Bypassing of air pollution wet scrubber system by factory during night shifts",
            "req_action": "Conduct unannounced inspection by State Pollution Control Board and issue closure direction"
        },
        {
            "subcat": "Toxic Effluent Discharge into Public Water Body",
            "type": "Water Pollution Violation",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.5, "time_sen": "High",
            "title": "Dyeing Factory Discharging Acidic Chemical Effluent into River",
            "desc": "A commercial fabric dyeing mill near {landmark} in {district} is discharging hot, untreated chemical wastewater colored dark purple directly through an underground pipe into the local canal. Thousands of dead fish have washed up along the banks and groundwater in nearby tubewells has turned brackish. Immediate environmental sealing of the drain needed.",
            "cause": "Illegal discharge of industrial toxic trade effluent without Effluent Treatment Plant (ETP)",
            "req_action": "Collect effluent samples for chemical analysis and seal unauthorized discharge pipe"
        },
        {
            "subcat": "Severe Noise Pollution Beyond Permissible Limits",
            "type": "Noise Regulation Violation",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.5, "time_sen": "Standard",
            "title": "Illegal High-Decibel DJ Sound Systems Operating After Midnight",
            "desc": "Commercial party halls and event organizers on {street} near {landmark} in {district} are operating high-wattage sound systems with bass boxes at over 95 decibels past 1 AM, completely violating Supreme Court guidelines. Board exam students cannot study and elderly heart patients are suffering. Police and environmental noise regulation enforcement requested.",
            "cause": "Unpermitted use of sound amplifiers and sound systems exceeding statutory noise thresholds",
            "req_action": "Enforce noise pollution control rules, seize unauthorized sound amplifiers, and penalize operators"
        }
    ],

    "Parks & Public Spaces": [
        {
            "subcat": "Damaged Children's Playground Equipment",
            "type": "Public Park Amenity Hazard",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 3.0, "time_sen": "Standard",
            "title": "Dangerous Broken Swings and Rusted Slides in Children's Public Park",
            "desc": "The municipal public children's park near {landmark} in {district} has rusted, broken metal swings with sharp jagged edges, broken slide steps, and shattered seesaw planks. Two young children sustained deep cuts while playing last Sunday. The safety rubber mats are torn and discarded. Immediate repair and replacement of play equipment requested.",
            "cause": "Severe corrosion and lack of routine civic maintenance of playground equipment",
            "req_action": "Dismantle hazardous rusted play equipment and install certified safe playground apparatus"
        },
        {
            "subcat": "Public Park Neglect & Wild Overgrowth",
            "type": "Park Maintenance Deficit",
            "prio": "LOW", "sev": "Low", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 5.0, "time_sen": "Routine",
            "title": "Municipal Park Overgrown with Poisonous Weeds and Broken Benches",
            "desc": "The public garden near {landmark} in {district} has become completely derelict. Thorny bushes and weeds have grown over six feet high, making the walking track inaccessible and sheltering snakes. All concrete benches are cracked and lighting fixtures are smashed. Restoration of park greenery and security fence needed.",
            "cause": "Absence of municipal horticultural maintenance and grass trimming for six months",
            "req_action": "Deploy municipal horticultural clearing team to trim weeds, repair benches, and secure perimeter"
        }
    ],

    "Building & Municipal Engineering": [
        {
            "subcat": "Dilapidated Dangerous Building at Risk of Collapse",
            "type": "Structural Collapse Hazard",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 1, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Severe Structural Cracks in Century-Old Building - Imminent Collapse Hazard",
            "desc": "A four-storey heritage commercial structure on {street} near {landmark} in {district} has developed massive vertical structural cracks across its load-bearing walls. Concrete chunks and brick cornices are falling onto the crowded pedestrian footpath below. An engineer's inspection indicates that structural failure and building collapse could occur at any moment. Urgent structural safety demolition or shoring needed.",
            "cause": "Structural masonry failure and severe foundation settlement of aging building",
            "req_action": "Evacuate building occupants, barricade surrounding roadway, and issue emergency demolition notice"
        },
        {
            "subcat": "Unauthorized & Illegal Multi-Story Construction",
            "type": "Illegal Construction Violation",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 1, "res_days": 2.5, "time_sen": "High",
            "title": "Unapproved Five-Storey Building Erected Without Sanction Plan or Setbacks",
            "desc": "A private promoter is actively constructing a five-storey building on an 8-foot narrow lane on {street} near {landmark} in {district} without obtaining any municipal sanction plan. Zero mandatory setback has been left, completely blocking light and air to adjacent residences and endangering neighborhood stability. Stop-work order and demolition requested.",
            "cause": "Unauthorized construction violating West Bengal Municipal Building Rules",
            "req_action": "Serve statutory stop-work notice under municipal act, disconnect utilities, and initiate demolition"
        },
        {
            "subcat": "Deep Excavation Endangering Adjacent Residential Homes",
            "type": "Excavation Structural Danger",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Un-shored Deep Basement Excavation Causing Cracks in Adjacent Houses",
            "desc": "A commercial developer has excavated a 25-foot deep foundation pit on {street} near {landmark} in {district} without installing sheet piling or soil retention shoring. Due to soil shifting, wide cracks have opened across the boundary walls and floors of three adjacent residential homes. Residents fear catastrophic cave-in. Immediate civil inspection required.",
            "cause": "Negligent deep excavation without structural retaining walls causing subsoil movement",
            "req_action": "Halt excavation work immediately, inspect structural stability, and order mandatory RCC sheet piling"
        }
    ],

    "Land & Land Records": [
        {
            "subcat": "Delay in Land Mutation and Record of Rights (Porcha)",
            "type": "Land Administrative Grievance",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 4.0, "time_sen": "Standard",
            "title": "Undue Delay in Processing Land Mutation Application Filed Over 7 Months Ago",
            "desc": "The citizen purchased a registered residential plot on {street} near {landmark} in {district} and submitted a complete mutation application with all deeds and tax receipts to the BL&LRO office seven months ago (Application No: MUT/2026/89412). No hearing has been called and the revenue inspector claims file is misplaced. Direction to BL&LRO to issue mutated Porcha requested.",
            "cause": "Administrative lethargy and procedural delay in Block Land & Land Reforms Office",
            "req_action": "Direct Block Land & Land Reforms Officer (BL&LRO) to conduct expedited mutation hearing"
        },
        {
            "subcat": "Illegal Encroachment on Government Vested Land / Public Pond",
            "type": "Land Encroachment",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 1, "res_days": 3.0, "time_sen": "High",
            "title": "Land Mafia Illegally Filling Public Pond and Encroaching Vested Land",
            "desc": "Local land grabbers are actively dumping truckloads of red soil to illegally fill an ancient one-acre public water body and encroaching adjoining government vested plot on {street} near {landmark} in {district}. The pond is a vital natural water reservoir and flood buffer for the village. Demarcation, boundary survey, and criminal eviction requested.",
            "cause": "Illegal earth filling of protected water body violating Inland Fisheries Act and land laws",
            "req_action": "Dispatch Revenue Inspector for demarcation, halt earth filling, and file FIR against land mafia"
        }
    ],

    "Housing & Urban Development": [
        {
            "subcat": "Housing Scheme Subsidy Disbursement Delay",
            "type": "Government Housing Scheme Grievance",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 4.0, "time_sen": "Standard",
            "title": "Beneficiary Second Installment of Banglar Bari Housing Subsidy Withheld",
            "desc": "Complainant is an approved BPL beneficiary under the state government housing scheme (Banglar Bari / PMAY-U) residing near {landmark} in {district}. The foundation and plinth level were completed and geo-tagged five months ago, but the second construction installment has not been released into their bank account. Construction has halted with family living in open. Release of funds requested.",
            "cause": "Administrative delay in municipal urban development fund disbursement portal",
            "req_action": "Verify geo-tagged inspection report and expedite transfer of sanctioned housing installment"
        },
        {
            "subcat": "Substandard Construction in Government Urban Housing Project",
            "type": "Urban Housing Defect",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 3.0, "time_sen": "High",
            "title": "Severe Roof Leakage and Chipped Concrete in Government Rehabilitation Flats",
            "desc": "Allotment holders in the municipal rehabilitation housing complex near {landmark} in {district} are facing severe structural defects just one year after handover. The terrace waterproofing has failed, rainwater is pouring through ceiling fan fixtures, and external plaster is falling off. Inspection by Urban Development engineering division needed.",
            "cause": "Substandard civil construction work and defective waterproofing by contractor",
            "req_action": "Enforce contractor defect liability clause to re-execute terrace waterproofing and structural repairs"
        }
    ],

    "Electricity & Power": [
        {
            "subcat": "Frequent Power Outages & Low Voltage",
            "type": "Power Distribution Failure",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Extended Power Outage of 12 Hours - Immediate Restoration Required",
            "desc": "The power supply to the residential area on {street} near {landmark} in {district} has been completely discontinued for a continuous period of twelve (12) hours without any prior notice. Over 300 households are suffering in extreme heat without electricity for fans, water pump motors cannot operate to fill overhead tanks, and infants and elderly patients are in severe distress. Immediate WBSEDCL feeder restoration requested.",
            "cause": "11 kV overhead distribution feeder breakdown and substation breaker trip",
            "req_action": "Deploy WBSEDCL emergency quick-response breakdown squad to rectify feeder cable fault and restore supply"
        },
        {
            "subcat": "Frequent Power Outages & Low Voltage",
            "type": "Power Distribution Failure",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.5, "time_sen": "High",
            "title": "Severe Low Voltage (130V) and Continuous Load Shedding Across Ward",
            "desc": "For the past six days, residential households on {street} near {landmark} in {district} are suffering from unannounced daily load shedding of 6 to 8 hours and extreme low voltage hovering between 130V and 150V. Inverter batteries fail to charge, domestic refrigerators cannot start, and single-phase water pump motors are burning out. Immediate transformer load upgrade requested.",
            "cause": "Overloaded distribution transformer exceeding rated kVA capacity during peak summer load",
            "req_action": "Dispatch WBSEDCL technical team to balance phase loads and install higher capacity transformer"
        },
        {
            "subcat": "Damaged Transformer & Sparking",
            "type": "Electrical Explosion Hazard",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 0.5, "time_sen": "Immediate",
            "title": "Pole-Mounted Distribution Transformer Leaking Boiling Oil and Exploding",
            "desc": "A 100 kVA pole-mounted distribution transformer located at the corner of {street} near {landmark} in {district} has begun spraying boiling transformer oil with loud explosive fireballs shooting from the HT bushing. High-voltage sparks are dropping onto parked two-wheelers and pedestrians below. Urgent electrical shutdown and transformer replacement required before it bursts.",
            "cause": "Internal coil insulation breakdown and phase short-circuit under severe thermal overload",
            "req_action": "Isolate 11 kV feeder line immediately at substation and install replacement transformer unit"
        },
        {
            "subcat": "Snapped Overhead Electric Cable",
            "type": "Live Electrical Wire Hazard",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 0.5, "time_sen": "Immediate",
            "title": "Live 440V Overhead Power Cable Snapped and Sparking on Waterlogged Road",
            "desc": "A live high-tension overhead electrical line snapped on {street} near {landmark} in {district} and is hanging down directly touching a waterlogged road surface. Sparks and smoke are erupting whenever vehicles approach. Pedestrians are in imminent danger of fatal electrocution. Immediate emergency power cut-off and cable re-stringing required.",
            "cause": "Mechanical failure and snapping of aging aluminum conductor steel-reinforced wire",
            "req_action": "Remotely trip local substation circuit breaker immediately and send emergency lineworkers to restock line"
        },
        {
            "subcat": "Faulty Electricity Meter & Billing Discrepancy",
            "type": "Electricity Meter Defect",
            "prio": "LOW", "sev": "Low", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 3.0, "time_sen": "Routine",
            "title": "Digital Electricity Meter Running at High Speed Resulting in Inflated Bill",
            "desc": "The digital electric energy meter (Consumer ID: 502918442) installed at the complainant's residence near {landmark} in {district} is running excessively fast even when all domestic main switches are isolated. The current quarterly bill has arrived at an exorbitant INR 18,400 compared to the normal INR 1,200. Testing and calibration of the digital meter requested.",
            "cause": "Current transformer sensor defect and internal firmware error in digital electronic meter",
            "req_action": "Schedule on-site meter testing using calibrated reference meter and issue revised billing credit"
        }
    ],

    "Public Transport": [
        {
            "subcat": "Bus Route Non-Operation & Irregularity",
            "type": "Public Transit Failure",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 3.0, "time_sen": "Standard",
            "title": "State Government Bus Service Suspended on Key Rural-Urban Route",
            "desc": "The scheduled state transport bus connecting {street} in {district} to the district headquarters has stopped operating its morning and evening trips for the last two weeks without public notice. Daily school students and office commuters are forced to pay exorbitant fares to private auto syndicates. Restoration of bus service requested.",
            "cause": "Shortage of operational fleet vehicles and diversion of buses to alternative commercial charters",
            "req_action": "Direct Divisional Transport Depot Manager to enforce minimum statutory timetable trips"
        },
        {
            "subcat": "Overcharging and Auto-Rickshaw Fare Gouging",
            "type": "Transit Fare Gouging",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "Standard",
            "title": "Auto-Rickshaw Operators Demanding Double Fare During Evening Hours",
            "desc": "Auto-rickshaws plying the route from {landmark} to {street} in {district} are arbitrarily refusing standard metered/regulated fares and demanding INR 40 instead of the official INR 18 tariff after 7 PM. Commuters who object are verbally abused and denied transit. Transport enforcement inspection requested.",
            "cause": "Lack of RTO enforcement presence and unregulated cartelization of local auto stands",
            "req_action": "Deploy RTO flying squad with Traffic Police to inspect auto stands and cancel permits of violators"
        }
    ],

    "Railway-related Public Complaints": [
        {
            "subcat": "Station Platform Amenities & Sanitation",
            "type": "Railway Passenger Grievance",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.5, "time_sen": "Standard",
            "title": "Suburban Railway Station Platform Water Coolers Dry and Toilets Locked",
            "desc": "At the railway station near {landmark} in {district}, all four drinking water booths on Platform 2 and 3 have dry taps in 40-degree heat. The public passenger toilet is locked, forcing passengers and seniors to suffer. Suburban commuters demand immediate restoration by railway commercial department.",
            "cause": "Contractor abandonment of station plumbing maintenance agreement without railway penalty",
            "req_action": "Direct Senior Divisional Commercial Manager (Sr DCM) to penalize contractor and restore potable water"
        },
        {
            "subcat": "Level Crossing Gate Delay & Safety",
            "type": "Railway Level Crossing Congestion",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "High",
            "title": "Railway Level Crossing Gate Kept Closed for 45 Minutes Continuously",
            "desc": "The railway level crossing on {street} near {landmark} in {district} was kept closed for 45 continuous minutes during peak morning school hours today without any passing train, creating a 2-kilometer vehicular jam. Two critical ambulances were stuck. Coordination between station master and gateman needed.",
            "cause": "Poor operational signaling protocol and delayed train departure clearances at adjacent yard",
            "req_action": "Enforce maximum level crossing closure time limit and expedite train dispatch protocol"
        }
    ],

    "Health & Hospitals": [
        {
            "subcat": "Hospital Medical Negligence Inquiry",
            "type": "Medical Negligence",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 1, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Hospital Emergency Doctor Absent - Patient Suffers Cardiac Arrest Without Care",
            "desc": "A critical emergency cardiac patient was brought to the government sub-divisional hospital near {landmark} in {district}. The duty medical officer was absent from the casualty ward for over two hours. No oxygen cylinder regulator was functional and the patient suffered cardiac arrest without treatment. Inquiry into hospital administration negligence requested.",
            "cause": "Dereliction of duty and absence of emergency medical staff at government health facility",
            "req_action": "Constitute inquiry committee under Chief Medical Officer of Health (CMOH) and initiate disciplinary action"
        },
        {
            "subcat": "Essential Medicines Out of Stock",
            "type": "Public Health Supply Shortage",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "High",
            "title": "Vital Anti-Rabies Vaccine and Snake Anti-Venom Unavailable at Rural Hospital",
            "desc": "The Block Primary Health Centre (BPHC) near {landmark} in {district} has been completely out of stock of vital Anti-Rabies Vaccines (ARV) and Snake Venom Antiserum for over a month. Rural bite victims are turned away and forced to travel 50 km to district headquarters. Immediate emergency restocking of essential medicines needed.",
            "cause": "Supply chain indent failure between district drug warehouse and rural block pharmacy",
            "req_action": "Dispatch emergency replenishment consignment of anti-rabies and anti-venom vials to PHC"
        }
    ],

    "Food & Public Distribution": [
        {
            "subcat": "Ration Dealer Distributing Substandard Grains",
            "type": "PDS Adulteration",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "High",
            "title": "Fair Price Shop Dealer Distributing Moldy Rotten Rice and Weevil-Infested Wheat",
            "desc": "The government ration shop dealer (FPS License 104) on {street} near {landmark} in {district} is forcibly distributing black, foul-smelling rice containing stones and weevil-infested wheat flour to Antyodaya and NFSA cardholders. When consumers object, the dealer refuses to dispense their monthly quota. Food & Supplies inspection and license suspension requested.",
            "cause": "Distribution of damaged warehouse grain stock and siphoning of good quality PDS rations",
            "req_action": "Order Food & Supplies Inspector raid on ration shop, seize grain samples, and suspend dealer license"
        },
        {
            "subcat": "Overcharging and Siphoning PDS Sugar and Kerosene",
            "type": "PDS Corruption",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.5, "time_sen": "High",
            "title": "Ration Dealer Charging Illegal Surcharge of INR 10 Per Kg Above Official Rate",
            "desc": "A fair price shop owner near {landmark} in {district} is demanding an unauthorized cash surcharge on free food grains and selling subsidized kerosene in the black market to local commercial workshops. Electronic PoS slips are not handed to poor citizens. Departmental audit and strict action requested.",
            "cause": "Extortionate illegal surcharge and black marketing of subsidized public distribution commodities",
            "req_action": "Audit electronic Point-of-Sale (ePoS) records and initiate penal proceedings under Essential Commodities Act"
        }
    ],

    "Consumer Affairs": [
        {
            "subcat": "MRP Violation & Overcharging",
            "type": "Consumer Protection Violation",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 3.0, "time_sen": "Standard",
            "title": "Retail Shop Charging INR 10 Above Printed MRP on Dairy and Packaged Goods",
            "desc": "A commercial retail supermarket on {street} near {landmark} in {district} is systematically charging INR 10 to INR 15 above the printed Maximum Retail Price (MRP) on milk packets, cold drinks, and packaged infant cereals under the excuse of 'chilling costs'. Retail cash receipts showing the overcharge are attached. Legal Metrology inspection and penalty requested.",
            "cause": "Illegal price gouging violating Legal Metrology (Packaged Commodities) Rules",
            "req_action": "Deploy Legal Metrology Inspector to conduct surprise test-purchase and penalize retailer"
        },
        {
            "subcat": "Defective Appliance Warranty Refusal",
            "type": "Defective Product Grievance",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 4.0, "time_sen": "Standard",
            "title": "Authorized Service Center Refusing Warranty Replacement for Faulty Refrigerator",
            "desc": "The complainant purchased a brand-new domestic refrigerator from an authorized dealer near {landmark} in {district} with a three-year comprehensive manufacturer warranty. The cooling compressor failed within ten days of purchase. The service center technician visited, acknowledged internal gas leakage, but now refuses replacement or refund. Consumer affairs mediation requested.",
            "cause": "Deficiency in service and unfair trade practice under Consumer Protection Act",
            "req_action": "Issue statutory notice to appliance manufacturer and service agency for conciliation and replacement"
        }
    ],

    "Education – Schools": [
        {
            "subcat": "School Infrastructure Structural Cracks",
            "type": "School Infrastructure Hazard",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 2.0, "time_sen": "High",
            "title": "Dilapidated Primary School Classroom Roof Leaking and Plaster Falling on Students",
            "desc": "The concrete ceiling of two primary classrooms at the government primary school near {landmark} in {district} is crumbling. During rains, plaster chunks fell onto student benches, narrowly missing young children. Over 150 students are now forced to sit squeezed in a single hallway. Urgent structural renovation and roof waterproofing required.",
            "cause": "Long-term water seepage through school building terrace deteriorating structural reinforcement",
            "req_action": "Inspect structural safety via District Inspector of Schools and release emergency repair sanction"
        },
        {
            "subcat": "Mid-Day Meal Quality & Unhygienic Kitchen",
            "type": "School Meal Safety",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 1.5, "time_sen": "High",
            "title": "Unhygienic Cooking Conditions and Worms Found in School Mid-Day Meal",
            "desc": "Parents of students attending the upper primary school near {landmark} in {district} discovered live insects and dead insects inside the cooked khichdi served during mid-day meal today. The cooking shed has dirty stagnant water and no hand-washing soap. Multiple students complained of stomach ache. School education department inspection requested.",
            "cause": "Unclean food preparation storage and lack of hygiene compliance in school mid-day meal scheme",
            "req_action": "Dispatch Block Education Officer (BEO) to inspect mid-day meal food stock and kitchen sanitation"
        }
    ],

    "Higher Education": [
        {
            "subcat": "College Marks Sheet and Degree Certificate Delay",
            "type": "University Administrative Grievance",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 4.0, "time_sen": "Standard",
            "title": "University Withholding Undergraduate Final Degree Certificate for 10 Months",
            "desc": "A graduate from the undergraduate college near {landmark} in {district} completed all degree requirements and passed all examinations ten months ago. The university examination department has repeatedly failed to dispatch the original degree certificate and consolidated marksheet, jeopardizing the student's job joining deadline. Immediate issuance requested.",
            "cause": "Administrative backlog and delayed printing of convocation certificates at state university",
            "req_action": "Direct University Controller of Examinations to issue verified provisional degree certificate"
        },
        {
            "subcat": "Higher Education Scholarship Disbursement Delay",
            "type": "Higher Education Financial Aid",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 3.5, "time_sen": "Standard",
            "title": "SVMCM Higher Education Scholarship Grant Pending at University Level",
            "desc": "Complainant is a master's student studying at the government college near {landmark} in {district}. Their Swami Vivekananda Merit-cum-Means (SVMCM) scholarship application was verified and forwarded seven months ago, but the state scholarship portal still indicates 'Pending at University Nodal Officer'. Directing college to verify grant requested.",
            "cause": "Pending digital certificate authentication by college institutional nodal officer",
            "req_action": "Direct College Principal and Scholarship Nodal Officer to complete institutional verification"
        }
    ],

    "Labour & Employment": [
        {
            "subcat": "Unpaid Minimum Wages & Contractor Exploitation",
            "type": "Labour Rights Violation",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 3.0, "time_sen": "High",
            "title": "Contractor Withholding Statutory Minimum Wages for 40 Construction Workers",
            "desc": "A civil construction labour contractor working on a commercial site near {landmark} in {district} has not paid weekly wages to 40 daily-wage migrant construction workers for the past two months. Workers and their families have no money for basic food and medical needs. Labour department conciliation and wage recovery under Minimum Wages Act requested.",
            "cause": "Illegal withholding of earned wages by private construction labour subcontractor",
            "req_action": "Summon labour contractor before Assistant Labour Commissioner (ALC) and recover unpaid wages"
        },
        {
            "subcat": "Workplace Fatality / Industrial Injury Compensation",
            "type": "Workplace Accident Compensation",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 1, "res_days": 1.5, "time_sen": "Immediate",
            "title": "Worker Crushed in Industrial Rolling Mill - Employer Refusing Compensation",
            "desc": "A factory worker sustained fatal crush injuries while operating an unshielded steel rolling machine at an industrial factory on {street} near {landmark} in {district}. The factory owner is refusing to pay statutory compensation under the Employee's Compensation Act and has threatened the grieving family. Labour Department industrial safety inspection and claim enforcement requested.",
            "cause": "Industrial workplace safety negligence and absence of machinery safety interlocks",
            "req_action": "Initiate industrial safety inquiry through Factory Inspector and calculate statutory compensation claim"
        }
    ],

    "Agriculture": [
        {
            "subcat": "Agricultural Irrigation Canal Dry During Sowing Season",
            "type": "Agricultural Irrigation Failure",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.5, "time_sen": "High",
            "title": "Government Irrigation Canal Dry - Over 400 Bighas of Boro Paddy Withering",
            "desc": "Farmers in the agricultural belt near {landmark} in {district} are in acute distress as the state irrigation feeder canal has been dry for over three weeks during the critical transplantation stage of Boro paddy. The barrage sluice gate remains unoperated. Without irrigation water, crops worth lakhs will wither. Urgent canal water discharge requested.",
            "cause": "Uncoordinated canal sluice gate operation and siltation at river barrage intake",
            "req_action": "Direct Irrigation & Waterways divisional engineer to open feeder canal sluice gates"
        },
        {
            "subcat": "Artificial Shortage and Black Marketing of Urea Fertilizer",
            "type": "Agricultural Input Hoarding",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "High",
            "title": "Fertilizer Retailers Creating Artificial Scarcity and Selling Urea at Double Price",
            "desc": "Licensed agricultural input dealers in the block market near {landmark} in {district} are hoarding government-subsidized Urea and DAP fertilizers, falsely claiming zero stock to farmers while selling bags out the back door at INR 650 instead of the government statutory price of INR 266. Agricultural department raid and distribution enforcement needed.",
            "cause": "Illegal hoarding and black marketing of subsidized chemical fertilizers during peak sowing season",
            "req_action": "Conduct joint inspection by Assistant Director of Agriculture (ADA) and seal unauthorized godowns"
        }
    ],

    "Animal Resources": [
        {
            "subcat": "Rabid Stray Dog Menace Endangering Pedestrians",
            "type": "Animal Menace and Rabies Hazard",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 0, "res_days": 1.0, "time_sen": "Immediate",
            "title": "Aggressive Stray Dogs Menacing and Biting Pedestrians Near Primary School",
            "desc": "A pack of aggressive stray dogs, including one exhibiting frothing rabies symptoms, is roaming {street} near {landmark} in {district}. Five pedestrians and two primary school students have suffered severe bite wounds in the past 48 hours. Parents are afraid to send children to school. Immediate Animal Birth Control (ABC) and rabies isolation needed.",
            "cause": "Unvaccinated aggressive stray dog pack proliferation and suspected canine rabies",
            "req_action": "Deploy veterinary animal rescue team to capture suspected rabid dog and conduct vaccination drive"
        },
        {
            "subcat": "Stray Cattle Blocking Arterial Roadway",
            "type": "Livestock Obstruction",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 2.5, "time_sen": "Standard",
            "title": "Unattended Stray Cattle Causing Daily Traffic Collisions on Highway",
            "desc": "Over thirty unattended stray cows and bulls congregate every day on the highway stretch on {street} near {landmark} in {district}. At night, poor visibility leads to frequent motorcycle and vehicle crashes. The cattle are abandoned by illegal dairy owners. Impounding of cattle in municipal sheds requested.",
            "cause": "Uncontrolled abandonment of commercial dairy cattle on public roads",
            "req_action": "Round up stray cattle using municipal animal transport vehicles and transfer to designated cattle shelters"
        }
    ],

    "Forest & Wildlife": [
        {
            "subcat": "Wild Elephant Herd Incursion into Village",
            "type": "Human-Wildlife Conflict",
            "prio": "CRITICAL", "sev": "Critical", "is_crime": 0, "is_emg": 1, "review": 1, "res_days": 0.5, "time_sen": "Immediate",
            "title": "Wild Elephant Herd Enters Agricultural Village - Huts and Crops Damaged",
            "desc": "A herd of eight wild elephants has crossed the forest boundary and entered agricultural farmland near {landmark} in {district}. Three mud houses have been crushed and standing crops destroyed. Villagers are panicking and burning tires to drive them away, creating extreme danger of stampede. Immediate Forest Department Hula squad deployment needed.",
            "cause": "Elephant corridor obstruction causing wild herd diversion into human habitations",
            "req_action": "Deploy Forest Department wildlife squad equipped with tranquilizers and searchlights to herd elephants safely"
        },
        {
            "subcat": "Illegal Timber Felling in Reserved Forest",
            "type": "Forest Resource Protection",
            "prio": "HIGH", "sev": "High", "is_crime": 1, "is_emg": 0, "review": 0, "res_days": 2.0, "time_sen": "High",
            "title": "Illegal Tree Cutting and Smuggling of Sal and Teak Timber in Protected Forest",
            "desc": "Organized timber poachers are operating illegal power saws inside the reserved forest block near {landmark} in {district}. Century-old Sal and Teak trees are being cut down and loaded onto modified trucks under darkness. Vehicle tracks and severed tree trunks are clearly visible. Forest ranger patrolling and interception requested.",
            "cause": "Illegal deforestation and commercial timber smuggling in protected government forest reserve",
            "req_action": "Dispatch forest ranger patrol team to seize smuggled timber logs and impound smuggling vehicles"
        }
    ],

    "Public Grievance / General Administration": [
        {
            "subcat": "Delay in Government Service Delivery (Trade License / Caste)",
            "type": "Administrative Red Tape / RTPS Violation",
            "prio": "MEDIUM", "sev": "Medium", "is_crime": 0, "is_emg": 0, "review": 0, "res_days": 4.0, "time_sen": "Standard",
            "title": "Severe Delay in Issuance of Caste Certificate Applied 6 Months Ago",
            "desc": "The citizen submitted an online application for an SC/OBC caste certificate at the BDO office near {landmark} in {district} six months ago (Application Ref: WB/2026/CAST/49102). All inquiry documents and lineage genealogy proofs were submitted. The citizen needs this certificate urgently for university admission deadlines, but the file is stuck without cause. Grievance redressal requested.",
            "cause": "Procedural backlog and delayed administrative clearance under Right to Public Services Act",
            "req_action": "Direct Block Development Officer (BDO) to conduct immediate file review and issue certificate"
        },
        {
            "subcat": "Bribery Demand and Harassment by Municipal Dealing Assistant",
            "type": "Administrative Corruption Grievance",
            "prio": "HIGH", "sev": "High", "is_crime": 0, "is_emg": 0, "review": 1, "res_days": 3.0, "time_sen": "High",
            "title": "Undue Harassment and Unofficial Fee Demanded for Trade License Renewal",
            "desc": "A small business shopkeeper applying for statutory trade license renewal at the municipal borough office near {landmark} in {district} has been harassed for four weeks. The dealing clerk refused to accept standard challan fees and demanded an unofficial payment of INR 3,000 to clear the file. High-level administrative vigilance intervention requested.",
            "cause": "Corrupt extortion of unofficial gratification by municipal administrative staff",
            "req_action": "Refer matter to District Anti-Corruption & Vigilance Cell for administrative inquiry"
        }
    ]
}

STREET_NAMES = [
    "Station Road", "Grand Trunk Road", "Bypass Connector", "Hospital Link Road", "Market Main Street",
    "College Road", "Kacharibari Lane", "Ferry Ghat Approach", "Barasat Road", "Industrial Estate Road"
]

PHRASING_STYLES = [
    lambda title, desc: f"{title} — {desc}",
    lambda title, desc: f"Urgent Complaint Regarding {title}: {desc}",
    lambda title, desc: f"{desc} Therefore, immediate administrative attention is requested regarding: {title}.",
    lambda title, desc: f"Grievance Report: {title}. Full details as follows: {desc}",
    lambda title, desc: f"To the Concerned Authority: I am writing to report that {desc.lower()} Please take prompt action.",
    lambda title, desc: f"Formal Citizen Petition: {title} — {desc}",
    lambda title, desc: f"Civic Alert: {title}. {desc} Necessary official intervention is urgently solicited.",
    lambda title, desc: f"{desc}"
]

def generate_expanded_dataset(records_per_dept: int = 600) -> pd.DataFrame:
    records = []
    
    print(f"Generating {records_per_dept * len(DEPARTMENT_INCIDENT_PATTERNS)} total records across {len(DEPARTMENT_INCIDENT_PATTERNS)} departments...")

    for dept, patterns in DEPARTMENT_INCIDENT_PATTERNS.items():
        count_for_dept = 0
        while count_for_dept < records_per_dept:
            pattern = random.choice(patterns)
            dist_info = random.choice(WB_DISTRICTS)
            landmark = random.choice(dist_info["landmarks"])
            street = random.choice(STREET_NAMES)
            district = dist_info["district"]
            thana = dist_info["thana"]
            subdivision = dist_info["subdivision"]
            loc_type = dist_info["type"]

            title = pattern["title"].format(street=street, landmark=landmark, district=district)
            raw_desc = pattern["desc"].format(street=street, landmark=landmark, district=district)

            phrasing_func = random.choice(PHRASING_STYLES)
            full_text = phrasing_func(title, raw_desc)

            affected = random.choice([15, 30, 50, 80, 150, 250, 500, 1200, 2500])
            duration = random.choice([0.5, 1.0, 2.0, 3.0, 4.0, 5.0, 7.0, 14.0])
            ward_num = random.randint(1, 45)

            sec_depts = []
            if dept == "Traffic & Road Safety" and pattern.get("is_crime", 0) == 1:
                sec_depts = ["Police & Law Enforcement"]
            elif dept == "Building & Municipal Engineering" and "Collapse" in pattern.get("type", ""):
                sec_depts = ["Fire & Emergency Services"]
            elif dept == "Health & Hospitals" and pattern.get("is_crime", 0) == 1:
                sec_depts = ["Police & Law Enforcement"]
            elif dept == "Drainage & Sewerage" and "Waterlogging" in pattern.get("title", ""):
                sec_depts = ["Roads & Public Works"]
            elif dept == "Street Lighting & Electrical" and "Wire" in pattern.get("title", ""):
                sec_depts = ["Electricity & Power"]

            record = {
                "complaint_id": f"CP-WB-{len(records)+10001}",
                "category": dept,
                "subcategory": pattern["subcat"],
                "incident_type": pattern["type"],
                "priority": pattern["prio"],
                "severity": pattern["sev"],
                "district": district,
                "police_station": thana,
                "subdivision": subdivision,
                "location_type": loc_type,
                "landmark": landmark,
                "ward": f"Ward {ward_num}",
                "affected_citizens": affected,
                "duration_days": duration,
                "is_crime": pattern["is_crime"],
                "is_emergency": pattern["is_emg"],
                "requires_human_review": pattern["review"],
                "resolution_days": pattern["res_days"],
                "probable_cause": pattern["cause"],
                "recommended_action": pattern["req_action"],
                "secondary_departments": ", ".join(sec_depts) if sec_depts else "None",
                "complaint_text": full_text
            }
            records.append(record)
            count_for_dept += 1

    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    df = generate_expanded_dataset(600)
    data_dir = os.path.dirname(os.path.abspath(__file__))
    out_csv = os.path.join(data_dir, "civic_complaints_dataset.csv")
    df.to_csv(out_csv, index=False, encoding="utf-8")
    print(f"Successfully generated total {len(df)} records across {df['category'].nunique()} canonical departments and 23 districts.")
    print(f"Saved expanded dataset to {out_csv}")
