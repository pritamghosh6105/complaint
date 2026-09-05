import os
import sys
import random
import pandas as pd
import numpy as np

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Set random seed for reproducibility
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

# -------------------------------------------------------------------------
# COMPREHENSIVE DEFINITIONS FOR ALL 30 DEPARTMENTS WITH BALANCED PRIORITIES
# Each category has specific templates for: LOW, MEDIUM, HIGH, CRITICAL
# Including English, Bengali (বাংলা), and Hindi (हिन्दी)
# -------------------------------------------------------------------------

CATEGORIES_DATA = {
    "Police & Law Enforcement": {
        "dept": "Police & Law Enforcement",
        "subcategories": ["Theft / Burglary", "Physical Assault", "Robbery / Snatching", "Public Violence / Rioting", "Missing Person", "Extortion / Threat"],
        "is_crime": 1,
        "base_res_days": 1.5,
        "priorities": {
            "LOW": [
                ("Theft / Burglary", "Misplaced my house keys somewhere on {street}. Reporting as a minor lost property entry.", "Lost Property Report"),
                ("Theft / Burglary", "Bicycle lock was tampered with near {landmark} but bicycle is intact.", "Tampered Lock Inquiry"),
                ("Theft / Burglary", "বাজারের কাছে আমার চাবি হারিয়ে গেছে, একটি সাধারণ ডায়েরি করতে চাই।", "হারিয়ে যাওয়া সামগ্রীর ডায়েরি"),
                ("Theft / Burglary", "{street} पर मेरे घर की चाबी कहीं गिर गई है। सामान्य शिकायत दर्ज करवानी है।", "खोई हुई वस्तु की सूचना")
            ],
            "MEDIUM": [
                ("Theft / Burglary", "Someone stole my bicycle yesterday from outside {landmark} parking.", "Bicycle Stolen Yesterday"),
                ("Extortion / Threat", "Noise complaint regarding loud late night gathering near {street} causing disturbance.", "Late Night Public Disturbance"),
                ("Theft / Burglary", "কালকে {landmark}-এর সামনে থেকে আমার সাইকেলটি চুরি হয়ে গেছে।", "সাইকেল চুরির অভিযোগ"),
                ("Theft / Burglary", "कल {street} पर मेरी साइकिल चोरी हो गई। कृपया उचित कार्रवाई करें।", "साइकिल चोरी की शिकायत")
            ],
            "HIGH": [
                ("Theft / Burglary", "Someone broke into my house last night at {street} and stole ₹50,000 cash and gold jewelry.", "Residential House Burglary"),
                ("Extortion / Threat", "Local goons demanding extortion money and threatening shopkeepers with violence near {landmark}.", "Extortion & Intimidation of Traders"),
                ("Theft / Burglary", "গত রাতে {street}-এ আমাদের বাড়িতে তালা ভেঙে নগদ টাকা ও গহনা চুরি করা হয়েছে।", "বাড়িতে সিঁধ কেটে চুরি"),
                ("Extortion / Threat", "{landmark} के व्यापारियों से असामाजिक तत्व जबरन वसूली कर रहे हैं और धमकियां दे रहे हैं।", "जबरन वसूली की शिकायत")
            ],
            "CRITICAL": [
                ("Physical Assault", "Someone is attacking a person right now with lethal weapons on {street}. Bloodshed and life in grave danger!", "Active Violent Assault in Progress"),
                ("Public Violence / Rioting", "Active armed mob clash on {street} near {landmark} with crude bombs and firing. Immediate police intervention required!", "Active Armed Riot & Public Violence"),
                ("Physical Assault", "এই মুহূর্তে {street}-এ একজন ব্যক্তিকে ধারালো অস্ত্র দিয়ে আক্রমণ করা হচ্ছে, অবিলম্বে পুলিশ পাঠান!", "সরাসরি প্রাণঘাতী আক্রমণ"),
                ("Physical Assault", "{street} पर इस वक्त एक व्यक्ति पर जानलेवा हमला हो रहा है, तुरंत पुलिस भेजिए!", "सक्रिय जानलेवा हमला")
            ]
        }
    },
    "Cyber Crime": {
        "dept": "Cyber Crime",
        "subcategories": ["UPI / Payment Fraud", "Net Banking Fraud", "Phishing / Scam Calls", "Account Hacking", "Cyber Harassment / Stalking", "Identity Theft"],
        "is_crime": 1,
        "base_res_days": 2.0,
        "priorities": {
            "LOW": [
                ("Phishing / Scam Calls", "A suspicious message asking for my bank OTP was received, but I did not share it.", "Suspicious Phishing SMS"),
                ("Phishing / Scam Calls", "Received promotional spam call claiming lottery winnings. Reporting number.", "Spam Call Report"),
                ("Phishing / Scam Calls", "ব্যাংক ওটিপি চেয়ে একটি সন্দেহজনক মেসেজ পেয়েছি, তবে আমি কোনও তথ্য দিইনি।", "সন্দেহজনক ফিশিং মেসেজ"),
                ("Phishing / Scam Calls", "बैंक ओटीपी मांगने वाला एक संदिग्ध मैसेज आया, हालांकि मैंने कोई जानकारी नहीं दी।", "संदिग्ध फिशिंग मैसेज")
            ],
            "MEDIUM": [
                ("Account Hacking", "Someone created an unauthorized fake profile using my public photo on Facebook.", "Unauthorized Social Media Impersonation"),
                ("Phishing / Scam Calls", "Persistent spam callers harassing our business number despite DND activation.", "Persistent Telemarketing Harassment"),
                ("Account Hacking", "ফেসবুকে আমার ছবি ব্যবহার করে কেউ একটি নকল অ্যাকাউন্ট খুলেছে।", "নকল সোশ্যাল মিডিয়া প্রোফাইল"),
                ("Account Hacking", "मेरी तस्वीर का उपयोग करके सोशल मीडिया पर फर्जी खाता बनाया गया है।", "फर्जी सोशल मीडिया प्रोफाइल")
            ],
            "HIGH": [
                ("UPI / Payment Fraud", "My bank account was charged ₹25,000 due to an online fraud after clicking a fake electricity bill link.", "Fraudulent Online Bank Debit ₹25,000"),
                ("Net Banking Fraud", "Unauthorized fraudulent net banking transfers totaling ₹80,000 drained from savings account.", "Unauthorized Bank Transfer ₹80,000"),
                ("UPI / Payment Fraud", "ভুয়ো লিঙ্কে ক্লিক করার পর আমার ব্যাংক অ্যাকাউন্ট থেকে ২৫,০০০ টাকা জালিয়াতি করে কেটে নেওয়া হয়েছে।", "অনলাইন ব্যাংক জালিয়াতি"),
                ("UPI / Payment Fraud", "ऑनलाइन धोखाधड़ी के कारण मेरे बैंक खाते से ₹25,000 की अवैध निकासी हो गई है।", "अवैध ऑनलाइन बैंक ट्रांसफर")
            ],
            "CRITICAL": [
                ("Net Banking Fraud", "Large ongoing cyber heist: over ₹10 Lakhs actively being siphoned from corporate payroll account right now! Freeze accounts immediately!", "Emergency Live Cyber Heist in Progress"),
                ("Cyber Harassment / Stalking", "Extremist cyber extortionist threatening to release fabricated morphed images within 15 minutes unless ransom paid.", "Immediate Life-Threatening Cyber Blackmail"),
                ("Net Banking Fraud", "জরুরি: আমাদের প্রতিষ্ঠানের ব্যাংক অ্যাকাউন্ট থেকে এই মুহূর্তে লক্ষাধিক টাকা চুরি হচ্ছে, দ্রুত ফ্রিজ করুন!", "লাইভ সাইবার ব্যাংক জালিয়াতি"),
                ("Net Banking Fraud", "आपातकालीन: बैंक खाते से लाइव ऑनलाइन पैसे निकाले जा रहे हैं, तुरंत लेनदेन रोकें!", "सक्रिय ऑनलाइन बैंक फ्रॉड")
            ]
        }
    },
    "Women & Child Safety": {
        "dept": "Women & Child Safety",
        "subcategories": ["Street Harassment / Eve Teasing", "Domestic Violence", "Child Abuse / Neglect", "Workplace Harassment", "Stalking", "Child Labour"],
        "is_crime": 1,
        "base_res_days": 1.2,
        "priorities": {
            "LOW": [
                ("Street Harassment / Eve Teasing", "Streetlight near women's community center is broken; requested better illumination for peace of mind.", "Lighting Request Near Community Center"),
                ("Street Harassment / Eve Teasing", "Requesting women safety awareness pamphlet distribution at {landmark}.", "Awareness Program Request"),
                ("Street Harassment / Eve Teasing", "মহিলা সমিতির অফিসের সামনে আলো কম, এখানে আরও একটি বাতি লাগানোর অনুরোধ।", "মহিলা কেন্দ্রের সামনে বাতির অনুরোধ"),
                ("Street Harassment / Eve Teasing", "महिला केंद्र के पास स्ट्रीट लाइट धीमी है, अतिरिक्त प्रकाश की व्यवस्था की जाए।", "महिला केंद्र के पास प्रकाश की मांग")
            ],
            "MEDIUM": [
                ("Street Harassment / Eve Teasing", "Group of loiterers regularly passing nuisance comments outside girls school near {landmark} in the afternoon.", "Loitering Outside Girls School"),
                ("Street Harassment / Eve Teasing", "Dark stretch of road on {street} feels uncomfortable for female commuters returning late.", "Uncomfortable Dark Transit Stretch"),
                ("Street Harassment / Eve Teasing", "স্কুল ছুটির সময় {landmark}-এর সামনে কিছু বখাটে ছেলে দাঁড়িয়ে অযথা ভিড় করছে।", "স্কুলের সামনে বখাটেদের উপদ্রব"),
                ("Street Harassment / Eve Teasing", "शाम के समय {street} पर महिलाओं के लिए पुलिस गश्त बढ़ाने की जरूरत है।", "शाम की पुलिस गश्त की मांग")
            ],
            "HIGH": [
                ("Stalking", "A woman is being repeatedly followed and harassed while returning home from work along {street}.", "Repeated Stalking & Harassment of Woman"),
                ("Child Abuse / Neglect", "Child safety concern reported at private coaching center near {landmark}; physical abuse suspected.", "Child Safety Concern at Coaching Center"),
                ("Stalking", "বাড়ি ফেরার পথে {street}-এ একজন নারীকে ক্রমাগত অনুসরণ ও হেনস্থা করা হচ্ছে।", "নারীকে ক্রমাগত অনুসরণ ও হেনস্থা"),
                ("Stalking", "{street} पर घर लौटते समय एक महिला का लगातार पीछा किया जा रहा है और परेशान किया जा रहा है।", "महिला का लगातार पीछा और छेड़छाड़")
            ],
            "CRITICAL": [
                ("Street Harassment / Eve Teasing", "A woman is being physically attacked right now on {street}! Urgent police and emergency rescue needed immediately!", "Woman Under Active Physical Attack"),
                ("Child Abuse / Neglect", "A child is currently in immediate danger and being dragged into a vehicle on {street}! Save the child now!", "Child in Immediate Danger / Abduction"),
                ("Street Harassment / Eve Teasing", "একজন নারীর উপর এই মুহূর্তে {street}-এ শারীরিক আক্রমণ করা হচ্ছে, অবিলম্বে পুলিশ বাঁচান!", "নারীর উপর সরাসরি শারীরিক আক্রমণ"),
                ("Child Abuse / Neglect", "একটি শিশু এই মুহূর্তে {landmark}-এর কাছে চরম বিপদের মধ্যে আছে, দ্রুত সাহায্য পাঠান!", "শিশু চরম বিপদে")
            ]
        }
    },
    "Traffic & Road Safety": {
        "dept": "Traffic & Road Safety",
        "subcategories": ["Dangerous / Rash Driving", "Traffic Signal Failure", "Illegal / Obstructive Parking", "Traffic Congestion", "Speeding / Drag Racing", "Missing Road Signage"],
        "is_crime": 0,
        "base_res_days": 2.0,
        "priorities": {
            "LOW": [
                ("Missing Road Signage", "Speed breaker marking is faded near {landmark}. Needs fresh white paint.", "Faded Speed Breaker Paint"),
                ("Missing Road Signage", "Street name sign board is slightly tilted on {street}.", "Tilted Sign Board"),
                ("Missing Road Signage", "{street}-এ স্পিড ব্রেকারের সাদা রঙ ফিকে হয়ে গেছে, পুনরায় রঙের আবেদন।", "স্পিড ব্রেকার রঙ ফিকে"),
                ("Missing Road Signage", "{street} पर स्पीड ब्रेकर का सफेद पेंट हल्का पड़ गया है।", "स्पीड ब्रेकर पेंट की मरम्मत")
            ],
            "MEDIUM": [
                ("Traffic Congestion", "Traffic signal timer at {landmark} is mistimed, causing 15 minute delays during rush hour.", "Signal Timer Synchronization Required"),
                ("Illegal / Obstructive Parking", "Taxis parking haphazardly near {landmark} bus terminus causing slow vehicle movement.", "Haphazard Commercial Parking"),
                ("Traffic Congestion", "{landmark} মোড়ে সিগন্যাল টাইমার ঠিকমতো কাজ না করায় যানজট তৈরি হচ্ছে।", "সিগন্যাল টাইমার সমস্যা"),
                ("Illegal / Obstructive Parking", "{street} पर अनियंत्रित पार्किंग के कारण वाहनों की आवाजाही धीमी हो रही है।", "अव्यवस्थित पार्किंग")
            ],
            "HIGH": [
                ("Dangerous / Rash Driving", "Dump trucks driving at reckless speeds along {street} near school zone with repeated near misses.", "Reckless Heavy Vehicle Driving Near School"),
                ("Traffic Signal Failure", "Main traffic light completely failed at busy {landmark} intersection, vehicles crossing blindly and accidents occurring.", "Major Intersection Signal Outage"),
                ("Dangerous / Rash Driving", "স্কুল সংলগ্ন {street}-এ ভারী লরিগুলি বিপজ্জনক গতিতে চলছে, দুর্ঘটনার মারাত্মক ঝুঁকি।", "স্কুল এলাকায় দ্রুতগতির লরি"),
                ("Traffic Signal Failure", "{landmark} मुख्य चौराहे पर ट्रैफिक लाइट बंद होने से गंभीर जाम और दुर्घटना की आशंका है।", "व्यस्त चौराहे पर ट्रैफिक सिग्नल बंद")
            ],
            "CRITICAL": [
                ("Dangerous / Rash Driving", "Massive multi-vehicle collision on highway near {landmark}; fuel leaking from tanker onto road, explosion imminent!", "Massive Highway Collision & Fuel Leak Hazard"),
                ("Dangerous / Rash Driving", "Speeding out-of-control truck rammed into market crowd on {street}! Multiple casualties lying on road!", "Major Vehicle Crash Into Pedestrians"),
                ("Dangerous / Rash Driving", "হাইওয়েতে তেলবাহী ট্যাংকার উল্টে গিয়ে রাস্তায় পেট্রোল ছড়িয়ে পড়েছে, অগ্নিকাণ্ডের চরম বিপদ!", "তেলবাহী ট্যাংকার দুর্ঘটনা ও বিস্ফোরণ ঝুঁকি"),
                ("Dangerous / Rash Driving", "{street} पर भीषण सड़क हादसा, तेल रिसाव और लोगों के दबे होने की आपातकालीन स्थिति!", "भीषण सड़क दुर्घटना")
            ]
        }
    },
    "Roads & Public Works": {
        "dept": "Roads & Public Works",
        "subcategories": ["Pothole / Crater", "Broken / Eroded Road", "Damaged Bridge / Flyover", "Road Cave-in / Sinkhole", "Missing Road Markings", "Broken Divider / Railing"],
        "is_crime": 0,
        "base_res_days": 3.0,
        "priorities": {
            "LOW": [
                ("Pothole / Crater", "Minor pothole with no immediate danger on quiet colony lane near {street}.", "Minor Residential Lane Pothole"),
                ("Broken Divider / Railing", "Small chip in concrete curb stone near {landmark} garden.", "Chipped Curb Stone"),
                ("Pothole / Crater", "আমাদের পাড়ার গলির রাস্তায় একটি ছোট গর্ত হয়েছে, কোনও জরুরি বিপদ নেই।", "গলির রাস্তায় ছোট গর্ত"),
                ("Pothole / Crater", "आवासीय कॉलोनी की शांत सड़क पर एक छोटा सा गड्ढा है, कोई तत्काल खतरा नहीं है।", "कॉलोनी की सड़क पर छोटा गड्ढा")
            ],
            "MEDIUM": [
                ("Pothole / Crater", "Significant pothole affecting neighborhood traffic speed and causing uneven ride on {street}.", "Moderate Pothole on Sub-Arterial Road"),
                ("Broken / Eroded Road", "Asphalt surface worn out for 100 meters along {street}, gravel spreading on road.", "Eroded Top Surface"),
                ("Pothole / Crater", "{street}-এ বেশ কিছু গর্তের কারণে গাড়ি ধীরগতিতে চলছে এবং যাতায়াতে অসুবিধা হচ্ছে।", "রাস্তার গর্তের কারণে সমস্যা"),
                ("Pothole / Crater", "{street} पर सड़क उखड़ गई है और गड्ढों से वाहनों की गति धीमी हो रही है।", "सड़क पर गड्ढे और परेशानी")
            ],
            "HIGH": [
                ("Pothole / Crater", "A major pothole on a busy road is causing vehicles to suddenly brake and accidents are becoming likely on {street}.", "Dangerous Deep Pothole on Busy Road"),
                ("Broken Divider / Railing", "Damaged concrete road divider with sharp iron rods protruding into driving lane on {street}.", "Protruding Iron Rods From Divider"),
                ("Pothole / Crater", "ব্যস্ত রাস্তায় একটি বড় গর্তের কারণে গাড়ি হঠাৎ ব্রেক কষছে এবং দুর্ঘটনার আশঙ্কা তৈরি হয়েছে।", "ব্যস্ত রাস্তায় বিপজ্জনক গর্ত"),
                ("Pothole / Crater", "व्यस्त सड़क पर बड़े गड्ढे के कारण वाहन अचानक ब्रेक लगा रहे हैं और दुर्घटना की संभावना बढ़ गई है।", "व्यस्त सड़क पर जानलेवा गड्ढा")
            ],
            "CRITICAL": [
                ("Road Cave-in / Sinkhole", "Massive road cave-in and 15-foot sinkhole opened up in middle of {street}; vehicles falling in, collapse spreading!", "Catastrophic Road Cave-in & Sinkhole"),
                ("Damaged Bridge / Flyover", "Major structural crack visible on bridge pier on {street}; bridge vibrating violently under load, collapse imminent!", "Critical Bridge Pier Structural Failure"),
                ("Road Cave-in / Sinkhole", "{street}-এ রাস্তার মাঝখানে বিশাল ধস নেমে রাস্তা ভেঙে পড়েছে, যেকোনও মুহূর্তে প্রাণহানি হতে পারে!", "রাস্তায় বিশাল ধস"),
                ("Damaged Bridge / Flyover", "पुल के खंभे में भारी दरार आ गई है और पुल हिल रहा है, तत्काल यातायात रोकें!", "पुल टूटने का गंभीर खतरा")
            ]
        }
    },
    "Drainage & Sewerage": {
        "dept": "Drainage & Sewerage",
        "subcategories": ["Open / Missing Manhole", "Sewage Water Overflow", "Blocked / Clogged Drain", "Waterlogging / Stagnant Water", "Broken Drain Cover", "Foul Sewer Odor"],
        "is_crime": 0,
        "base_res_days": 2.5,
        "priorities": {
            "LOW": [
                ("Waterlogging / Stagnant Water", "Small puddle beside roadside garden curb on {street} after watering plants.", "Minor Roadside Water Puddle"),
                ("Foul Sewer Odor", "Mild gutter odor noticeable when walking past drain culvert on {street}.", "Mild Drain Odor Notice"),
                ("Waterlogging / Stagnant Water", "{street}-এ ফুটপাথের ধারে সামান্য জল জমে আছে, কোনও জরুরি বিপদ নেই।", "ফুটপাথের ধারে সামান্য জল"),
                ("Waterlogging / Stagnant Water", "सड़क के किनारे थोड़ा सा पानी जमा है, कोई आपातकालीन समस्या नहीं है।", "सड़क किनारे सामान्य जलभराव")
            ],
            "MEDIUM": [
                ("Blocked / Clogged Drain", "Drain blockage causing minor waterlogging during rains on {street}.", "Blocked Neighborhood Storm Drain"),
                ("Sewage Water Overflow", "Slow drain overflow accumulating near residential gate at {street}.", "Minor Sewage Overflow Near Gate"),
                ("Blocked / Clogged Drain", "নালা আটকে যাওয়ায় বৃষ্টির পর {street}-এ সামান্য জল জমে থাকছে।", "নালা বন্ধ হয়ে জল জমা"),
                ("Blocked / Clogged Drain", "नाली जाम होने से हल्की बारिश में सड़क पर पानी भर रहा है।", "जाम नाली से जलभराव")
            ],
            "HIGH": [
                ("Waterlogging / Stagnant Water", "Severe waterlogging affecting homes and businesses along {street}; dirty water entering ground floor shops.", "Severe Commercial Waterlogging"),
                ("Sewage Water Overflow", "Large sewage line burst flooding residential colony with toxic black wastewater and creating severe health hazard.", "Massive Raw Sewage Overflow"),
                ("Waterlogging / Stagnant Water", "{street}-এ ভয়াবহ জল জমে দোকান ও বাড়ির ভেতরে নোংরা জল ঢুকে পড়েছে।", "মারাত্মক জলমগ্ন এলাকা"),
                ("Sewage Water Overflow", "सीवर का गंदा पानी पूरे आवासीय क्षेत्र में भर गया है जिससे बीमारी फैलने का खतरा है।", "गंभीर सीवर ओवरफ्लो")
            ],
            "CRITICAL": [
                ("Open / Missing Manhole", "An uncovered manhole is directly beside a school entrance on {street} and children could fall into it! Immediate fatality risk!", "Uncovered Manhole at School Gate"),
                ("Open / Missing Manhole", "Open deep sewer manhole submerged under flooded water on {street}; pedestrian already slipped, save them now!", "Submerged Open Manhole Drowning Hazard"),
                ("Open / Missing Manhole", "স্কুলের প্রবেশদ্বারের ঠিক পাশেই একটি ঢাকনাহীন খোলা ম্যানহোল রয়েছে, শিশুরা পড়ে যেতে পারে!", "স্কুলের সামনে খোলা ম্যানহোল"),
                ("Open / Missing Manhole", "स्कूल के गेट के ठीक बगल में खुला गहरा मैनहोल है, बच्चे किसी भी पल गिर सकते हैं!", "स्कूल के पास खुला मैनहोल")
            ]
        }
    },
    "Solid Waste Management": {
        "dept": "Solid Waste Management",
        "subcategories": ["Overflowing Garbage Vat / Bin", "Illegal Open Waste Dumping", "Dead Animal Carcass Removal", "Missed Door-to-Door Collection", "Hazardous Biomedical Waste"],
        "is_crime": 0,
        "base_res_days": 1.8,
        "priorities": {
            "LOW": [
                ("Missed Door-to-Door Collection", "Garbage collection was missed once this week on our lane on {street}.", "Missed Single Waste Collection"),
                ("Overflowing Garbage Vat / Bin", "Small bin in colony park is almost full and needs routine emptying.", "Colony Bin Emptying Request"),
                ("Missed Door-to-Door Collection", "এই সপ্তাহে একদিন আমাদের গলির আবর্জনা সংগ্রহের গাড়ি আসেনি।", "একদিন ময়লা সংগ্রহ বাদ"),
                ("Missed Door-to-Door Collection", "इस सप्ताह एक बार हमारे मोहल्ले से कचरा उठाने वाली गाड़ी नहीं आई।", "कचरा गाड़ी नहीं आई")
            ],
            "MEDIUM": [
                ("Overflowing Garbage Vat / Bin", "Garbage has been accumulating for several days in our residential area vat near {landmark}.", "Uncleared Residential Waste Vat"),
                ("Illegal Open Waste Dumping", "Scattered plastic wrappers and dry leaves piled up beside {street}.", "Scattered Street Litter"),
                ("Overflowing Garbage Vat / Bin", "আমাদের আবাসিক এলাকার ডাস্টবিনে গত কয়েকদিন ধরে আবর্জনা জমে আছে।", "ডাস্টবিনে আবর্জনার স্তূপ"),
                ("Overflowing Garbage Vat / Bin", "हमारे आवासीय क्षेत्र में कई दिनों से कचरा जमा हो रहा है और बदबू आ रही है।", "कचरा पात्र भर गया है")
            ],
            "HIGH": [
                ("Overflowing Garbage Vat / Bin", "A large pile of waste is creating severe health risks near a crowded market on {street}.", "Severe Waste Health Hazard in Market"),
                ("Dead Animal Carcass Removal", "Large decomposing dead animal carcass rotting on {street} causing unbearable stench and flies.", "Decomposing Carcass in Public Road"),
                ("Overflowing Garbage Vat / Bin", "{landmark} বাজারের কাছে বিশাল আবর্জনার স্তূপ থেকে তীব্র দুর্গন্ধ ও স্বাস্থ্যঝুঁকি তৈরি হয়েছে।", "বাজারে আবর্জনার দূষণ"),
                ("Overflowing Garbage Vat / Bin", "भीड़भाड़ वाले बाजार के पास कचरे का विशाल ढेर गंभीर बीमारी का खतरा पैदा कर रहा है।", "बाजार में भारी कचरा ढेर")
            ],
            "CRITICAL": [
                ("Hazardous Biomedical Waste", "Massive illegal dump of infected hospital biomedical waste, blood bags, and discarded syringes next to drinking water tank on {street}!", "Illegal Biomedical Biohazard Dump"),
                ("Hazardous Biomedical Waste", "Toxic chemical waste barrels leaking corrosive fumes into residential slum near {landmark}; residents suffocating!", "Toxic Chemical Waste Leak Hazard"),
                ("Hazardous Biomedical Waste", "পানীয় জলের ট্যাংকের পাশে বিষাক্ত হাসপাতাল বর্জ্য এবং রক্তমাখা সিরিঞ্জ ফেলা হয়েছে, চরম বিপর্যয়!", "বিষাক্ত বায়োমেডিকেল বর্জ্য"),
                ("Hazardous Biomedical Waste", "पीने के पानी के स्रोत के पास संक्रामक अस्पताल कचरा फेंका गया है, तुरंत हटाइए!", "संक्रामक मेडिकल कचरा")
            ]
        }
    },
    "Street Lighting & Electrical": {
        "dept": "Street Lighting & Electrical",
        "subcategories": ["Streetlight Completely Off", "Flickering / Damaged LED", "Damaged / Leaning Electric Pole", "Exposed Junction Box", "Feeder Panel Fault"],
        "is_crime": 0,
        "base_res_days": 2.0,
        "priorities": {
            "LOW": [
                ("Streetlight Completely Off", "One streetlight near my house has stopped working on {street}. There is no immediate danger.", "Single Streetlight Not Working"),
                ("Flickering / Damaged LED", "Streetlight LED bulb is flickering mildly near {landmark} park.", "Flickering Streetlight Bulb"),
                ("Streetlight Completely Off", "আমাদের পাড়ার একটি স্ট্রিট লাইট কয়েকদিন ধরে খারাপ। কোনও জরুরি বিপদ নেই।", "একটি স্ট্রিট লাইট খারাপ"),
                ("Streetlight Completely Off", "गली की एक स्ट्रीट लाइट खराब है। कोई तत्काल खतरा नहीं है।", "एक स्ट्रीट लाइट खराब")
            ],
            "MEDIUM": [
                ("Streetlight Completely Off", "Several streetlights in our neighborhood have been broken for a week on {street}.", "Multiple Streetlights Off for a Week"),
                ("Streetlight Completely Off", "Entire colony lane in darkness for 4 days due to localized lamp fault on {street}.", "Colony Lane Dark for 4 Days"),
                ("Streetlight Completely Off", "পাড়ায় বেশ কিছু স্ট্রিট লাইট এক সপ্তাহ ধরে জ্বলছে না, রাতে চলাচল করতে সমস্যা হচ্ছে।", "বেশ কয়েকটি বাতি খারাপ"),
                ("Streetlight Completely Off", "हमारे मोहल्ले में कई स्ट्रीट लाइटें एक हफ्ते से खराब हैं, रात में अंधेरा रहता है।", "कई स्ट्रीट लाइटें बंद")
            ],
            "HIGH": [
                ("Streetlight Completely Off", "Broken streetlight has left a busy road extremely dark and accidents are occurring frequently on {street}.", "Accident-Prone Dark Arterial Road"),
                ("Damaged / Leaning Electric Pole", "Severely leaning street light pole damaged by truck, hanging precariously over footpath on {street}.", "Leaning Pole Over Footpath"),
                ("Streetlight Completely Off", "ব্যস্ত রাস্তায় বাতি না জ্বলায় চরম অন্ধকার এবং ঘন ঘন দুর্ঘটনা ঘটছে।", "অন্ধকার রাস্তায় দুর্ঘটনা"),
                ("Streetlight Completely Off", "व्यस्त सड़क पर स्ट्रीट लाइट बंद होने से भारी अंधेरा है और लगातार हादसे हो रहे हैं।", "व्यस्त सड़क पर अंधेरा और हादसे")
            ],
            "CRITICAL": [
                ("Exposed Junction Box", "A live electrical wire has fallen onto the road on {street} and people could be electrocuted! Cut power immediately!", "Live Electrical Wire on Road - Electrocution Hazard"),
                ("Exposed Junction Box", "Electric pole sparking violently in waterlogged pool near school on {street}; children walking close by!", "Violently Sparking Pole in Water"),
                ("Exposed Junction Box", "রাস্তায় একটি ছেঁড়া বিদ্যুতের তার পড়ে আছে এবং মানুষের বিদ্যুৎস্পৃষ্ট হওয়ার চরম আশঙ্কা রয়েছে!", "রাস্তায় ছেঁড়া বিদ্যুতের তার"),
                ("Exposed Junction Box", "सड़क पर बिजली का नंगा तार गिर गया है और लोगों को करंट लगने का गंभीर खतरा है!", "सड़क पर लाइव बिजली का तार")
            ]
        }
    },
    "Electricity & Power": {
        "dept": "Electricity & Power",
        "subcategories": ["Open Live Wire / Electrical Hazard", "Transformer Sparking / Overheating", "Frequent Voltage Fluctuation", "Prolonged Blackout", "Defective Meter"],
        "is_crime": 0,
        "base_res_days": 1.5,
        "priorities": {
            "LOW": [
                ("Defective Meter", "Electric meter display is dim on {street}. Reading is still recorded correctly.", "Dim Meter Display"),
                ("Frequent Voltage Fluctuation", "Minor voltage drop observed occasionally during afternoon on {street}.", "Minor Voltage Drop"),
                ("Defective Meter", "বিদ্যুৎ মিটারের স্ক্রিন কিছুটা ঝাপসা দেখাচ্ছে, পরীক্ষা করার আবেদন।", "মিটার স্ক্রিন সমস্যা"),
                ("Defective Meter", "बिजली मीटर का डिस्प्ले हल्का दिख रहा है, जांच की जरूरत है।", "मीटर डिस्प्ले की शिकायत")
            ],
            "MEDIUM": [
                ("Frequent Voltage Fluctuation", "Continuous voltage fluctuations damaging household appliances in residential block on {street}.", "Frequent Household Voltage Spikes"),
                ("Prolonged Blackout", "Unscheduled power outage for 6 hours without prior notice on {street}.", "Unannounced 6-Hour Power Cut"),
                ("Frequent Voltage Fluctuation", "ঘন ঘন ভোল্টেজ ওঠানামা করায় ঘরের ইলেকট্রনিক সামগ্রী নষ্ট হচ্ছে।", "ভোল্টেজ ওঠানামার সমস্যা"),
                ("Prolonged Blackout", "बिना पूर्व सूचना के 6 घंटे से बिजली गुल है, काम प्रभावित हो रहा है।", "अघोषित बिजली कटौती")
            ],
            "HIGH": [
                ("Transformer Sparking / Overheating", "Distribution transformer overheating with heavy buzzing and oil leaking on {street}.", "Transformer Oil Leak & Overheating"),
                ("Prolonged Blackout", "Complete power blackout for 48 hours in ward during extreme heatwave.", "48-Hour Extended Area Blackout"),
                ("Transformer Sparking / Overheating", "পাড়ার ট্রান্সফর্মার থেকে ধোঁয়া বের হচ্ছে এবং তেল চুঁইয়ে পড়ছে, বড় বিপদের আশঙ্কা।", "ট্রান্সফর্মার থেকে তেল লিক"),
                ("Transformer Sparking / Overheating", "ट्रांसफार्मर बहुत ज्यादा गर्म हो रहा है और उसमें से तेल टपक रहा है।", "ट्रांसफार्मर ओवरहीटिंग")
            ],
            "CRITICAL": [
                ("Open Live Wire / Electrical Hazard", "High-voltage 11kV overhead wire snapped and fell across bus stand on {street}! High danger of mass electrocution!", "11kV High-Voltage Wire Snapped Over Crowd"),
                ("Transformer Sparking / Overheating", "Transformer caught fire with massive explosions and fireball expanding near residential flats on {street}!", "Exploding Transformer Fireball"),
                ("Open Live Wire / Electrical Hazard", "১১ হাজার ভোল্টের তার ছিঁড়ে বাসস্ট্যান্ডের উপর পড়েছে, তৎক্ষণাৎ বিদ্যুৎ সংযোগ বন্ধ করুন!", "১১ কেভি তার ছিঁড়ে পড়ার জরুরি অবস্থা"),
                ("Open Live Wire / Electrical Hazard", "हाई टेंशन 11KV बिजली का तार टूटकर सड़क पर गिरा है, तुरंत बिजली सप्लाई बंद करें!", "हाई टेंशन तार टूटने का खतरा")
            ]
        }
    },
    "Fire & Emergency Services": {
        "dept": "Fire & Emergency Services",
        "subcategories": ["Residential Structure Fire", "LPG Cylinder Leak / Blast", "Transformer Fire", "Chemical Smoke Incident", "Water Rescue Emergency"],
        "is_crime": 0,
        "base_res_days": 0.8,
        "priorities": {
            "LOW": [
                ("Residential Structure Fire", "Requesting fire department safety audit and certification for community building on {street}.", "Routine Fire Safety Audit Request"),
                ("Residential Structure Fire", "Commercial kitchen fire extinguisher refill inspection due date approaching on {street}.", "Extinguisher Inspection Due"),
                ("Residential Structure Fire", "আমাদের ক্লাবের ভবনের জন্য সাধারণ ফায়ার সেফটি অডিটের আবেদন।", "ফায়ার সেফটি অডিট আবেদন"),
                ("Residential Structure Fire", "सामुदायिक भवन के लिए नियमित अग्नि सुरक्षा निरीक्षण का अनुरोध।", "फायर सेफ्टी ऑडिट अनुरोध")
            ],
            "MEDIUM": [
                ("Residential Structure Fire", "Fire hydrants along {street} covered in mud and unserviceable, need maintenance.", "Defective Street Fire Hydrant"),
                ("Residential Structure Fire", "Blocked emergency fire exit staircase in commercial building on {street}.", "Blocked Fire Exit Staircase"),
                ("Residential Structure Fire", "রাস্তার ফায়ার হাইড্রেন্ট কাদায় ঢেকে অকেজো হয়ে আছে, মেরামতের প্রয়োজন।", "ফায়ার হাইড্রেন্ট মেরামত"),
                ("Residential Structure Fire", "इमारत की आपातकालीन सीढ़ी पर सामान रखकर रास्ता बंद किया गया है।", "इमरजेंसी निकास बंद")
            ],
            "HIGH": [
                ("LPG Cylinder Leak / Blast", "Pungent LPG cooking gas smell strongly leaking from locked ground-floor godown on {street}.", "Major Gas Cylinder Leak Smell"),
                ("Chemical Smoke Incident", "Dense toxic chemical smoke billowing from industrial workshop godown near {landmark}.", "Hazardous Workshop Chemical Smoke"),
                ("LPG Cylinder Leak / Blast", "{street}-এ বন্ধ গোডাউন থেকে তীব্র রান্নার গ্যাসের গন্ধ বের হচ্ছে, বিস্ফোরণের ঝুঁকি।", "তীব্র গ্যাস লিক গন্ধ"),
                ("LPG Cylinder Leak / Blast", "गोदाम से रसोई गैस का भारी रिसाव हो रहा है, कभी भी आग भड़क सकती है।", "गंभीर गैस रिसाव")
            ],
            "CRITICAL": [
                ("Residential Structure Fire", "Active fire! 3-story residential building fully ablaze on {street} with families trapped on terrace! Send fire engines immediately!", "Active Multi-Story Residential Fire"),
                ("LPG Cylinder Leak / Blast", "LPG cylinder exploded inside crowded restaurant kitchen near {landmark}; fire spreading rapidly, people burning!", "Restaurant Cylinder Blast & Fire"),
                ("Residential Structure Fire", "ভয়াবহ আগুন! {street}-এ বহুতল ভবনে আগুন লেগেছে এবং মানুষ ভেতরে আটকে আছে, দ্রুত দমকল পাঠান!", "বহুতলে ভয়াবহ আগুন"),
                ("Residential Structure Fire", "भीषण आग! {street} पर इमारत में आग लग गई है और लोग अंदर फंसे हैं, तुरंत दमकल भेजें!", "इमारत में भीषण आग")
            ]
        }
    },
    "Water Supply": {
        "dept": "Water Supply",
        "subcategories": ["Pipeline Burst / Leakage", "Contaminated / Muddy Water", "Low Pressure / No Supply", "Public Standpost Broken", "Illegal Water Tapping"],
        "is_crime": 0,
        "base_res_days": 2.2,
        "priorities": {
            "LOW": [
                ("Pipeline Burst / Leakage", "Minor drip from public water standpost tap on {street}. Needs washer replacement.", "Dripping Public Standpost Tap"),
                ("Pipeline Burst / Leakage", "Small moisture seep around underground valve chamber on {street}.", "Valve Chamber Seepage"),
                ("Pipeline Burst / Leakage", "রাস্তার সরকারি কলের মুখ থেকে ফোঁটা ফোঁটা জল পড়ছে, ওয়াশার বদলানো দরকার।", "সরকারি কলের ওয়াশার খারাপ"),
                ("Pipeline Burst / Leakage", "सार्वजनिक नल से धीरे-धीरे पानी टपक रहा है, वाशर बदलने की जरूरत है।", "नल से पानी टपकना")
            ],
            "MEDIUM": [
                ("Low Pressure / No Supply", "Repeated low water pressure during morning municipal supply hours on {street}.", "Morning Water Supply Low Pressure"),
                ("Low Pressure / No Supply", "Water supply interrupted for 24 hours due to pump maintenance on {street}.", "24-Hour Water Supply Interruption"),
                ("Low Pressure / No Supply", "{street}-এ সকালের জল সরবরাহের সময় জলের গতি খুব কম থাকছে।", "জলের প্রেশার কম"),
                ("Low Pressure / No Supply", "सुबह के समय पानी का दबाव बहुत कम रहता है जिससे परेशानी हो रही है।", "पानी का कम दबाव")
            ],
            "HIGH": [
                ("Contaminated / Muddy Water", "Severely contaminated black, foul-smelling drinking water flowing from taps on {street}; multiple families falling sick with diarrhea.", "Toxic Contaminated Drinking Water"),
                ("Pipeline Burst / Leakage", "Major underground water transmission main burst on {street}, flooding entire roadway and wasting millions of liters.", "Massive Main Water Pipeline Burst"),
                ("Contaminated / Muddy Water", "পানীয় জলের লাইনে নর্দমার নোংরা জল মিশে দুর্গন্ধযুক্ত জল আসছে, অনেকেই অসুস্থ।", "পানীয় জলে নর্দমার বিষাক্ত জল"),
                ("Contaminated / Muddy Water", "नलों से बदबूदार और दूषित पानी आ रहा है, कई लोग बीमार पड़ रहे हैं।", "दूषित पेयजल आपूर्ति")
            ],
            "CRITICAL": [
                ("Contaminated / Muddy Water", "Acute toxic cholera outbreak in slum area on {street} due to poisoned municipal water line; children in critical dehydration condition!", "Fatal Cholera Outbreak From Water Contamination"),
                ("Pipeline Burst / Leakage", "High-pressure water main rupture under hospital foundation on {street}; foundation washing away, hospital flooding!", "Hospital Foundation Ruptured by Main Burst"),
                ("Contaminated / Muddy Water", "পানীয় জলে বিষাক্ত দূষণের ফলে এলাকায় কলেরার প্রাদুর্ভাব, শিশুরা আশঙ্কাজনক অবস্থায় ভর্তি!", "পানীয় জলে ভয়াবহ ডায়রিয়া প্রাদুর্ভাব"),
                ("Contaminated / Muddy Water", "दूषित पानी पीने से पूरे इलाके में महामारी फैल गई है और बच्चे अस्पताल में भर्ती हैं!", "पेयजल से महामारी का संकट")
            ]
        }
    }
}

# Add standard fallback generator for remaining 19 categories to cover all 30 departments
REMAINING_DEPARTMENTS = [
    ("Public Health & Sanitation", "Mosquito Breeding & Dengue Risk", "Public Toilet & Urinal Hygiene", "Health & Family Welfare"),
    ("Disaster Management", "Flood Inundation", "Cyclone Damage", "Disaster Management & Relief"),
    ("Environment & Pollution", "Industrial Air Smoke", "Chemical Effluent Discharge", "Environment"),
    ("Parks & Public Spaces", "Damaged Swings & Playground", "Park Lighting Outage", "Urban Development & Municipal Affairs"),
    ("Building & Municipal Engineering", "Unauthorized Construction", "Dangerous Dilapidated Building", "Urban Development & Municipal Affairs"),
    ("Land & Land Records", "Encroachment on Govt Land", "Mutation Record Discrepancy", "Land & Land Reforms"),
    ("Housing & Urban Development", "Housing Scheme Disbursement", "Slum Civic Infrastructure", "Housing"),
    ("Public Transport", "Bus Route Absence", "Passenger Overcharging", "Transport"),
    ("Education & School Infrastructure", "School Toilet Defect", "Classroom Roof Seepage", "School Education"),
    ("Healthcare & Hospital Facilities", "Hospital OPD Service Delay", "Shortage of Critical Medicine", "Health & Family Welfare"),
    ("Agriculture & Irrigation", "Canal Water Siltation", "Defective Irrigation Pump", "Agriculture"),
    ("Animal Husbandry & Veterinary", "Cattle Stray Menace", "Veterinary Clinic Shortage", "Animal Resources"),
    ("Consumer Affairs & Fair Price", "Ration Shop PDS Irregularity", "Weight Discrepancy in Market", "Consumer Affairs"),
    ("Social Welfare & Pensions", "Old Age Pension Non-Credit", "Disability Scheme Verification", "Women & Child Development"),
    ("Backward Classes & Tribal Welfare", "Scholarship Disbursement", "Tribal Hostel Infrastructure", "Backward Classes Welfare"),
    ("Fisheries & Aquaculture", "Pond Water Contamination", "Fish Farmers Support Scheme", "Fisheries"),
    ("Forest & Wildlife Protection", "Wild Animal Intrusion in Village", "Illegal Timber Logging", "Forest"),
    ("Food & Supplies (PDS)", "Defective Ration Card", "Adulterated Food Commodity", "Food & Supplies"),
    ("Youth Services & Sports", "Defunct Sports Complex", "Youth Development Training", "Youth Services & Sports")
]

for dept_name, sub1, sub2, govt_dept in REMAINING_DEPARTMENTS:
    CATEGORIES_DATA[dept_name] = {
        "dept": dept_name,
        "subcategories": [sub1, sub2, "General Inquiry", "Maintenance Request"],
        "is_crime": 0,
        "base_res_days": 2.5,
        "priorities": {
            "LOW": [
                (sub1, f"Routine query and minor maintenance request regarding {sub1} on {{street}}.", f"Routine {sub1}"),
                (sub2, f"General inspection request for {sub2} near {{landmark}}.", f"Inspection of {sub2}"),
                (sub1, f"{dept_name} সংক্রান্ত একটি সাধারণ অনুসন্ধান ও আবেদন।", f"সাধারণ আবেদন"),
                (sub2, f"{dept_name} के संबंध में सामान्य पूछताछ एवं सुधार का अनुरोध।", f"सामान्य पूछताछ")
            ],
            "MEDIUM": [
                (sub1, f"Noticeable delay and recurring problem regarding {sub1} affecting residents on {{street}}.", f"Recurring {sub1} Problem"),
                (sub2, f"Continuous citizen inconvenience caused by malfunctioning {sub2} near {{landmark}}.", f"Inconvenience with {sub2}"),
                (sub1, f"{dept_name}-এর এই সমস্যাটির কারণে এলাকায় বেশ কিছু দিন ধরে অসুবিধা হচ্ছে।", f"চলমান সমস্যা"),
                (sub2, f"{dept_name} की इस समस्या से स्थानीय निवासियों को कई दिनों से असुविधा हो रही है।", f"लगातार असुविधा")
            ],
            "HIGH": [
                (sub1, f"Severe disruption and substantial public impact due to major failure in {sub1} on {{street}}.", f"Major Disruption in {sub1}"),
                (sub2, f"Serious civic breakdown and public risk caused by {sub2} near {{landmark}}.", f"Substantial Risk: {sub2}"),
                (sub1, f"গুরুতর জনদুর্ভোগ এবং ব্যাপক ক্ষয়ক্ষতির আশঙ্কা {dept_name}-এর এই ত্রুটির জন্য।", f"গুরুতর জনদুর্ভোগ"),
                (sub2, f"गंभीर जनहानि और स्वास्थ्य जोखिम की संभावना, {dept_name} तुरंत संज्ञान ले।", f"गंभीर समस्या")
            ],
            "CRITICAL": [
                (sub1, f"Emergency catastrophic disaster in {dept_name} on {{street}}; human lives in immediate extreme peril!", f"Emergency Crisis in {dept_name}"),
                (sub2, f"Life-threatening emergency collapse regarding {sub2} near {{landmark}}; immediate disaster intervention required!", f"Life Threatening {sub2}"),
                (sub1, f"চরম বিপর্যয় ও প্রাণনাশের আশঙ্কা {dept_name}-এর ঘটনায়, অবিলম্বে সাহায্য পাঠান!", f"চরম জরুরি অবস্থা"),
                (sub2, f"आपातकालीन जानलेवा संकट! {dept_name} पर तत्काल राहत और बचाव दल भेजें!", f"आपातकालीन संकट")
            ]
        }
    }

def generate_complaints(target_total=5000):
    rows = []
    comp_counter = 1
    
    # We want exactly balanced samples across the 4 priority classes:
    # LOW: 1,250, MEDIUM: 1,250, HIGH: 1,250, CRITICAL: 1,250
    prio_target = target_total // 4
    prio_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    
    all_categories = list(CATEGORIES_DATA.keys())
    
    while any(count < prio_target for count in prio_counts.values()):
        for cat_name in all_categories:
            info = CATEGORIES_DATA[cat_name]
            
            for prio in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
                if prio_counts[prio] >= prio_target:
                    continue
                    
                templates = info["priorities"][prio]
                subcat, template, title_template = random.choice(templates)
                
                street = random.choice(STREETS)
                landmark = random.choice(LANDMARKS)
                text = template.format(street=street, landmark=landmark)
                title = title_template.format(street=street, landmark=landmark)
                
                # Severity and Emergency indicators aligned with Ground Truth
                if prio == "CRITICAL":
                    severity = "Critical"
                    is_emergency = 1
                    affected_count = random.randint(10, 1500)
                    duration_days = random.randint(1, 4)
                elif prio == "HIGH":
                    severity = "High"
                    is_emergency = 0
                    affected_count = random.randint(50, 800)
                    duration_days = random.randint(2, 14)
                elif prio == "MEDIUM":
                    severity = "Medium"
                    is_emergency = 0
                    affected_count = random.randint(15, 200)
                    duration_days = random.randint(3, 21)
                else: # LOW
                    severity = "Low"
                    is_emergency = 0
                    affected_count = random.randint(1, 50)
                    duration_days = random.randint(1, 10)
                
                loc_type = random.choice(LOCATION_TYPES)
                
                # Resolution days target
                prio_mult = {"CRITICAL": 0.5, "HIGH": 0.9, "MEDIUM": 1.4, "LOW": 2.2}[prio]
                noise = np.random.normal(0, 0.2)
                res_days = max(0.5, round(info["base_res_days"] * prio_mult + noise, 1))
                
                lat = round(BASE_LAT + np.random.normal(0, 0.025), 5)
                lng = round(BASE_LNG + np.random.normal(0, 0.025), 5)
                ward = f"Ward {random.randint(1, 20)}"
                
                rows.append({
                    "complaint_id": f"CMP-{10000 + comp_counter}",
                    "complaint_text": text,
                    "title": title,
                    "category": cat_name,
                    "subcategory": subcat,
                    "department": info["dept"],
                    "priority": prio,
                    "severity": severity,
                    "location_type": loc_type,
                    "affected_citizens": affected_count,
                    "duration_days": duration_days,
                    "emergency_flag": is_emergency,
                    "is_crime": info["is_crime"],
                    "resolution_days": res_days,
                    "latitude": lat,
                    "longitude": lng,
                    "ward": ward,
                    "address": f"{landmark}, {street}, {ward}"
                })
                
                comp_counter += 1
                prio_counts[prio] += 1
                
    df = pd.DataFrame(rows)
    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "civic_complaints_dataset.csv")
    
    print("Generating balanced multilingual 30-category civic complaints dataset (5,000 rows)...")
    df = generate_complaints(5000)
    df.to_csv(out_path, index=False, encoding='utf-8')
    print(f"Dataset successfully saved to: {out_path}")
    print(f"Total rows: {len(df)}")
    print(f"Unique categories: {df['category'].nunique()}")
    print(f"\nPriority distribution:\n{df['priority'].value_counts()}")
    print(f"\nSample rows:\n{df[['complaint_text', 'priority', 'category']].head(8)}")
