import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  Search, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck,
  Check, 
  Copy, 
  ArrowRight, 
  Sparkles, 
  PhoneCall, 
  Layers, 
  ExternalLink,
  Shield,
  Laptop,
  HeartPulse,
  Car,
  HardHat,
  Waves,
  Droplets,
  Trash2,
  Lightbulb,
  Stethoscope,
  Flame,
  Wind,
  Trees,
  FileText,
  Home,
  Zap,
  Bus,
  Train,
  UtensilsCrossed,
  Scale,
  BookOpen,
  GraduationCap,
  Briefcase,
  Sprout,
  Dog,
  TreePine,
  Landmark,
  UserCheck,
  X,
  Clock,
  Activity
} from 'lucide-react';

export const ALL_30_DEPARTMENTS_DATA = [
  {
    id: 1,
    name: 'Police & Law Enforcement',
    code: 'POL',
    group: 'emergency',
    icon: Shield,
    helpline: '100 / 112',
    helplineRaw: '112',
    helplineLabel: 'National Police Emergency',
    email: 'police.dept@civic.gov.in',
    head: 'Superintendent Rajesh Verma',
    isEmergency: true,
    issues: 'Theft, burglary, robbery, physical assault, public violence, missing persons, extortion',
    tags: ['Theft & Robbery', 'Physical Assault', 'Public Safety', 'Missing Persons']
  },
  {
    id: 2,
    name: 'Cyber Crime',
    code: 'CYB',
    group: 'emergency',
    icon: Laptop,
    helpline: '1930',
    helplineRaw: '1930',
    helplineLabel: 'National Cyber Financial Fraud',
    email: 'cyber.crime@civic.gov.in',
    head: 'Inspector Meera Sen',
    isEmergency: true,
    issues: 'UPI fraud, phishing links, banking OTP scams, account hacking, online extortion',
    tags: ['UPI & Bank Fraud', 'Phishing & Scams', 'Account Hacking', 'Cyber Harassment']
  },
  {
    id: 3,
    name: 'Women & Child Safety',
    code: 'WCS',
    group: 'emergency',
    icon: ShieldCheck,
    helpline: '1090 / 1098',
    helplineRaw: '1090',
    helplineLabel: 'Women 1090 | Childline 1098',
    email: 'women.safety@civic.gov.in',
    head: 'Officer Ananya Roy',
    isEmergency: true,
    issues: 'Street harassment, stalking, domestic violence, child abuse, child labour',
    tags: ['Women Helpline', 'Child Protection', 'Harassment', 'Domestic Safety']
  },
  {
    id: 4,
    name: 'Traffic & Road Safety',
    code: 'TRS',
    group: 'emergency',
    icon: Car,
    helpline: '1073 / 1033',
    helplineRaw: '1073',
    helplineLabel: 'Traffic Police & Highway Hotline',
    email: 'traffic.safety@civic.gov.in',
    head: 'Inspector Vikram Singh',
    isEmergency: true,
    issues: 'Traffic signal failure, dangerous/rash driving, obstructive parking, road safety hazards',
    tags: ['Signal Failures', 'Reckless Driving', 'Obstruction', 'Highway Safety']
  },
  {
    id: 5,
    name: 'Roads & Public Works',
    code: 'PWD',
    group: 'infra',
    icon: HardHat,
    helpline: '1800-345-3883',
    helplineRaw: '18003453883',
    helplineLabel: 'State PWD Grievance Desk',
    email: 'roads.pwd@civic.gov.in',
    head: 'Dr. Alok Mukherjee',
    isEmergency: false,
    issues: 'Potholes, broken roads, damaged asphalt, bridge structural cracks, flyover repairs',
    tags: ['Potholes & Asphalt', 'Damaged Roads', 'Bridges & Flyovers', 'Structural Repairs']
  },
  {
    id: 6,
    name: 'Drainage & Sewerage',
    code: 'DSB',
    group: 'infra',
    icon: Waves,
    helpline: '1800-345-3375',
    helplineRaw: '18003453375',
    helplineLabel: 'Municipal Sewer Control Room',
    email: 'drainage.sewerage@civic.gov.in',
    head: 'Er. Subrata Pal',
    isEmergency: false,
    issues: 'Open manholes, overflowing sewers, choked gutters, monsoon waterlogging',
    tags: ['Open Manholes', 'Sewer Overflows', 'Choked Drains', 'Monsoon Flooding']
  },
  {
    id: 7,
    name: 'Water Supply',
    code: 'WSD',
    group: 'infra',
    icon: Droplets,
    helpline: '1916',
    helplineRaw: '1916',
    helplineLabel: 'Drinking Water Supply Hotline',
    email: 'water.supply@civic.gov.in',
    head: 'Er. Debasis Das',
    isEmergency: false,
    issues: 'Pipeline bursts, contaminated tap water, drinking water scarcity, water tankers',
    tags: ['Pipeline Bursts', 'Drinking Water', 'Contamination', 'Water Tankers']
  },
  {
    id: 8,
    name: 'Solid Waste Management',
    code: 'SWM',
    group: 'infra',
    icon: Trash2,
    helpline: '1969',
    helplineRaw: '1969',
    helplineLabel: 'Swachhata Citizen Helpline',
    email: 'solid.waste@civic.gov.in',
    head: 'Ms. Sunita Banerjee',
    isEmergency: false,
    issues: 'Overflowing garbage vats, uncollected trash, illegal dumping, rotting bio-waste',
    tags: ['Garbage Clearing', 'Illegal Dumping', 'Waste Collection', 'Bio-Waste']
  },
  {
    id: 9,
    name: 'Street Lighting & Electrical',
    code: 'SLE',
    group: 'infra',
    icon: Lightbulb,
    helpline: '1912',
    helplineRaw: '1912',
    helplineLabel: 'Municipal Electrical & Lighting Desk',
    email: 'street.lighting@civic.gov.in',
    head: 'Er. Rajesh Roy',
    isEmergency: false,
    issues: 'Broken streetlights, dark road stretches, dangling cables, leaning electric poles',
    tags: ['Broken Streetlights', 'Dark Stretches', 'Dangling Wires', 'Pole Damage']
  },
  {
    id: 10,
    name: 'Public Health & Sanitation',
    code: 'PHS',
    group: 'services',
    icon: Stethoscope,
    helpline: '104',
    helplineRaw: '104',
    helplineLabel: 'State Health & Sanitation Desk',
    email: 'public.health@civic.gov.in',
    head: 'Dr. Manoj Mondal',
    isEmergency: false,
    issues: 'Mosquito breeding, dengue risk, anti-larval fogging, dirty public toilets, market hygiene',
    tags: ['Mosquito Fogging', 'Dengue Control', 'Public Toilets', 'Sanitation']
  },
  {
    id: 11,
    name: 'Fire & Emergency Services',
    code: 'FES',
    group: 'emergency',
    icon: Flame,
    helpline: '101 / 112',
    helplineRaw: '101',
    helplineLabel: '24x7 Fire Brigade Control Room',
    email: 'fire.emergency@civic.gov.in',
    head: 'Chief Fire Officer S. K. Bose',
    isEmergency: true,
    issues: 'Fire hazards, blocked emergency exits, fire hydrant defects, commercial fire safety',
    tags: ['Fire Rescue', 'Emergency Exits', 'Hydrant Defects', 'Fire Safety']
  },
  {
    id: 12,
    name: 'Disaster Management',
    code: 'DMA',
    group: 'emergency',
    icon: AlertTriangle,
    helpline: '1070 / 1077',
    helplineRaw: '1070',
    helplineLabel: 'State Disaster Control Room',
    email: 'disaster.mgmt@civic.gov.in',
    head: 'Officer Pradip Nandi',
    isEmergency: true,
    issues: 'Severe floods, storm uprooted trees, building collapse relief, embankment breach',
    tags: ['Storm Relief', 'Uprooted Trees', 'Building Collapse', 'Flood Rescue']
  },
  {
    id: 13,
    name: 'Environment & Pollution',
    code: 'ENP',
    group: 'services',
    icon: Wind,
    helpline: '1800-345-3399',
    helplineRaw: '18003453399',
    helplineLabel: 'Pollution Control Grievance',
    email: 'env.pollution@civic.gov.in',
    head: 'Dr. Sharmistha Guha',
    isEmergency: false,
    issues: 'Industrial smoke, chemical effluents, loud loudspeaker noise, open plastic burning',
    tags: ['Air Pollution', 'Noise Violations', 'Industrial Waste', 'Plastic Burning']
  },
  {
    id: 14,
    name: 'Parks & Public Spaces',
    code: 'PPS',
    group: 'infra',
    icon: Trees,
    helpline: '033-2286-1212',
    helplineRaw: '03322861212',
    helplineLabel: 'Municipal Parks & Horticulture',
    email: 'parks.spaces@civic.gov.in',
    head: 'Ms. Ritu Sen',
    isEmergency: false,
    issues: 'Broken playground swings, unsafe see-saws, damaged park benches, overgrown grass',
    tags: ['Playgrounds & Parks', 'Broken Swings', 'Benches & Paths', 'Grass Maintenance']
  },
  {
    id: 15,
    name: 'Building & Municipal Engineering',
    code: 'BME',
    group: 'infra',
    icon: Building2,
    helpline: '1800-120-8040',
    helplineRaw: '18001208040',
    helplineLabel: 'Municipal Building Vigilance',
    email: 'building.eng@civic.gov.in',
    head: 'Er. Tanmoy Dutta',
    isEmergency: false,
    issues: 'Unauthorized illegal construction, structurally unsafe buildings, building code violations',
    tags: ['Illegal Construction', 'Unsafe Buildings', 'Building Violations', 'Encroachment']
  },
  {
    id: 16,
    name: 'Land & Land Records',
    code: 'LLR',
    group: 'services',
    icon: FileText,
    helpline: '1800-345-5555',
    helplineRaw: '18003455555',
    helplineLabel: 'Land Records & Mutation Helpdesk',
    email: 'land.records@civic.gov.in',
    head: 'Officer Bikas Chatterjee',
    isEmergency: false,
    issues: 'Government land encroachment, illegal property mutation, forged land deeds',
    tags: ['Land Mutation', 'Land Encroachment', 'Deed Records', 'Property Disputes']
  },
  {
    id: 17,
    name: 'Housing & Urban Development',
    code: 'HUD',
    group: 'infra',
    icon: Home,
    helpline: '1800-345-6677',
    helplineRaw: '18003456677',
    helplineLabel: 'Urban Housing & Slum Welfare',
    email: 'housing.urban@civic.gov.in',
    head: 'Er. Nilanjan Ghosh',
    isEmergency: false,
    issues: 'Government housing defects, slum redevelopment delays, urban master planning',
    tags: ['Urban Housing', 'Civic Facilities', 'Redevelopment', 'Public Quarters']
  },
  {
    id: 18,
    name: 'Electricity & Power',
    code: 'ELP',
    group: 'services',
    icon: Zap,
    helpline: '1912 / 1800-345-5220',
    helplineRaw: '1912',
    helplineLabel: 'Power Supply & Grid Helpline',
    email: 'electricity.power@civic.gov.in',
    head: 'Er. Amitava Ghosh',
    isEmergency: false,
    issues: 'Transformer sparking, high-tension lines, power outages, severe voltage fluctuations',
    tags: ['Power Outages', 'Transformer Sparking', 'Voltage Fluctuation', 'Power Lines']
  },
  {
    id: 19,
    name: 'Public Transport',
    code: 'PTR',
    group: 'services',
    icon: Bus,
    helpline: '1800-345-8282',
    helplineRaw: '18003458282',
    helplineLabel: 'State Transport Grievance Cell',
    email: 'public.transport@civic.gov.in',
    head: 'Director Amitabha Basu',
    isEmergency: false,
    issues: 'Municipal bus schedule delays, skipped bus stops, overcrowded buses, broken shelters',
    tags: ['Bus Schedules', 'Route Delays', 'Bus Shelters', 'Overcrowding']
  },
  {
    id: 20,
    name: 'Railway-related Public Complaints',
    code: 'RPC',
    group: 'services',
    icon: Train,
    helpline: '139',
    helplineRaw: '139',
    helplineLabel: 'RailMadad 24x7 Public Helpline',
    email: 'railway.complaints@civic.gov.in',
    head: 'Liaison Officer Kalyan Das',
    isEmergency: false,
    issues: 'Station platform cleanliness, railway approach road damage, level crossing barrier safety',
    tags: ['Platform Cleanliness', 'Level Crossings', 'Approach Roads', 'Station Amenities']
  },
  {
    id: 21,
    name: 'Health & Hospitals',
    code: 'HNH',
    group: 'emergency',
    icon: HeartPulse,
    helpline: '102 / 108',
    helplineRaw: '108',
    helplineLabel: 'National Ambulance & Emergency',
    email: 'health.hospitals@civic.gov.in',
    head: 'Dr. Arunima Sanyal',
    isEmergency: true,
    issues: 'Casualty delays, doctor absenteeism, shortage of essential medicines, clinic sanitation',
    tags: ['Ambulance & Casualty', 'Hospital Cleanliness', 'Medicine Stock', 'Emergency Care']
  },
  {
    id: 22,
    name: 'Food & Public Distribution',
    code: 'FPD',
    group: 'services',
    icon: UtensilsCrossed,
    helpline: '1967 / 1800-345-5505',
    helplineRaw: '1967',
    helplineLabel: 'Ration & Food Security Helpdesk',
    email: 'food.distribution@civic.gov.in',
    head: 'Officer Soumen Barik',
    isEmergency: false,
    issues: 'Ration shop overcharging, under-weighing grains, substandard rotten grain quality',
    tags: ['Ration Shops', 'Food Quality', 'Weighing Fraud', 'PDS Distribution']
  },
  {
    id: 23,
    name: 'Consumer Affairs',
    code: 'COA',
    group: 'services',
    icon: Scale,
    helpline: '1915 / 1800-11-4000',
    helplineRaw: '1915',
    helplineLabel: 'National Consumer Toll-Free',
    email: 'consumer.affairs@civic.gov.in',
    head: 'Advocate Snehasis Dey',
    isEmergency: false,
    issues: 'Selling above MRP, warranty refusal, counterfeit goods, unfair trade practices',
    tags: ['Overcharging / MRP', 'Warranty Fraud', 'Counterfeits', 'Consumer Rights']
  },
  {
    id: 24,
    name: 'Education - Schools',
    code: 'EDS',
    group: 'welfare',
    icon: BookOpen,
    helpline: '1800-345-3525',
    helplineRaw: '18003453525',
    helplineLabel: 'Samagra Shiksha School Helpline',
    email: 'education.schools@civic.gov.in',
    head: 'Dr. Kaushik Maitra',
    isEmergency: false,
    issues: 'School building damage, non-functional toilets, contaminated school drinking water',
    tags: ['School Buildings', 'School Toilets', 'Drinking Water', 'Mid-Day Meals']
  },
  {
    id: 25,
    name: 'Higher Education',
    code: 'HED',
    group: 'welfare',
    icon: GraduationCap,
    helpline: '1800-180-5522',
    helplineRaw: '18001805522',
    helplineLabel: 'National Anti-Ragging Helpline',
    email: 'higher.education@civic.gov.in',
    head: 'Prof. Debabrata Roy',
    isEmergency: false,
    issues: 'Campus ragging & harassment, college hostel mess hygiene, semester exam scheduling',
    tags: ['Anti-Ragging', 'Hostel Hygiene', 'College Facilities', 'Campus Grievances']
  },
  {
    id: 26,
    name: 'Labour & Employment',
    code: 'LAE',
    group: 'welfare',
    icon: Briefcase,
    helpline: '14434',
    helplineRaw: '14434',
    helplineLabel: 'National Shram Suvidha Helpline',
    email: 'labour.employment@civic.gov.in',
    head: 'Officer Tanuja Mitra',
    isEmergency: false,
    issues: 'Unpaid wages, construction workplace safety, minimum wage compliance, wrongful termination',
    tags: ['Unpaid Wages', 'Workplace Safety', 'Labour Compliance', 'Minimum Wages']
  },
  {
    id: 27,
    name: 'Agriculture',
    code: 'AGR',
    group: 'welfare',
    icon: Sprout,
    helpline: '1800-180-1551',
    helplineRaw: '18001801551',
    helplineLabel: 'Kisan Call Centre 24x7',
    email: 'agriculture.dept@civic.gov.in',
    head: 'Dr. Partha Sarathi Roy',
    isEmergency: false,
    issues: 'Irrigation canal failure, crop loss survey delays, spurious seeds and fertilizers',
    tags: ['Kisan Helpline', 'Canal Irrigation', 'Crop Relief', 'Seed Quality']
  },
  {
    id: 28,
    name: 'Animal Resources',
    code: 'ANR',
    group: 'welfare',
    icon: Dog,
    helpline: '1962',
    helplineRaw: '1962',
    helplineLabel: 'Mobile Veterinary & Animal Rescue',
    email: 'animal.resources@civic.gov.in',
    head: 'Dr. Sujit Karmakar (DVM)',
    isEmergency: false,
    issues: 'Aggressive stray dogs, dog bite risk, rabies vaccination drives, injured stray animals',
    tags: ['Animal Rescue', 'Rabies Drives', 'Stray Control', 'Veterinary Care']
  },
  {
    id: 29,
    name: 'Forest & Wildlife',
    code: 'FAW',
    group: 'welfare',
    icon: TreePine,
    helpline: '1800-345-3829 / 1926',
    helplineRaw: '1926',
    helplineLabel: 'Forest Fire & Wildlife Distress',
    email: 'forest.wildlife@civic.gov.in',
    head: 'DFO R. K. Singh',
    isEmergency: false,
    issues: 'Illegal tree cutting, timber smuggling, wild animal intrusion, green belt conservation',
    tags: ['Forest Protection', 'Tree Felling', 'Wildlife Distress', 'Green Belts']
  },
  {
    id: 30,
    name: 'Public Grievance / General Administration',
    code: 'PGA',
    group: 'welfare',
    icon: Landmark,
    helpline: '1800-345-0111',
    helplineRaw: '18003450111',
    helplineLabel: 'Chief Minister Grievance Portal',
    email: 'public.grievance@civic.gov.in',
    head: 'Deputy Commissioner P. K. Mallick',
    isEmergency: false,
    issues: 'Certificate delays (birth/death/trade), bribery demands, public servant misconduct',
    tags: ['CM Grievance Portal', 'Certificate Delays', 'Administrative Ethics', 'Public Services']
  }
];

const GROUP_CONFIG = {
  emergency: {
    label: 'Emergency & Crime',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.3)',
    glow: 'rgba(239, 68, 68, 0.25)'
  },
  infra: {
    label: 'Infrastructure',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
    glow: 'rgba(245, 158, 11, 0.25)'
  },
  services: {
    label: 'Public Services',
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    border: 'rgba(6, 182, 212, 0.3)',
    glow: 'rgba(6, 182, 212, 0.25)'
  },
  welfare: {
    label: 'Social Welfare',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
    glow: 'rgba(16, 185, 129, 0.25)'
  }
};

export default function DepartmentDirectory({ onSelectDepartment }) {
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('ALL');
  const [copiedItem, setCopiedItem] = useState(null);

  const handleCopy = (text, type, id) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(`${type}-${id}`);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const filteredDepartments = useMemo(() => {
    return ALL_30_DEPARTMENTS_DATA.filter(dept => {
      const matchesGroup = selectedGroup === 'ALL' || 
        (selectedGroup === 'EMERGENCY' && (dept.isEmergency || dept.group === 'emergency')) ||
        (selectedGroup === 'INFRA' && dept.group === 'infra') ||
        (selectedGroup === 'SERVICES' && dept.group === 'services') ||
        (selectedGroup === 'WELFARE' && dept.group === 'welfare');

      const q = search.trim().toLowerCase();
      const matchesQuery = !q || 
        dept.name.toLowerCase().includes(q) ||
        dept.code.toLowerCase().includes(q) ||
        dept.helpline.toLowerCase().includes(q) ||
        dept.email.toLowerCase().includes(q) ||
        dept.issues.toLowerCase().includes(q) ||
        dept.head.toLowerCase().includes(q);

      return matchesGroup && matchesQuery;
    });
  }, [search, selectedGroup]);

  // Counts for tabs
  const emergencyCount = useMemo(() => ALL_30_DEPARTMENTS_DATA.filter(d => d.group === 'emergency').length, []);
  const infraCount = useMemo(() => ALL_30_DEPARTMENTS_DATA.filter(d => d.group === 'infra').length, []);
  const servicesCount = useMemo(() => ALL_30_DEPARTMENTS_DATA.filter(d => d.group === 'services').length, []);
  const welfareCount = useMemo(() => ALL_30_DEPARTMENTS_DATA.filter(d => d.group === 'welfare').length, []);

  return (
    <div style={{ marginBottom: '60px' }}>
      {/* Premium Glassmorphic Header Banner */}
      <div 
        className="dept-banner-container"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.82) 50%, rgba(15, 23, 42, 0.94) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.22)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Glow Lights */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '260px',
          height: '260px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(6, 182, 212, 0.08) 40%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
          filter: 'blur(30px)'
        }} />

        {/* Top Feature Badge Row */}
        <div 
          className="dept-badge-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '14px',
            position: 'relative',
            zIndex: 2
          }}
        >
          <span 
            className="dept-badge-pill"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.12))',
              color: '#60a5fa',
              border: '1px solid rgba(96, 165, 250, 0.35)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Building2 size={13} /> OFFICIAL DIRECTORY
          </span>

          <span 
            className="dept-badge-pill"
            style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.12))',
              color: '#f87171',
              border: '1px solid rgba(248, 113, 113, 0.35)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <PhoneCall size={13} /> 24×7 EMERGENCY
          </span>

          <span 
            className="dept-badge-pill"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.12))',
              color: '#34d399',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              borderRadius: '20px',
              padding: '4px 10px',
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <ShieldCheck size={13} /> VERIFIED HELPLINES
          </span>
        </div>

        {/* Title and Stats Hero Row */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <h1 
              className="dept-hero-title"
              style={{
                fontWeight: 900,
                color: '#ffffff',
                marginBottom: '8px',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '-0.5px'
              }}
            >
              30 Municipal Departments,{' '}
              <span style={{
                background: 'linear-gradient(135deg, #60a5fa 0%, #38bdf8 50%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Complaint Emails & Helplines
              </span>
            </h1>
            <p 
              className="dept-hero-desc"
              style={{
                color: 'var(--text-secondary)',
                margin: 0
              }}
            >
              Direct contact channels for all 30 public utility and municipal divisions. Call toll-free emergency hotlines, copy verified emails, or file an instant AI-routed complaint.
            </p>
          </div>

          {/* KPI Summary Strip */}
          <div 
            className="dept-kpi-grid"
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255, 255, 255, 0.08)', paddingRight: '8px' }}>
              <div 
                className="dept-kpi-number"
                style={{ fontWeight: 900, color: 'var(--accent-primary)', lineHeight: 1 }}
              >
                {filteredDepartments.length}
              </div>
              <div 
                className="dept-kpi-label"
                style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}
              >
                Divisions
              </div>
            </div>

            <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255, 255, 255, 0.08)', paddingRight: '8px' }}>
              <div 
                className="dept-kpi-number"
                style={{ fontWeight: 900, color: '#f87171', lineHeight: 1 }}
              >
                {emergencyCount}
              </div>
              <div 
                className="dept-kpi-label"
                style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}
              >
                Emergency
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div 
                className="dept-kpi-number"
                style={{ fontWeight: 900, color: '#34d399', lineHeight: 1 }}
              >
                100%
              </div>
              <div 
                className="dept-kpi-label"
                style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}
              >
                Monitored
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar & Filter Navigation */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Full-width Search Input Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            background: 'rgba(15, 23, 42, 0.85)',
            borderRadius: '14px',
            border: search ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: search 
              ? '0 0 0 3px rgba(59, 130, 246, 0.25), 0 8px 24px rgba(0,0,0,0.3)' 
              : '0 6px 20px rgba(0, 0, 0, 0.25)',
            transition: 'all 0.25s ease',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              paddingLeft: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: search ? 'var(--accent-primary)' : 'var(--text-muted)',
              flexShrink: 0
            }}>
              <Search size={18} />
            </div>

            <input
              type="text"
              className="input dept-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by department, 112, 1930, PWD, or issue..."
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                outline: 'none'
              }}
            />

            {search ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '12px', flexShrink: 0 }}>
                <span style={{
                  fontSize: '0.74rem',
                  color: 'var(--accent-cyan)',
                  background: 'rgba(6, 182, 212, 0.12)',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {filteredDepartments.length} found
                </span>
                <button
                  onClick={() => setSearch('')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <div className="dept-portal-tag" style={{ paddingRight: '14px', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <span style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '3px 7px',
                  borderRadius: '6px',
                  fontWeight: 700
                }}>
                  30 Portals
                </span>
              </div>
            )}
          </div>

          {/* Category Filter Tabs (Swipeable carousel on mobile) */}
          <div 
            className="dept-tabs-container"
          >
            {[
              { id: 'ALL', label: 'All 30 Departments', icon: Layers, count: 30, color: '#3b82f6' },
              { id: 'EMERGENCY', label: 'Emergency & Crime', icon: ShieldAlert, count: emergencyCount, color: '#ef4444' },
              { id: 'INFRA', label: 'Infrastructure & Utilities', icon: HardHat, count: infraCount, color: '#f59e0b' },
              { id: 'SERVICES', label: 'Public Services & Power', icon: Zap, count: servicesCount, color: '#06b6d4' },
              { id: 'WELFARE', label: 'Education & Social Welfare', icon: GraduationCap, count: welfareCount, color: '#10b981' }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = selectedGroup === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedGroup(tab.id)}
                  className="dept-tab-pill"
                  style={{
                    borderRadius: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    background: isActive 
                      ? `linear-gradient(135deg, ${tab.color}, ${tab.color}dd)` 
                      : 'rgba(30, 41, 59, 0.65)',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    borderColor: isActive ? tab.color : 'rgba(255, 255, 255, 0.08)',
                    boxShadow: isActive ? `0 4px 16px ${tab.color}40` : 'none',
                    transform: isActive ? 'translateY(-1px)' : 'none'
                  }}
                >
                  <TabIcon size={14} color={isActive ? '#ffffff' : tab.color} />
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 800
                  }}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid of 30 Department Cards */}
      {filteredDepartments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '50px 20px',
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '20px',
          border: '1px dashed rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            color: '#f59e0b'
          }}>
            <AlertTriangle size={28} />
          </div>
          <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: 800, marginBottom: '6px' }}>
            No Matching Departments Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '440px', margin: '0 auto 18px' }}>
            We couldn't find any division matching "{search}". Try searching for keywords like "Police", "Water", "Electricity", "Pothole", or "112".
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setSearch(''); setSelectedGroup('ALL'); }}
            style={{ borderRadius: '10px' }}
          >
            Reset Filters & View All 30
          </button>
        </div>
      ) : (
        <div 
          className="dept-cards-grid"
        >
          {filteredDepartments.map(dept => {
            const isEmailCopied = copiedItem === `email-${dept.id}`;
            const isPhoneCopied = copiedItem === `phone-${dept.id}`;
            const groupConfig = GROUP_CONFIG[dept.group] || GROUP_CONFIG.infra;
            const DeptIcon = dept.icon || Building2;

            return (
              <div 
                key={dept.id}
                className="dept-card"
                style={{
                  background: 'linear-gradient(180deg, rgba(26, 34, 52, 0.92) 0%, rgba(15, 23, 42, 0.95) 100%)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: dept.isEmergency 
                    ? '1px solid rgba(239, 68, 68, 0.35)' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: dept.isEmergency
                    ? '0 10px 30px -10px rgba(239, 68, 68, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 10px 30px -10px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = dept.isEmergency
                    ? '0 16px 32px -10px rgba(239, 68, 68, 0.35), 0 0 20px rgba(239, 68, 68, 0.2)'
                    : '0 16px 32px -10px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.15)';
                  e.currentTarget.style.borderColor = dept.isEmergency ? '#ef4444' : 'var(--accent-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = dept.isEmergency
                    ? '0 10px 30px -10px rgba(239, 68, 68, 0.2), 0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 10px 30px -10px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.2)';
                  e.currentTarget.style.borderColor = dept.isEmergency 
                    ? 'rgba(239, 68, 68, 0.35)' 
                    : 'rgba(255, 255, 255, 0.08)';
                }}
              >
                {/* Top Accent Line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: dept.isEmergency 
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                    : `linear-gradient(90deg, ${groupConfig.color}, #3b82f6)`
                }} />

                <div>
                  {/* Top Bar: Icon + ID/Code + Emergency Pill */}
                  <div 
                    className="dept-card-header"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Department Icon Box */}
                      <div 
                        className="dept-contact-icon"
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: groupConfig.bg,
                          border: `1px solid ${groupConfig.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: groupConfig.color,
                          boxShadow: `0 4px 12px ${groupConfig.glow}`,
                          flexShrink: 0
                        }}
                      >
                        <DeptIcon size={18} />
                      </div>

                      {/* ID and Code Chips */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          color: 'var(--text-muted)',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '2px 7px',
                          borderRadius: '6px'
                        }}>
                          #{String(dept.id).padStart(2, '0')}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          letterSpacing: '0.5px',
                          color: groupConfig.color,
                          background: groupConfig.bg,
                          border: `1px solid ${groupConfig.border}`,
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {dept.code}
                        </span>
                      </div>
                    </div>

                    {dept.isEmergency && (
                      <span style={{
                        fontSize: '0.66rem',
                        fontWeight: 900,
                        letterSpacing: '0.4px',
                        color: '#f87171',
                        background: 'rgba(239, 68, 68, 0.16)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          boxShadow: '0 0 8px #ef4444'
                        }} />
                        24×7
                      </span>
                    )}
                  </div>

                  {/* Department Name */}
                  <h3 
                    className="dept-card-title"
                    style={{
                      fontWeight: 800,
                      color: '#ffffff',
                      lineHeight: 1.3,
                      fontFamily: 'var(--font-heading)'
                    }}
                  >
                    {dept.name}
                  </h3>

                  {/* In-Charge Officer */}
                  <div className="dept-card-head">
                    <UserCheck size={13} color="var(--accent-cyan)" />
                    <span>In-Charge: <strong style={{ color: '#ffffff', fontWeight: 700 }}>{dept.head}</strong></span>
                  </div>

                  {/* Issue Scope Tags (Pills) */}
                  <div className="dept-tags-row">
                    {(dept.tags || []).map((tag, idx) => (
                      <span key={idx} className="dept-tag-item">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Contact 1: Helpline Phone Box */}
                  <div 
                    className="dept-contact-box"
                    style={{
                      background: dept.isEmergency 
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.16) 0%, rgba(220, 38, 38, 0.08) 100%)' 
                        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.06) 100%)',
                      border: dept.isEmergency 
                        ? '1px solid rgba(239, 68, 68, 0.4)' 
                        : '1px solid rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div 
                        className="dept-contact-icon"
                        style={{
                          background: dept.isEmergency ? 'rgba(239, 68, 68, 0.28)' : 'rgba(59, 130, 246, 0.25)',
                          color: dept.isEmergency ? '#fca5a5' : '#60a5fa'
                        }}
                      >
                        <PhoneCall size={16} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {dept.helplineLabel}
                        </div>
                        <div 
                          className="dept-phone-text"
                          style={{
                            color: dept.isEmergency ? '#fca5a5' : '#93c5fd'
                          }}
                        >
                          {dept.helpline}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <a
                        href={`tel:${dept.helplineRaw}`}
                        title={`Call ${dept.helpline}`}
                        className="btn-call-pill"
                        style={{
                          background: dept.isEmergency 
                            ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
                            : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                          color: '#ffffff',
                          borderColor: dept.isEmergency ? '#f87171' : '#60a5fa'
                        }}
                      >
                        <Phone size={12} /> Call
                      </a>

                      <button
                        onClick={() => handleCopy(dept.helpline, 'phone', dept.id)}
                        title="Copy Helpline Number"
                        className="btn-copy-icon"
                      >
                        {isPhoneCopied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Contact 2: Official Grievance Email Box */}
                  <div 
                    className="dept-contact-box"
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div 
                        className="dept-contact-icon"
                        style={{
                          background: 'rgba(6, 182, 212, 0.16)',
                          color: 'var(--accent-cyan)'
                        }}
                      >
                        <Mail size={15} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          Official Complaint Mail
                        </div>
                        <a 
                          href={`mailto:${dept.email}?subject=Public%20Grievance%20-%20${encodeURIComponent(dept.name)}`}
                          title={`Send official mail to ${dept.email}`}
                          className="dept-email-text"
                          style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {dept.email}
                        </a>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleCopy(dept.email, 'email', dept.id)}
                        title="Copy Email Address"
                        className="btn-copy-icon"
                      >
                        {isEmailCopied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <button
                  className="dept-action-btn"
                  onClick={() => onSelectDepartment(dept)}
                >
                  <Sparkles size={15} />
                  File Grievance to {dept.code}
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
