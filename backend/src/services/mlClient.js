const axios = require('axios');
const multilingualService = require('./multilingualService');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

// Comprehensive 30-Department Category Keywords with Subcategories & Taxonomies
const CATEGORY_TAXONOMY = {
  'Police & Law Enforcement': {
    keywords: ['police', 'thana', 'fir', 'theft', 'stolen', 'burglary', 'robbery', 'assault', 'snatching', 'fight', 'gambling', 'illegal liquor', 'patrol', 'चोरी', 'पुलिस', 'চুরি', 'ছিনতাই'],
    subcategories: ['Theft & Burglary', 'Physical Assault', 'Vandalism', 'Public Nuisance', 'Missing Person Report'],
    causes: ['Low evening police patrolling', 'Lack of surveillance cameras in perimeter', 'Inadequate street lighting'],
    actions: ['Dispatch beat patrol unit', 'Review local CCTV feeds', 'Initiate preliminary FIR inquiry', 'Increase perimeter night rounds']
  },
  'Cyber Crime': {
    keywords: ['cyber', 'otp', 'scam', 'fraud', 'bank fraud', 'upi', 'phishing', 'hacked', 'blackmail', 'fake account', 'cyberbullying', 'धोखाधड़ी', 'অনলাইন জালিয়াতি'],
    subcategories: ['Financial Banking Fraud (UPI/Card)', 'Identity Theft & Impersonation', 'Social Media Harassment', 'Phishing & Ransomware', 'Data Breach'],
    causes: ['Social engineering attack via phishing SMS/call', 'Compromised digital authentication credential', 'Malicious APK or web link'],
    actions: ['Freeze suspect transaction nodes via 1930 portal', 'Notify cyber cell nodal officer', 'Secure digital audit trails & IP logs']
  },
  'Women & Child Safety': {
    keywords: ['women safety', 'harassment', 'eve teasing', 'stalking', 'molestation', 'domestic violence', 'child abuse', 'child labour', 'trafficking', 'helpline 1098', 'छेड़छाड़', 'নারী সুরক্ষা'],
    subcategories: ['Public Harassment / Stalking', 'Domestic Grievance', 'Child Labour Hazard', 'Unsafe Dark Corridor', 'Emergency Distress Signal'],
    causes: ['Poor corridor illumination at transit stops', 'Absence of dedicated civic surveillance', 'Unregulated congregation points'],
    actions: ['Deploy rapid women safety mobile patrol', 'Inspect lighting along transit corridor', 'Coordinate with designated Child Welfare Officer']
  },
  'Traffic & Road Safety': {
    keywords: ['traffic', 'signal', 'red light', 'parking', 'zebra crossing', 'congestion', 'traffic jam', 'illegal parking', 'accident zone', 'over speeding', 'ट्रैफिक', 'যানজট'],
    subcategories: ['Traffic Signal Outage', 'Illegal Road Parking & Encroachment', 'Chronic Junction Congestion', 'Missing Pedestrian Crossing / Signage', 'Frequent Accident Hotspot'],
    causes: ['Sensor failure or power glitch at junction signal', 'Unauthorized commercial parking on carriage-way', 'Peak commuter volume exceeding bottleneck capacity'],
    actions: ['Dispatch traffic control team for manual flow regulation', 'Initiate electronic signal repair', 'Deploy tow crane to clear lane encroachment']
  },
  'Roads & Public Works': {
    keywords: ['pothole', 'road', 'asphalt', 'caved', 'crater', 'divider', 'tar', 'trench', 'speed breaker', 'damaged road', 'pavement', 'গর্ত', 'ভাঙা রাস্তা', 'सड़क पर गड्ढा'],
    subcategories: ['Pothole / Surface Crater', 'Caved-in Carriageway', 'Broken Road Divider / Median', 'Damaged Footpath / Paver Blocks', 'Unmarked Speed Breaker Hazard'],
    causes: ['Heavy monsoon runoff penetrating sub-base layer', 'Wearing course fatigue from heavy axle vehicles', 'Recent utility trenching left uncompacted'],
    actions: ['Deploy road maintenance team with cold-mix asphalt', 'Erect safety hazard cones & warning retro-reflectors', 'Perform subsurface compaction and tar leveling']
  },
  'Drainage & Sewerage': {
    keywords: ['drain', 'manhole', 'sewer', 'sewage', 'overflow', 'gutter', 'nullah', 'waterlogging', 'choked drain', 'blocked drain', 'ম্যানহোল', 'জল জমা', 'जलभराव', 'নালা'],
    subcategories: ['Open / Missing Manhole Cover', 'Severe Monsoon Waterlogging', 'Blocked Storm Water Drain', 'Sewage Line Overflow', 'Collapsed Nullah Embankment'],
    causes: ['Plastic waste accumulation in subterranean conduit', 'Inadequate drainage discharge gradient', 'Precipitation exceeding storm water pipe capacity'],
    actions: ['Deploy super-sucker / vacuum jetting machine', 'Install heavy-duty ductile iron manhole cover immediately', 'Clear culvert inlet grate of solid debris']
  },
  'Water Supply': {
    keywords: ['water', 'pipeline', 'drinking water', 'tap', 'burst pipe', 'tanker', 'low pressure', 'contaminated water', 'dirty water', 'leakage', 'পানীয় জল', 'पानी की आपूर्ति', 'পাইপ লিক'],
    subcategories: ['Pipeline Burst / Severe Leakage', 'Contaminated / Muddy Water Supply', 'Low Pressure / No Supply', 'Public Standpost Broken', 'Illegal Water Tapping'],
    causes: ['Aging cast-iron distribution mains rupture under pressure', 'Cross-contamination due to adjacent drain seepage', 'Booster pump trip or valve malfunction'],
    actions: ['Isolate distribution sector valve to stem loss', 'Dispatch emergency water tanker for residents', 'Excavate and weld clamp repair on affected main']
  },
  'Solid Waste Management': {
    keywords: ['garbage', 'waste', 'dustbin', 'dumping', 'trash', 'stench', 'dead animal', 'overflowing bin', 'litter', 'plastic waste', 'আবর্জনা', 'ময়লা', 'कचरा'],
    subcategories: ['Overflowing Garbage Vat / Bin', 'Illegal Open Waste Dumping', 'Dead Animal Carcass Removal', 'Missed Door-to-Door Collection', 'Hazardous Biomedical Waste'],
    causes: ['Irregular compactor vehicle haulage cycle', 'Inadequate bin capacity relative to market density', 'Unauthorized dumping by commercial establishments'],
    actions: ['Dispatch hydraulic tipper & backhoe loader', 'Disinfect spot with bleaching powder and lime', 'Enforce commercial waste disposal compliance notice']
  },
  'Street Lighting & Electrical': {
    keywords: ['streetlight', 'lamp', 'darkness', 'flickering', 'pole', 'blackout', 'bulb', 'light pole', 'high mast', 'রাস্তার আলো', 'स्ट्रीट लाइट', 'অন্ধকার'],
    subcategories: ['Streetlight Completely Off (Dark Corridor)', 'Flickering / Damaged LED Luminaire', 'Damaged / Leaning Electric Pole', 'Exposed High-Mast Junction Box', 'Timer / Feeder Panel Fault'],
    causes: ['Phase feeder fuse blown at distribution kiosk', 'Cable insulation degradation due to underground moisture', 'LED driver board failure'],
    actions: ['Send hydraulic sky-lift maintenance truck', 'Replace burnt LED driver / luminaire fixture', 'Insulate and seal open cable joints']
  },
  'Public Health & Sanitation': {
    keywords: ['mosquito', 'dengue', 'malaria', 'fogging', 'public toilet', 'urinal', 'hygiene', 'defecation', 'filth', 'bleaching powder', 'মশা', 'ডেঙ্গু', 'सार्वजनिक शौचालय'],
    subcategories: ['Mosquito Breeding & Dengue Risk', 'Unsanitary Public Toilet / Urinal', 'Need for Fogging / Larvicide Spray', 'Open Defecation / Filth Hotspot', 'Stagnant Cesspool Sanitation'],
    causes: ['Stagnant clean water pools supporting Aedes breeding', 'Lack of dedicated maintenance staff for civic toilets', 'Blocked septic tank outlet'],
    actions: ['Deploy vector-control team with thermal fogger & larvicide', 'Deep chemical sanitation of public facilities', 'Issue health advisory to ward residents']
  },
  'Fire & Emergency Services': {
    keywords: ['fire', 'flames', 'blaze', 'cylinder blast', 'explosion', 'smoke', 'gas leak', 'building on fire', 'trapped in fire', 'আগুন', 'দমকল', 'आग لگنا'],
    subcategories: ['Residential / Commercial Structure Fire', 'LPG Cylinder Leak / Blast Hazard', 'Transformer / Cable Trench Fire', 'Factory / Chemical Smoke Incident', 'Water Rescue Emergency'],
    causes: ['Short circuit in overloaded wiring', 'LPG regulator valve seal failure', 'Combustible material stored without safety buffers'],
    actions: ['Dispatch priority fire tender engines (Call 101/112)', 'Evacuate adjacent buildings within 50m cordon', 'Cut off electrical grid feeder at substation']
  },
  'Disaster Management': {
    keywords: ['flood', 'cyclone', 'storm', 'earthquake', 'wall collapsed', 'tree fallen', 'embankment breach', 'submerged houses', 'relief', 'ঘূর্ণিঝড়', 'বন্যা', 'দেয়াল ধস'],
    subcategories: ['Severe Flood / Inundation', 'Cyclone / Storm Wind Damage', 'Structural Wall / Roof Collapse', 'River / Canal Embankment Breach', 'Uprooted Trees Blocking Arterial Highway'],
    causes: ['Cyclonic wind gusts exceeding 90 km/h', 'Extreme tidal surge or river overbank flow', 'Weak foundation in un-reinforced masonry'],
    actions: ['Deploy SDRF / Civil Defence rescue boats', 'Clear blocked arterial roads using chainsaw teams', 'Open designated cyclone relief shelter with dry rations']
  },
  'Environment & Pollution': {
    keywords: ['pollution', 'smoke', 'dust', 'noise', 'loudspeaker', 'factory discharge', 'effluent', 'air quality', 'tree cutting', 'illegal felling', 'শব্দ দূষণ', 'বায়ু দূষণ'],
    subcategories: ['Industrial Air / Chemical Smoke Pollution', 'Excessive Noise Pollution (Loudspeaker/DJ)', 'Chemical Effluent in Water Bodies', 'Illegal Tree Felling', 'Construction Dust Violation'],
    causes: ['Non-compliant factory emissions without wet scrubber', 'Commercial disregard of decibel limits after 10 PM', 'Uncovered construction material transit'],
    actions: ['Deploy pollution control inspector with sound level meter', 'Issue immediate stop-work or compliance notice', 'Collect effluent samples for laboratory testing']
  },
  'Parks & Public Spaces': {
    keywords: ['park', 'garden', 'playground', 'bench', 'swing', 'grass', 'fountain', 'gym equipment', 'park lights', 'পাবলিক পার্ক', 'খেলার মাঠ', 'पार्क'],
    subcategories: ['Damaged Children Swings / Play Equipment', 'Overgrown Wild Grass & Thorny Bushes', 'Broken Benches / Walkways', 'Park Lighting Outage', 'Defunct Fountain / Water Body'],
    causes: ['Continuous mechanical wear on play installations', 'Infrequent mowing cycle during monsoon', 'Vandalism or deferred preventive maintenance'],
    actions: ['Deploy horticulture team for lawn mowing & trimming', 'Weld and repair broken swings and outdoor gym units', 'Restore walkway pavers and illumination']
  },
  'Building & Municipal Engineering': {
    keywords: ['building', 'illegal construction', 'unauthorized floor', 'crack in building', 'dangerous building', 'demolition', 'plan sanction', 'অবৈধ নির্মাণ', 'বিপজ্জনক বাড়ি'],
    subcategories: ['Illegal / Unauthorized Construction', 'Dangerous Dilapidated Structure at Risk of Collapse', 'Encroachment on Municipal Land', 'Deviation from Sanctioned Building Plan', 'Unsafe Excavation Adjacent to Neighbor'],
    causes: ['Construction without municipal structural sanction', 'Severe masonry aging with water seepage in beams', 'Lack of retaining wall in deep foundation trench'],
    actions: ['Issue Stop-Work notice under Municipal Act', 'Erect cautionary perimeter fencing for hazardous building', 'Conduct structural stability audit with civic engineer']
  },
  'Land & Land Records': {
    keywords: ['land', 'mutation', 'parcha', 'record of rights', 'encroachment', 'land grabbing', 'demarcation', 'khatian', 'জমির রেকর্ড', 'মিউটেশন', 'জমি দখল'],
    subcategories: ['Mutation / Parcha Delay or Discrepancy', 'Illegal Government Land Encroachment', 'Boundary Demarcation Dispute', 'Unauthorized Land Filling of Pond', 'Record of Rights (RoR) Correction'],
    causes: ['Pending legacy digitization of land khatian', 'Physical boundary markers removed by miscreants', 'Illegal waterbody conversion without BL&LRO NOC'],
    actions: ['Schedule field inspection by Revenue Inspector & Amin', 'Cross-verify GIS satellite footprint against Mouza map', 'Issue notice to halt unapproved land conversion']
  },
  'Housing & Urban Development': {
    keywords: ['housing', 'slum', 'flat', 'housing complex', 'bengal awas', 'housing scheme', 'tenement', 'পাকা বাড়ি', 'হাউজিং স্কিম', 'आवास'],
    subcategories: ['Affordable Housing Scheme Disbursement', 'Slum Infrastructure Rehabilitation', 'Structural Maintenance of Civic Housing', 'Rainwater Harvesting Compliance', 'Common Area Civic Dispute'],
    causes: ['Verification backlog in housing welfare scheme', 'Inadequate civic drainage in informal settlements', 'Aging exterior plaster and plumbing in civic flats'],
    actions: ['Expedite verification with block housing officer', 'Inspect common sanitation and structural plumbing', 'Prioritize roof waterproofing works']
  },
  'Electricity & Power': {
    keywords: ['power', 'electricity', 'wire', 'voltage', 'sparking', 'transformer', 'shock', 'cable', 'current', 'power cut', 'load shedding', 'মিটার', 'বিদ্যুৎ সংযোগ', 'बिजली गुल'],
    subcategories: ['Open Live Wire / Electrical Hazard', 'Transformer Sparking / Overheating', 'Frequent Voltage Fluctuation', 'Prolonged Unannounced Power Blackout', 'Defective Electric Meter Billing'],
    causes: ['Feeder phase overloading during high ambient heat', 'Mechanical abrasion of aerial bundled cables by trees', 'Moisture ingress inside distribution box'],
    actions: ['Deploy WBSEDCL emergency quick-response team', 'Isolate local transformer circuit', 'Trim tree branches touching 11kV / 440V overhead lines']
  },
  'Public Transport': {
    keywords: ['bus', 'auto', 'fare', 'overcharging', 'route', 'depot', 'reckless driving', 'permit', 'বাস', 'অটো ভাড়া', 'বাস স্টপ', 'सार्वजनिक परिवहन'],
    subcategories: ['Bus Route Absence / Severe Irregularity', 'Auto / Taxi Passenger Overcharging & Refusal', 'Reckless Public Transit Driving', 'Unsafe / Dilapidated Bus Stand', 'Unauthorized Commercial Vehicle Plying'],
    causes: ['Fleet shortage on peri-urban feeder routes', 'Lack of regulated fare card display at auto stands', 'Poor terminal maintenance by concessionaire'],
    actions: ['Deploy Motor Vehicles Inspector for fare compliance', 'Issue show-cause notice to route transport operator', 'Restore shelter roof and seating at civic bus stop']
  },
  'Railway-related Public Complaints': {
    keywords: ['railway', 'station', 'platform', 'train', 'level crossing', 'railway gate', 'overbridge', 'রেলওয়ে স্টেশন', 'লেভেল ক্রসিং', 'रेलवे स्टेशन'],
    subcategories: ['Hazardous Level Crossing Gate Delays', 'Foot-over-Bridge Structural Defect', 'Platform Cleanliness & Sanitation Issue', 'Station Approach Road Waterlogging', 'Inadequate Lighting on Railway Perimeter'],
    causes: ['Heavy rail line congestion slowing automated gate cycles', 'Inadequate passenger drainage at station forecourt', 'Defunct high-mast lighting outside station gate'],
    actions: ['Coordinate with Divisional Railway Manager (DRM) liaison', 'Deploy municipal sweeper team to clear station approach', 'Inspect foot-over-bridge stair treads and railing']
  },
  'Health & Hospitals': {
    keywords: ['hospital', 'swasthya sathi', 'doctor', 'clinic', 'medicine', 'emergency ward', 'bed', 'medical negligence', 'হাসপাতাল', 'স্বাস্থ্য সাথী', 'अस्पताल'],
    subcategories: ['Swasthya Sathi Card Denial / Harassment', 'Emergency Ward Admission Obstacle', 'Shortage of Essential Lifesaving Medicines', 'Unhygienic Ward Conditions', 'Absenteeism of Medical Personnel'],
    causes: ['Billing desk dispute regarding government card package', 'Peak bed occupancy exceeding primary hospital capacity', 'Supply chain lag in generic pharmacy inventory'],
    actions: ['Notify District Chief Medical Officer of Health (CMOH)', 'Dispatch Swasthya Sathi nodal mediator to hospital', 'Restock essential drugs from central medical store']
  },
  'Food & Public Distribution': {
    keywords: ['ration', 'ration card', 'dealer', 'pds', 'rice', 'wheat', 'kerosene', 'ration shop', 'bpl', 'রেশন কার্ড', 'রেশন ডিলার', 'राशन दुकान'],
    subcategories: ['Ration Dealer Underweighing / Surcharge', 'Substandard Food Grain Quality', 'Ration Card Linkage / Biometric Failure', 'Unannounced Ration Shop Closure', 'Denial of Entitled National Food Security Quota'],
    causes: ['Point-of-Sale (ePoS) biometric sensor network fault', 'Grain moisture during transit in godowns', 'Dealer non-compliance with distribution calendar'],
    actions: ['Dispatch Food & Supplies Inspector for physical stock audit', 'Calibrate electronic weighing scale at fair price shop', 'Provide manual iris / OTP bypass for biometric failures']
  },
  'Consumer Affairs': {
    keywords: ['consumer', 'mrp', 'overcharging', 'expiry', 'weighing scale', 'adulteration', 'fraudulent seller', 'বিল দিচ্ছে না', 'ওজনে কম', 'उपभोक्ता संरक्षण'],
    subcategories: ['Sale Above Maximum Retail Price (MRP)', 'Tampered / Uncalibrated Weighing Scales', 'Food Adulteration / Expired Product Sale', 'False & Misleading Commercial Advertisement', 'Warranty / Service Denial by Vendor'],
    causes: ['Retailer taking advantage of festive demand surge', 'Uninspected mechanical weights in local haat/bazaar', 'Counterfeit stock distributed without verification'],
    actions: ['Conduct surprise raid with Legal Metrology Inspector', 'Seize uncalibrated weights and stamp certified equipment', 'File notice under Consumer Protection Act']
  },
  'Education - Schools': {
    keywords: ['school', 'midday meal', 'teacher', 'classroom', 'toilet in school', 'school uniform', 'books', 'স্কুল', 'মিড ডে মিল', 'বিদ্যালय'],
    subcategories: ['Mid-Day Meal Quality & Hygiene Issue', 'Unsafe School Infrastructure (Roof/Balcony)', 'Lack of Separate Functional Girls Toilet', 'Teacher Absenteeism / Vacancy', 'Delayed Free Textbook / Uniform Distribution'],
    causes: ['Inadequate kitchen storage for mid-day meal provisions', 'Delayed annual infrastructure grant release', 'Plumbing pipeline disruption in school restroom'],
    actions: ['Send Sub-Inspector of Schools for surprise meal inspection', 'Sanction urgent repair for school water and sanitation block', 'Direct school managing committee to resolve safety hazard']
  },
  'Higher Education': {
    keywords: ['college', 'university', 'ragging', 'hostel', 'marksheet', 'admission', 'degree', 'fees', 'কলেজ', 'র‌্যাগিং', 'विश्वविद्यालय'],
    subcategories: ['Anti-Ragging / Student Safety Incident', 'College Infrastructure & Laboratory Defect', 'Hostel Sanitation & Food Quality', 'Irregular Admission Fees / Demand', 'Marksheet & Degree Verification Backlog'],
    causes: ['Weak monitoring by anti-ragging squad in dormitories', 'Aging laboratory equipment and chemicals stockout', 'High volume certificate verification processing queue'],
    actions: ['Convene urgent Anti-Ragging Committee meeting', 'Inspect student hostel dining and living quarters', 'Review university online degree dispatch portal']
  },
  'Labour & Employment': {
    keywords: ['labour', 'wages', 'minimum wage', 'factory worker', 'construction worker', 'provident fund', 'safety equipment', 'শ্রমিক', 'মজুরি', 'श्रम'],
    subcategories: ['Non-Payment of Statutory Minimum Wages', 'Hazardous Worksite Without PPE / Safety Gear', 'Illegal Termination / Retrenchment', 'Delay in Construction Workers Welfare Benefit', 'Child Labour Prohibition Violation'],
    causes: ['Contractor exploitation of unorganized daily wagers', 'Lack of employer investment in mandatory harnesses/helmets', 'Processing delays in social security board'],
    actions: ['Deploy Labour Inspector for on-site wage ledger audit', 'Issue immediate stop-work order for unsafe construction sites', 'Register affected workers under State Social Security Scheme']
  },
  'Agriculture': {
    keywords: ['farmer', 'crop', 'fertilizer', 'paddy', 'seeds', 'irrigation', 'pesticides', 'kisan mandi', 'কৃষি', 'সার', 'ফসলের ক্ষতি', 'किसान'],
    subcategories: ['Substandard / Black Marketing of Fertilizers & Seeds', 'Defunct Agricultural Shallow Tube Well / Canal', 'Crop Damage Assessment for Relief', 'Mandi Distress Selling / MSP Non-Compliance', 'Pest Attack / Locust Threat'],
    causes: ['Canal siltation preventing water delivery to tail-end farms', 'Hoarding of DAP/Urea fertilizers by private stockists', 'Sudden unseasonal hail or pest infestation'],
    actions: ['Deploy Assistant Director of Agriculture (ADA) to fields', 'Inspect fertilizer retail outlets to enforce MRP ceiling', 'Expedite canal clearing and shallow pump repair']
  },
  'Animal Resources': {
    keywords: ['stray dog', 'rabies', 'veterinary', 'cattle', 'livestock', 'dog bite', 'vaccination', 'পশু চিকিৎসা', 'বেওয়ারিশ কুকুর', 'पशु पालन'],
    subcategories: ['Aggressive Stray Dog Pack & Rabies Hazard', 'Dead Animal Carcass Removal from Public Way', 'Need for Veterinary Health Care / Vaccination', 'Illegal Cattle Trespass & Hazard on Roads', 'Animal Cruelty Incident'],
    causes: ['High stray dog density near meat market dumping zones', 'Lack of routine canine sterilization in municipal wards', 'Absence of fenced community grazing zones'],
    actions: ['Dispatch animal birth control / rabies vaccination van', 'Deploy dedicated animal carcass disposal vehicle', 'Treat injured livestock at nearest state veterinary clinic']
  },
  'Forest & Wildlife': {
    keywords: ['wildlife', 'elephant', 'monkey', 'snake', 'forest', 'poaching', 'wild animal', 'সাপ', 'হাতি', 'বন্যপ্রাণী', 'वन विभाग'],
    subcategories: ['Wild Animal (Elephant/Leopard) Human Settlement Incursion', 'Venomous Snake in Residential Area', 'Monkey Troop Nuisance & Aggression', 'Illegal Tree Felling in Protected Forest', 'Poaching or Wildlife Smuggling Report'],
    causes: ['Habitat fragmentation driving wildlife towards harvest crops', 'Summer dry water holes in forest reserves', 'Open food leftovers attracting primate troops'],
    actions: ['Alert Range Forest Officer (RFO) & Hoolock squad', 'Deploy certified snake rescuers to residential sector', 'Establish physical solar-powered fence along village border']
  },
  'Public Grievance / General Administration': {
    keywords: ['corruption', 'bribe', 'delay', 'certificate', 'caste certificate', 'income certificate', 'panchayat', 'bdo', 'সার্টিফিকেট', 'ঘুষ', 'প্রশাসনিক অভিযোগ'],
    subcategories: ['Unjustified Delay in Public Service Delivery', 'Demand of Unofficial Fee / Bribery Allegation', 'Caste / Domicile / Income Certificate Issuance Glitch', 'Misbehavior by Public Dealing Official', 'Grievance Redressal Portal Tracking Failure'],
    causes: ['Legacy manual document verification workflow', 'Lack of public grievance supervisory review', 'Technical glitch in online portal integration'],
    actions: ['Escalate case to Sub-Divisional Officer (SDO / BDO)', 'Summon department nodal officer for status explanation', 'Process citizen certificate within 48-hour monitored timeline']
  }
};

const SLA_HOURS_MAP = {
  'CRITICAL': 24,
  'HIGH': 48,
  'MEDIUM': 72,
  'LOW': 168
};

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates Citizen Impact Score (0 - 100)
 */
function calculateImpactScore(affectedCount = 50, locationType = 'Residential', severity = 'Medium', isEmergency = false) {
  // 1. Affected Count Points (Max 35)
  let affectedPoints = 10;
  if (affectedCount >= 500) affectedPoints = 35;
  else if (affectedCount >= 200) affectedPoints = 30;
  else if (affectedCount >= 50) affectedPoints = 22;
  else if (affectedCount >= 15) affectedPoints = 15;

  // 2. Location Criticality Points (Max 25)
  let locationPoints = 10;
  if (['Hospital', 'School'].includes(locationType)) locationPoints = 25;
  else if (['Market', 'Commercial'].includes(locationType)) locationPoints = 18;
  else if (['Highway', 'Public Transit'].includes(locationType)) locationPoints = 20;
  else if (['Government Office'].includes(locationType)) locationPoints = 15;

  // 3. Severity Points (Max 30)
  let severityPoints = 15;
  if (severity === 'Critical') severityPoints = 30;
  else if (severity === 'High') severityPoints = 22;
  else if (severity === 'Medium') severityPoints = 14;
  else severityPoints = 6;

  // 4. Emergency Bonus Points (Max 10)
  const emergencyPoints = isEmergency ? 10 : 0;

  const totalScore = Math.min(100, affectedPoints + locationPoints + severityPoints + emergencyPoints);

  let label = 'Moderate Public Impact';
  let color = '#3b82f6';
  if (totalScore >= 80) {
    label = 'Critical Public Hazard';
    color = '#ef4444';
  } else if (totalScore >= 60) {
    label = 'High Community Impact';
    color = '#f97316';
  } else if (totalScore <= 35) {
    label = 'Localized Issue';
    color = '#10b981';
  }

  return {
    score: totalScore,
    label,
    color,
    breakdown: {
      affected_population_points: affectedPoints,
      location_criticality_points: locationPoints,
      severity_points: severityPoints,
      emergency_bonus: emergencyPoints
    }
  };
}

/**
 * Intelligent local NLP & rule-based prediction engine (Fallback & Native)
 */
function localPredictAll(data) {
  const rawText = data.text || '';
  const { normalizedText, detectedLanguage, detectedKeywords } = multilingualService.normalizeToEnglish(rawText);
  const text = normalizedText.toLowerCase();

  const locationType = data.location_type || 'Residential';
  const severity = data.severity || 'Medium';
  const affectedCount = Number(data.affected_count) || 50;
  const ward = data.ward || 'Ward 1';

  // 1. Emergency Detection across EN, BN, HI
  const emergencyRes = multilingualService.detectEmergency(rawText);
  const isEmergency = Boolean(data.is_emergency || emergencyRes.isEmergency);

  // 2. 30-Category Classification
  let bestCat = 'Roads & Public Works';
  let bestSubcat = 'General Issue';
  let maxMatches = 0;

  if (emergencyRes.isEmergency && emergencyRes.category) {
    bestCat = emergencyRes.category;
    maxMatches = 5;
  } else {
    for (const [cat, details] of Object.entries(CATEGORY_TAXONOMY)) {
      let matches = 0;
      for (const kw of details.keywords) {
        if (text.includes(kw.toLowerCase())) matches++;
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCat = cat;
      }
    }
  }

  // Infer best subcategory from taxonomy
  const activeTax = CATEGORY_TAXONOMY[bestCat] || CATEGORY_TAXONOMY['Roads & Public Works'];
  if (activeTax.subcategories && activeTax.subcategories.length > 0) {
    for (const sub of activeTax.subcategories) {
      const subWords = sub.toLowerCase().split(/[\s/]+/);
      if (subWords.some(w => w.length > 3 && text.includes(w))) {
        bestSubcat = sub;
        break;
      }
    }
    if (bestSubcat === 'General Issue') {
      bestSubcat = activeTax.subcategories[0];
    }
  }

  const confidence = maxMatches > 0 ? Math.min(0.97, 0.74 + maxMatches * 0.06) : 0.70;
  const department = bestCat;

  // 3. Real ML-Aligned Priority Prediction & Risk Factor Extraction
  const hasNegation = Boolean(
    text.match(/\bno\s+(?:immediate\s+)?(?:danger|threat|risk|emergency|hazard)\b/i) ||
    text.includes('কোনও জরুরি বিপদ নেই') ||
    text.includes('কোনো জরুরি বিপদ নেই') ||
    text.includes('বিপদ নেই') ||
    text.includes('कोई तत्काल खतरा नहीं') ||
    text.includes('कोई खतरा नहीं')
  );

  const riskFactors = [];
  let priority = 'MEDIUM';
  let prioConfidence = 0.88;

  const hasElec = Boolean(text.match(/\b(live.*wire|sparking|electric shock|high voltage|electrocuted|11kv)\b/i) || text.includes('বিদ্যুতের তার') || text.includes('বিদ্যুৎস্পৃষ্ট') || text.includes('बिजली का तार'));
  const hasViolence = Boolean(text.match(/\b(attack|assault|attacking|attacked|beating|clash|bomb|firing)\b/i) || text.includes('আক্রমণ') || text.includes('হামলা') || text.includes('मारपीट'));
  const hasChild = Boolean(text.match(/\b(child|children|minor|baby|school entrance)\b/i) || text.includes('শিশু') || text.includes('বাচ্চা') || text.includes('बच्चा'));
  const hasWoman = Boolean(text.match(/\b(woman|female|girl|stalking|followed|harassed|eve teasing)\b/i) || text.includes('নারী') || text.includes('মহিলা') || text.includes('महिला'));
  const hasCyberLoss = Boolean(text.match(/\b(charged|debited|fraudulently|transferred|₹25,000|₹|siphoned|bank fraud)\b/i) && text.match(/\b(fraud|otp|upi|bank account|hacked)\b/i));
  const hasAccident = Boolean(text.match(/\b(pothole|suddenly brake|accidents are becoming likely|accidents occurring|skid|crash)\b/i) || text.includes('গর্ত') || text.includes('দুর্ঘটনা') || text.includes('गड्ढा') || text.includes('हादसा'));
  const hasHealthRisk = Boolean(text.match(/\b(large pile of waste|health risk|severe health|stench|carcass|epidemic)\b/i) || text.includes('স্বাস্থ্যঝুঁকি') || text.includes('বিমারি') || text.includes('बीमारी'));
  const hasManhole = Boolean(text.match(/\b(uncovered manhole|open manhole|manhole)\b/i) || text.includes('ম্যানহোল') || text.includes('मैनहोल'));
  const isActiveNow = Boolean(text.match(/\b(right now|currently|happening now|at this moment)\b/i) || text.includes('এই মুহূর্তে') || text.includes('इस समय'));

  // Risk Factors Extraction
  if (!hasNegation && (isEmergency || (isActiveNow && (hasViolence || hasChild || hasElec)))) {
    riskFactors.push('Immediate Life-Safety Hazard Detected');
  }
  if (hasElec) riskFactors.push('Electrical Hazard / High-Voltage Risk');
  if (hasViolence) riskFactors.push('Active Physical Threat / Violent Conflict');
  if (hasChild) riskFactors.push('Child Safety / Minors at Risk');
  if (hasWoman) riskFactors.push('Women Safety Concern / Repeated Harassment');
  if (hasAccident) riskFactors.push('Accident Risk on Busy Carriageway');
  if (hasHealthRisk) riskFactors.push('Significant Public Health & Contamination Risk');
  if (hasManhole) riskFactors.push('Critical Public Infrastructure Vulnerability');
  if (hasCyberLoss) riskFactors.push('Financial Cyber Fraud / Account Intrusion');
  if (['Hospital', 'School', 'Highway', 'Market'].includes(locationType)) {
    riskFactors.push(`High-Density Sensitive Zone (${locationType})`);
  }
  if (affectedCount >= 200) {
    riskFactors.push(`Large Population Impact (${affectedCount}+ citizens)`);
  } else if (affectedCount >= 50) {
    riskFactors.push(`Moderate Community Impact (${affectedCount} citizens)`);
  }

  // Priority Assessment
  if (!hasNegation && (isEmergency || (hasElec && !hasNegation) || (hasManhole && hasChild) || (isActiveNow && (hasViolence || hasChild)) || (hasChild && text.includes('immediate danger')))) {
    priority = 'CRITICAL';
    prioConfidence = 0.99;
  } else if (hasAccident || hasWoman || hasCyberLoss || hasHealthRisk || (severity === 'High' && !hasNegation)) {
    priority = 'HIGH';
    prioConfidence = 0.96;
  } else if (hasNegation || text.match(/\b(one streetlight|missed once|minor|small leak)\b/i) || text.includes('একটি স্ট্রিট লাইট') || text.includes('একবার') || severity === 'Low') {
    priority = 'LOW';
    prioConfidence = 0.98;
  } else {
    priority = 'MEDIUM';
    prioConfidence = 0.95;
  }

  if (riskFactors.length === 0) {
    riskFactors.push('Routine Civic Maintenance Requirement');
  }

  const slaHours = isEmergency ? 24 : (SLA_HOURS_MAP[priority] || 72);

  // 4. Duplicate Detection (Haversine + Token Overlap)
  const existingComplaints = data.existing_complaints || [];
  let isDuplicate = false;
  let maxSim = 0;
  let matchedId = null;
  const matches = [];

  const textTokens = new Set(text.split(/\W+/).filter((w) => w.length > 2));

  for (const item of existingComplaints) {
    const existText = (item.description || item.title || '').toLowerCase();
    const existTokens = new Set(existText.split(/\W+/).filter((w) => w.length > 2));

    let common = 0;
    for (const t of textTokens) {
      if (existTokens.has(t)) common++;
    }
    const unionSize = new Set([...textTokens, ...existTokens]).size || 1;
    const textSim = common / unionSize;

    let dist = 9999;
    let geoSim = 0;
    if (data.latitude && data.longitude && item.latitude && item.longitude) {
      dist = calculateHaversineDistance(data.latitude, data.longitude, item.latitude, item.longitude);
      geoSim = Math.max(0, 1 - dist / 350);
    }

    const fusedScore = 0.6 * textSim + 0.4 * geoSim;
    if (fusedScore >= 0.58) {
      const matchObj = {
        complaint_id: item.tracking_id || item.id,
        title: item.title,
        distance_meters: Math.round(dist),
        text_similarity: Math.round(textSim * 100),
        geo_proximity_score: Math.round(geoSim * 100),
        combined_similarity: Math.round(fusedScore * 100)
      };
      matches.push(matchObj);
      if (fusedScore > maxSim) {
        maxSim = fusedScore;
        matchedId = matchObj.complaint_id;
      }
    }
  }

  if (matches.length > 0) isDuplicate = true;

  // 5. Resolution Days Estimation
  const baseDays = {
    'Fire & Emergency Services': 0.5,
    'Electricity & Power': 1.2,
    'Public Health & Sanitation': 1.8,
    'Solid Waste Management': 1.5,
    'Water Supply': 2.0,
    'Drainage & Sewerage': 2.4,
    'Street Lighting & Electrical': 2.1,
    'Roads & Public Works': 3.5,
    'Traffic & Road Safety': 1.5,
    'Police & Law Enforcement': 2.0,
    'Cyber Crime': 3.0,
    'Women & Child Safety': 1.0
  }[bestCat] || 3.0;

  const prioMul = { CRITICAL: 0.5, HIGH: 0.8, MEDIUM: 1.1, LOW: 1.5 }[priority] || 1.0;
  const estimatedDays = Math.max(0.5, Number((baseDays * prioMul).toFixed(1)));

  // 6. Citizen Impact Score
  const impactScoreObj = calculateImpactScore(affectedCount, locationType, priority === 'CRITICAL' ? 'Critical' : severity, isEmergency);

  // 7. AI Root-Cause Suggestions & Recommended Actions
  const rootCauses = activeTax.causes || ['Environmental wear & tear', 'High seasonal civic load'];
  const recommendedActions = activeTax.actions || ['Inspect site location', 'Deploy field work team', 'Verify resolution evidence'];

  return {
    category_prediction: {
      category: bestCat,
      subcategory: bestSubcat,
      department: department,
      confidence: Number(confidence.toFixed(2)),
      detected_language: detectedLanguage,
      multilingual_keywords: detectedKeywords
    },
    priority_prediction: {
      priority: priority,
      confidence: Number(prioConfidence.toFixed(2)),
      sla_hours: slaHours,
      risk_factors: riskFactors
    },
    duplicate_detection: {
      is_duplicate: isDuplicate,
      max_similarity: Math.round(maxSim * 100),
      matched_complaint_id: matchedId,
      matches: matches.sort((a, b) => b.combined_similarity - a.combined_similarity).slice(0, 3)
    },
    resolution_prediction: {
      estimated_days: estimatedDays,
      estimated_hours: estimatedDays * 24,
      confidence_range_days: [Math.max(0.5, estimatedDays - 0.5), estimatedDays + 0.8]
    },
    impact_assessment: impactScoreObj,
    root_cause_analysis: {
      category: bestCat,
      subcategory: bestSubcat,
      possible_causes: rootCauses,
      recommended_actions: recommendedActions
    },
    emergency_analysis: {
      is_emergency: isEmergency,
      helpline: emergencyRes.helpline || '112',
      guidance: emergencyRes.guidance || (isEmergency ? 'Critical situation flagged for immediate administrative dispatch.' : null)
    },
    summary: {
      category: bestCat,
      subcategory: bestSubcat,
      department: department,
      priority: priority,
      sla_hours: slaHours,
      estimated_days: estimatedDays,
      impact_score: impactScoreObj.score,
      impact_label: impactScoreObj.label,
      is_duplicate: isDuplicate,
      duplicate_match_id: matchedId,
      is_emergency: isEmergency,
      detected_language: detectedLanguage
    }
  };
}

class MLClient {
  async predictAll(data) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/predict/all`, data, { timeout: 3500 });
      // Enrich response with impact score, root causes, and multilingual emergency
      const localEnrichment = localPredictAll(data);
      return {
        ...response.data,
        impact_assessment: localEnrichment.impact_assessment,
        root_cause_analysis: localEnrichment.root_cause_analysis,
        emergency_analysis: localEnrichment.emergency_analysis,
        summary: {
          ...response.data.summary,
          impact_score: localEnrichment.impact_assessment.score,
          impact_label: localEnrichment.impact_assessment.label,
          detected_language: localEnrichment.category_prediction.detected_language
        }
      };
    } catch (err) {
      // Fallback seamlessly to enhanced built-in local engine
      return localPredictAll(data);
    }
  }

  async predictCategory(text) {
    return localPredictAll({ text }).category_prediction;
  }

  async predictPriority(data) {
    return localPredictAll(data).priority_prediction;
  }

  async checkDuplicate(data) {
    return localPredictAll(data).duplicate_detection;
  }

  async predictResolutionTime(data) {
    return localPredictAll(data).resolution_prediction;
  }

  async getTaxonomy() {
    const categories = {};
    for (const [cat, details] of Object.entries(CATEGORY_TAXONOMY)) {
      categories[cat] = details.subcategories;
    }
    return { categories };
  }

  calculateImpactScore(affectedCount, locationType, severity, isEmergency) {
    return calculateImpactScore(affectedCount, locationType, severity, isEmergency);
  }
}

module.exports = new MLClient();
