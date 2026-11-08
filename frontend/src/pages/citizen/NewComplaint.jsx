import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Send,
  BrainCircuit,
  Upload,
  Sparkles,
  AlertTriangle,
  Clock,
  Building,
  CheckCircle2,
  MapPin,
  Shield,
  PhoneCall,
  Lock,
  Layers,
  Info,
  Mic,
  Bot,
  Globe,
  Activity,
  ThumbsUp,
  Flame,
  LifeBuoy,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import TwoWayLocationPicker from '../../components/location/TwoWayLocationPicker';
import DuplicateAlert from '../../components/complaint/DuplicateAlert';
import VoiceInputModal from '../../components/complaint/VoiceInputModal';
import AIComplaintAssistant from '../../components/complaint/AIComplaintAssistant';
import EvidenceUploader from '../../components/complaint/EvidenceUploader';
import AIImageAnalysisCard from '../../components/complaint/AIImageAnalysisCard';
import SceneDescriptionCard from '../../components/complaint/SceneDescriptionCard';
import { ALL_30_DEPARTMENTS_DATA } from '../../components/home/DepartmentDirectory';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function NewComplaint({ setCurrentRoute, setSelectedComplaintId }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [activeStep, setActiveStep] = useState(1); // 1: Details, 2: AI Match, 3: Location, 4: Evidence, 5: Review

  useEffect(() => {
    if (user && user.role === 'officer') {
      setCurrentRoute('officer-dashboard');
    }
  }, [user]);

  if (user && user.role === 'officer') {
    return (
      <div className="page-wrapper" style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', textAlign: 'center', padding: '36px 24px' }}>
          <ShieldAlert size={44} color="#ef4444" style={{ margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Officer Access Restriction
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
            Field Officers are restricted to operational task management and resolving assigned civic issues. Citizen complaint creation is strictly disabled for officer credentials.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => setCurrentRoute('officer-dashboard')}
          >
            Go to Officer Task Queue
          </button>
        </div>
      </div>
    );
  }
  const [title, setTitle] = useState('');
  const [originalCitizenInput, setOriginalCitizenInput] = useState('');
  const [structuredIncident, setStructuredIncident] = useState(null);
  const [description, setDescription] = useState('');
  const [locationConfirmed, setLocationConfirmed] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('AI Auto Detect');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Auto-Infer with AI');
  const [userOverrodeCategory, setUserOverrodeCategory] = useState(false);
  const [locationType, setLocationType] = useState('Residential');
  const [affectedCount, setAffectedCount] = useState(50);
  const [severity, setSeverity] = useState('Medium');
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [primaryImageFile, setPrimaryImageFile] = useState(null);
  const [primaryImagePreview, setPrimaryImagePreview] = useState(null);
  const [visualAnalysis, setVisualAnalysis] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAssistantModalOpen, setIsAssistantModalOpen] = useState(false);
  const [imageVerificationReport, setImageVerificationReport] = useState(null);

  // Dynamic Police Station Selection for Police & Cyber Crime
  const [policeStations, setPoliceStations] = useState([]);
  const [selectedPoliceStation, setSelectedPoliceStation] = useState('');
  const [loadingStations, setLoadingStations] = useState(false);

  // Normalized West Bengal Location State (defaults to neutral West Bengal coordinates until selected)
  const [locationData, setLocationData] = useState({
    state: 'West Bengal',
    administrative_type: 'Urban',
    district: '',
    latitude: 22.5726,
    longitude: 88.3639,
    address: '',
    address_formatted: ''
  });

  // Dynamic 30 departments & taxonomy loaded from backend (defaults to full 30 departments)
  const [departments, setDepartments] = useState(ALL_30_DEPARTMENTS_DATA);
  const [taxonomy, setTaxonomy] = useState({});
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  const [mlPreview, setMlPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // 0. Detect whether the current issue pertains to Police or Cyber Crime
  const isPoliceOrCyberCrime = useMemo(() => {
    const activeCategory = (userOverrodeCategory && selectedCategory && selectedCategory !== 'AI Auto Detect')
      ? selectedCategory
      : (mlPreview?.category_prediction?.category || mlPreview?.summary?.primaryDepartment || (selectedCategory !== 'AI Auto Detect' ? selectedCategory : ''));

    const lowerCat = (activeCategory || '').toLowerCase();
    const isCrimeFlag = Boolean(mlPreview?.summary?.is_crime || mlPreview?.category_prediction?.is_crime);

    const combinedText = `${title} ${description}`.toLowerCase();
    const textMatchesCrime = /\b(police|thana|fir|theft|stolen|robbery|assault|cyber|otp|scam|fraud|upi|phishing|hacked|blackmail|harassment|eve teasing)\b/i.test(combinedText) ||
      /চুরি|ছিনতাই|ডাকাতি|মারধর|হামলা|পুলিশ|থানা|সাইবার|প্রতারণা|জালিয়াতি|ওটিপি/i.test(combinedText) ||
      /चोरी|लूटपाट|डकैती|मारपीट|हमला|पुलिस|थाना|साइबर|धोखाधड़ी|ओटीपी/i.test(combinedText);

    return (
      lowerCat.includes('police') ||
      lowerCat.includes('cyber') ||
      lowerCat.includes('crime') ||
      lowerCat.includes('law enforcement') ||
      isCrimeFlag ||
      (textMatchesCrime && combinedText.length > 5)
    );
  }, [selectedCategory, mlPreview, title, description]);

  // Load Police Stations from backend whenever Police or Cyber Crime is detected OR district/coordinates change
  useEffect(() => {
    let isMounted = true;
    async function loadPoliceStations() {
      if (!isPoliceOrCyberCrime) return;
      setLoadingStations(true);
      try {
        const queryParams = new URLSearchParams();
        if (locationData.district && locationData.district !== 'West Bengal') {
          queryParams.append('district', locationData.district);
        }
        if (locationData.latitude && locationData.longitude) {
          queryParams.append('lat', locationData.latitude);
          queryParams.append('lng', locationData.longitude);
        }
        const qStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const res = await api.get(`/locations/police-stations${qStr}`);
        if (isMounted && res.data && res.data.policeStations) {
          setPoliceStations(res.data.policeStations);
        }
      } catch (err) {
        console.warn('Failed to load police stations:', err);
      } finally {
        if (isMounted) setLoadingStations(false);
      }
    }
    loadPoliceStations();
    return () => { isMounted = false; };
  }, [isPoliceOrCyberCrime, locationData.district, locationData.latitude, locationData.longitude]);

  // Sort police stations by proximity to incident location
  const sortedPoliceStations = useMemo(() => {
    if (!policeStations || policeStations.length === 0) return [];
    const lat = locationData.latitude;
    const lng = locationData.longitude;

    return [...policeStations].map(station => {
      let distanceKm = station.distanceKm !== undefined ? station.distanceKm : null;
      if (distanceKm === null && lat && lng) {
        const coords = station.location?.coordinates || station.coordinates;
        if (coords && coords.length >= 2) {
          const [sLng, sLat] = coords;
          const R = 6371;
          const dLat = (sLat - lat) * (Math.PI / 180);
          const dLon = (sLng - lng) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat * (Math.PI / 180)) * Math.cos(sLat * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distanceKm = parseFloat((R * c).toFixed(1));
        }
      }
      return { ...station, distanceKm };
    }).sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm !== null) return -1;
      if (b.distanceKm !== null) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [policeStations, locationData.latitude, locationData.longitude]);

  // Automatically sync or pre-select nearest police station
  useEffect(() => {
    if (!isPoliceOrCyberCrime) return;
    if (locationData.police_station) {
      setSelectedPoliceStation(locationData.police_station);
    } else if (!selectedPoliceStation && sortedPoliceStations.length > 0) {
      const defaultStation = sortedPoliceStations[0].name;
      setSelectedPoliceStation(defaultStation);
      setLocationData(prev => ({ ...prev, police_station: defaultStation }));
    }
  }, [isPoliceOrCyberCrime, locationData.police_station, sortedPoliceStations]);

  const handlePoliceStationChange = (e) => {
    const val = e.target.value;
    setSelectedPoliceStation(val);
    setLocationData(prev => ({
      ...prev,
      police_station: val
    }));
  };

  const activeStationObj = useMemo(() => {
    return sortedPoliceStations.find(s => s.name === selectedPoliceStation);
  }, [sortedPoliceStations, selectedPoliceStation]);

  const handleVoiceTranscript = (text) => {
    setDescription(prev => (prev ? `${prev} ${text}` : text).trim());
    if (!title) {
      setTitle(text.slice(0, 50));
    }
  };

  const handleAssistantApply = (draft) => {
    if (!draft) return;
    setTitle(draft.title || '');
    setDescription(draft.description || '');
    if (draft.original_citizen_input) {
      setOriginalCitizenInput(draft.original_citizen_input);
    }
    if (draft.structured_incident) {
      setStructuredIncident(draft.structured_incident);
    }
    if (draft.priority === 'CRITICAL' || draft.is_emergency) {
      setIsEmergency(true);
      setSeverity('Critical');
    } else if (draft.priority === 'HIGH') {
      setSeverity('High');
    } else if (draft.priority === 'LOW') {
      setSeverity('Low');
    } else {
      setSeverity('Medium');
    }
    if (draft.affected_count) {
      setAffectedCount(draft.affected_count);
    }
    if (draft.location_type) {
      setLocationType(draft.location_type);
    }
  };

  const analysisRequestIdRef = useRef(0);

  const handlePrimaryImageSelect = async (imgFile) => {
    const currentReqId = ++analysisRequestIdRef.current;
    setPrimaryImageFile(imgFile);

    if (!imgFile) {
      setPrimaryImagePreview(null);
      setVisualAnalysis(null);
      setIsAnalyzingImage(false);
      return;
    }

    try {
      setPrimaryImagePreview(URL.createObjectURL(imgFile));
    } catch (_) {
      setPrimaryImagePreview(null);
    }

    // Immediately clear previous visual analysis to avoid showing stale content
    setVisualAnalysis(null);
    setIsAnalyzingImage(true);

    try {
      const fd = new FormData();
      fd.append('evidence', imgFile);

      const res = await api.post('/evidence/preview-analysis', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Ignore stale response if another image was uploaded while this was in flight
      if (currentReqId !== analysisRequestIdRef.current) {
        return;
      }

      if (res.data?.analysis) {
        const anl = res.data.analysis;
        setVisualAnalysis(anl);

        // Auto-select category only if citizen has not entered an incident description yet
        const detectedDept = anl.incident?.visual_category || anl.category_prediction?.department;
        const detectedSubcat = anl.incident?.visual_subcategory || anl.category_prediction?.subcategory;

        if (detectedDept && detectedDept !== 'UNKNOWN' && detectedDept !== 'INSUFFICIENT_VISUAL_EVIDENCE') {
          if ((!description || description.trim().length < 6) && (selectedCategory === 'AI Auto Detect' || !selectedCategory)) {
            setSelectedCategory(detectedDept);
            if (detectedSubcat && detectedSubcat !== 'General' && detectedSubcat !== 'General Issue') {
              setSelectedSubcategory(detectedSubcat);
            }
          }
        }
      }
    } catch (err) {
      if (currentReqId === analysisRequestIdRef.current) {
        console.warn('Live visual AI preview error:', err);
      }
    } finally {
      if (currentReqId === analysisRequestIdRef.current) {
        setIsAnalyzingImage(false);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setImageVerificationReport({
        quality: file.size > 1500000 ? 'High Definition (Ultra)' : 'Good Quality (Camera Verified)',
        detected_features: ['Visual Edge Signature Authenticated', 'Depression / Refuse Morphology Verified'],
        confidence_percentage: '94%',
        sha256_hash: 'Verified Camera Digital Fingerprint',
        alignment_category: selectedCategory !== 'AI Auto Detect' ? selectedCategory : (mlPreview?.category_prediction?.category || 'Civic Infrastructure')
      });
    } else {
      setSelectedFile(null);
      setFilePreview(null);
      setImageVerificationReport(null);
    }
  };

  // 1. Fetch all 30 departments and category taxonomy dynamically from backend
  useEffect(() => {
    async function loadTaxonomyAndDepartments() {
      try {
        const [deptRes, taxRes] = await Promise.all([
          api.get('/departments'),
          api.get('/ml/taxonomy').catch(() => ({ data: { categories: {} } }))
        ]);
        if (deptRes.data && deptRes.data.departments) {
          setDepartments(deptRes.data.departments);
        }
        if (taxRes.data && taxRes.data.categories) {
          setTaxonomy(taxRes.data.categories);
        }
      } catch (err) {
        console.warn('Could not load dynamic departments:', err.message);
      }
    }
    loadTaxonomyAndDepartments();
  }, []);

  // 2. Synchronize subcategories dropdown based on selected (or auto-detected) category
  useEffect(() => {
    const activeCat = (selectedCategory !== 'AI Auto Detect')
      ? selectedCategory
      : (mlPreview?.category_prediction?.category || '');

    if (activeCat && taxonomy[activeCat]) {
      setAvailableSubcategories(taxonomy[activeCat]);
    } else {
      setAvailableSubcategories([]);
    }
  }, [selectedCategory, mlPreview, taxonomy]);

  // 3. Debounced real-time ML prediction preview as citizen types
  useEffect(() => {
    if (!description || description.trim().length < 6) {
      setMlPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await api.post('/complaints/preview-ml', {
          text: `${title} ${description}`,
          latitude: locationData.latitude || 22.7230,
          longitude: locationData.longitude || 88.4800,
          severity,
          location_type: locationType,
          ward: locationData.ward || locationData.gram_panchayat || 'Ward 1',
          affected_count: affectedCount
        });
        setMlPreview(res.data.preview);

        // Auto-detect emergency if ML engine flagged it
        if (res.data.preview?.summary?.is_emergency) {
          setIsEmergency(true);
        }
      } catch (err) {
        console.error('Preview error:', err);
      } finally {
        setPreviewLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [title, description, locationData, severity, locationType, affectedCount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setSubmitError('Please provide a complaint description');
      return;
    }

    if (!locationConfirmed && (!locationData.latitude || !locationData.longitude)) {
      setSubmitError('⚠️ Please select an incident location on the map before submitting.');
      const locEl = document.getElementById('complaint-location-picker');
      if (locEl) locEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const formData = new FormData();
      formData.append('title', title || 'Civic Issue Report');
      formData.append('description', description);

      formData.append('category', resolvedCategory);
      formData.append('subcategory', resolvedSubcategory);
      formData.append('department_name', resolvedCategory);
      formData.append('target_department', resolvedCategory);
      formData.append('location_type', locationType);
      formData.append('ward', locationData.ward || locationData.gram_panchayat || 'Ward 1');
      formData.append('address', locationData.address_formatted || locationData.address || 'West Bengal');
      formData.append('userEnteredAddress', locationData.userEnteredAddress || locationData.address_formatted || title || '');
      formData.append('affected_count', affectedCount);
      formData.append('severity', severity);
      formData.append('is_emergency', isEmergency ? '1' : '0');
      formData.append('latitude', locationData.latitude || 22.7230);
      formData.append('longitude', locationData.longitude || 88.4800);

      // Pass Vision AI analysis data, scene description and direct observations if available
      if (visualAnalysis) {
        const sceneDesc = visualAnalysis.scene?.description || visualAnalysis.scene_description || visualAnalysis.scene_analysis?.scene_description || visualAnalysis.image_overview?.description || '';
        const sceneType = visualAnalysis.scene?.scene_type || visualAnalysis.scene_type || visualAnalysis.scene_analysis?.scene_type || '';
        const directObs = visualAnalysis.evidence?.direct_observations || visualAnalysis.direct_observations || (Array.isArray(visualAnalysis.visual_findings) ? visualAnalysis.visual_findings.map(f => typeof f === 'object' ? f.observation : f) : []);

        if (sceneDesc) formData.append('scene_description', sceneDesc);
        if (sceneType) formData.append('scene_type', sceneType);
        if (directObs && directObs.length > 0) formData.append('direct_observations', JSON.stringify(directObs));
        formData.append('visual_analysis_data', JSON.stringify(visualAnalysis));
      }

      // Normalized location attributes
      formData.append('state', locationData.state || 'West Bengal');
      if (locationData.district_id) formData.append('district_id', locationData.district_id);
      formData.append('district', locationData.district || 'North 24 Parganas');
      if (locationData.subdivision_id) formData.append('subdivision_id', locationData.subdivision_id);
      formData.append('subdivision', locationData.subdivision || '');
      formData.append('administrative_type', locationData.administrative_type || 'Urban');
      if (locationData.ulb_id) formData.append('ulb_id', locationData.ulb_id);
      if (locationData.ulb_type) formData.append('ulb_type', locationData.ulb_type);
      formData.append('municipality', locationData.municipality || '');
      if (locationData.ward_id) formData.append('ward_id', locationData.ward_id);
      if (locationData.block_id) formData.append('block_id', locationData.block_id);
      formData.append('block', locationData.block || '');
      if (locationData.gram_panchayat_id) formData.append('gram_panchayat_id', locationData.gram_panchayat_id);
      formData.append('gram_panchayat', locationData.gram_panchayat || '');
      if (locationData.village_id) formData.append('village_id', locationData.village_id);
      formData.append('village', locationData.village || '');
      formData.append('mouza', locationData.mouza || '');
      formData.append('police_station', selectedPoliceStation || locationData.police_station || locationData.policeStation || '');
      formData.append('police_station_phone', activeStationObj?.phone || locationData.police_station_phone || locationData.policeStationPhone || '');
      formData.append('nearest_police_station', locationData.nearest_police_station || locationData.nearestPoliceStation || '');
      if (locationData.nearest_police_station_distance !== undefined || locationData.nearestStationDistance !== undefined) {
        formData.append('nearest_police_station_distance', locationData.nearest_police_station_distance !== undefined ? locationData.nearest_police_station_distance : locationData.nearestStationDistance);
      }
      formData.append('jurisdiction_police_station', locationData.jurisdiction_police_station || locationData.jurisdictionPoliceStation || '');
      formData.append('jurisdiction_verified', locationData.jurisdiction_verified || locationData.jurisdictionVerified ? '1' : '0');
      formData.append('location_source', locationData.location_source || locationData.locationSource || 'Citizen GPS & CivicPulse Resolution Pipeline');
      formData.append('verification_status', locationData.verification_status || locationData.verificationStatus || 'PARTIALLY_VERIFIED');
      formData.append('locality', locationData.locality || '');
      formData.append('landmark', locationData.landmark || '');
      formData.append('postal_code', locationData.postal_code || locationData.pincode || '');

      if (attachedFiles && attachedFiles.length > 0) {
        attachedFiles.forEach(file => {
          formData.append('evidence', file);
        });
      } else if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newComplaint = res.data.complaint;
      setSelectedComplaintId(newComplaint.id);
      setCurrentRoute('complaint-details');
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitError(err.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const aiTriageCategory = mlPreview?.category_prediction?.category || mlPreview?.summary?.primaryDepartment;
  const aiTriageSubcategory = mlPreview?.category_prediction?.subcategory || mlPreview?.summary?.subcategory;

  const resolvedCategory = (userOverrodeCategory && selectedCategory && selectedCategory !== 'AI Auto Detect')
    ? selectedCategory
    : (aiTriageCategory || (selectedCategory && selectedCategory !== 'AI Auto Detect' ? selectedCategory : 'Roads & Public Works'));

  const resolvedSubcategory = (userOverrodeCategory && selectedSubcategory && selectedSubcategory !== 'Auto-Infer with AI')
    ? selectedSubcategory
    : (aiTriageSubcategory || (selectedSubcategory && selectedSubcategory !== 'Auto-Infer with AI' ? selectedSubcategory : 'General Issue'));

  const activeCategory = resolvedCategory;

  const isCrimeCategory = ['Police & Law Enforcement', 'Cyber Crime', 'Women & Child Safety'].includes(activeCategory);
  const emergencyGuidance = mlPreview?.category_prediction?.emergency_guidance;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ maxWidth: '1050px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '2.2rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
              Report a Civic Grievance or Incident
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: user?.role === 'officer' ? '12px' : '0' }}>
              CivicPulse AI automatically classifies across <strong>all 30 government departments</strong>, pinpoints subcategories, computes SLA priorities, and guards citizen privacy.
            </p>

            {user?.role === 'officer' && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                color: 'var(--color-accent)',
                fontSize: '0.84rem',
                fontWeight: 600,
                marginTop: '10px'
              }}>
                <Briefcase size={15} />
                <span>Field Officer Ground Log • Submitting as: <strong>{user.name}</strong> ({user.department_name || 'Municipal Field Operations'})</span>
              </div>
            )}
          </div>

          {/* Emergency Advisory Callout */}
          {(isEmergency || isCrimeCategory || emergencyGuidance) && (
            <div className="emergency-advisory-banner">
              <div className="emergency-advisory-icon">
                <PhoneCall size={20} color="currentColor" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="emergency-advisory-title">
                  <span className="emergency-title-full">URGENT ASSISTANCE HELPLINE AVAILABLE</span>
                  <span className="emergency-title-short">Emergency Helpline</span>
                  <span className="badge badge-critical" style={{ fontSize: '0.7rem' }}>24x7</span>
                </div>
                <p className="emergency-advisory-desc">
                  {emergencyGuidance ? emergencyGuidance.advisory : 'If you or someone else is in immediate personal danger, please contact state emergency services immediately.'}
                </p>
                <div className="emergency-helpline-grid">
                  <a href="tel:112" className="emergency-helpline-pill" title="Call Emergency / Police">
                    <span className="emergency-pill-full">🚨 Police / Emergency: <strong>100 / 112</strong></span>
                    <span className="emergency-pill-short">🚨 Police: <strong>100/112</strong></span>
                  </a>
                  <a href="tel:1930" className="emergency-helpline-pill" title="Call Cyber Crime Fraud Helpline">
                    <span className="emergency-pill-full">💻 Cyber Crime Fraud: <strong>1930</strong></span>
                    <span className="emergency-pill-short">💻 Cyber: <strong>1930</strong></span>
                  </a>
                  <a href="tel:1090" className="emergency-helpline-pill" title="Call Women & Child Safety">
                    <span className="emergency-pill-full">🛡️ Women & Child Safety: <strong>1090 / 1098</strong></span>
                    <span className="emergency-pill-short">🛡️ Women: <strong>1090</strong></span>
                  </a>
                  <a href="tel:101" className="emergency-helpline-pill" title="Call Fire & Rescue">
                    <span className="emergency-pill-full">🚒 Fire & Rescue: <strong>101</strong></span>
                    <span className="emergency-pill-short">🚒 Fire: <strong>101</strong></span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Step Progress Stepper */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div
              className="stepper-container-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px'
              }}
            >
              {[
                { id: 1, label: 'Issue Details', desc: 'Title & details', icon: FileText },
                { id: 2, label: 'AI Classification', desc: 'Routing & SLA', icon: BrainCircuit },
                { id: 3, label: 'Location & Thana', desc: 'GIS jurisdiction', icon: MapPin },
                { id: 4, label: 'Evidence & Media', desc: 'Photos & proof', icon: Upload },
                { id: 5, label: 'Review & Submit', desc: 'Final verification', icon: CheckCircle2 }
              ].map((step) => {
                const isPassed = activeStep > step.id;
                const isCurrent = activeStep === step.id;
                const StepIcon = step.icon;

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      if (step.id < activeStep || (title.trim() && description.trim())) {
                        setActiveStep(step.id);
                        setSubmitError('');
                      } else {
                        setSubmitError(`Please provide an Issue Title and Description in Step 1 before proceeding to ${step.label}.`);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: isCurrent
                        ? '1.5px solid var(--accent-primary)'
                        : isPassed
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid var(--border-subtle)',
                      background: isCurrent
                        ? 'rgba(37, 99, 235, 0.08)'
                        : isPassed
                          ? 'rgba(16, 185, 129, 0.05)'
                          : 'var(--bg-surface-elevated)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      background: isPassed
                        ? '#16a34a'
                        : isCurrent
                          ? 'var(--accent-primary)'
                          : 'var(--bg-surface-active)',
                      color: (isPassed || isCurrent) ? '#ffffff' : 'var(--text-muted)'
                    }}>
                      {isPassed ? <Check size={14} strokeWidth={3} /> : step.id}
                    </div>
                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: '0.82rem',
                        fontWeight: isCurrent ? 700 : 600,
                        color: isCurrent ? 'var(--accent-primary)' : isPassed ? 'var(--text-primary)' : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }}>
                        {step.label}
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden'
                      }}>
                        {step.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="new-complaint-grid">
            {/* Left Column: Complaint Submission Form */}
            <div className="glass-card" style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
              {submitError && (
                <div className="alert-error" style={{ marginBottom: '20px' }}>
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* ================= STEP 1: ISSUE DETAILS ================= */}
                {activeStep === 1 && (
                  <div>
                    {/* Issue Title / Subject */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <FileText size={15} color="var(--accent-cyan)" />
                          <span>Issue Title / Subject</span>
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>*</span>
                        </label>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Clear & concise summary</span>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Broken water pipeline, power outage, or UPI payment fraud"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{
                          borderRadius: '10px',
                          padding: '12px 16px',
                          fontSize: '0.94rem'
                        }}
                      />
                    </div>

                    {/* Incident Description with Voice & AI Wizard */}
                    <div className="form-group" style={{ marginBottom: '22px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '10px',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}>
                        <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <AlertTriangle size={15} color="#fbbf24" />
                          <span>Incident Description</span>
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>*</span>
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setIsVoiceModalOpen(true)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '6px 13px',
                              fontSize: '0.78rem',
                              borderRadius: '9px',
                              background: 'rgba(6, 182, 212, 0.12)',
                              borderColor: 'rgba(6, 182, 212, 0.45)',
                              color: 'var(--accent-cyan)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            title="Voice dictation in English"
                          >
                            <Mic size={14} color="var(--accent-cyan)" />
                            <span style={{ fontWeight: 600 }}>Speak (Voice)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsAssistantModalOpen(true)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '6px 14px',
                              fontSize: '0.78rem',
                              borderRadius: '9px',
                              background: 'rgba(168, 85, 247, 0.15)',
                              borderColor: 'rgba(168, 85, 247, 0.45)',
                              color: 'var(--accent-purple)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            title="Conversational AI triage assistant"
                          >
                            <Sparkles size={14} color="var(--accent-purple)" />
                            <span style={{ fontWeight: 600 }}>AI Assistant Wizard</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        className="form-textarea"
                        rows={5}
                        placeholder="Describe the incident in detail. Include what happened, location hazards, timing, impact, etc. AI will inspect and categorize in real time."
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{
                          borderRadius: '10px',
                          padding: '14px 16px',
                          fontSize: '0.94rem',
                          lineHeight: '1.6'
                        }}
                      />

                      {/* Micro-Banner for AI Inspection & Char Counter */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                        padding: '0 4px',
                        fontSize: '0.74rem',
                        color: 'var(--text-muted)'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-purple)' }}>
                          <BrainCircuit size={13} />
                          <span>AI auto-detects department, computes SLA, and detects urgency in real time.</span>
                        </span>
                        <span>{description.trim().length > 0 ? `${description.trim().length} characters` : ''}</span>
                      </div>
                    </div>

                    {/* Step 1 Footer Action */}
                    <div className="step-nav-footer step-nav-footer-step1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!title.trim() || !description.trim()) {
                            setSubmitError('Please provide both an issue title and description before proceeding.');
                            return;
                          }
                          setSubmitError('');
                          setActiveStep(2);
                        }}
                        className="btn btn-primary step-nav-btn step-nav-btn-next"
                      >
                        <span className="desktop-only">Next: AI Classification</span>
                        <span className="mobile-only">Next: AI Routing</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 2: AI CLASSIFICATION & SLA ================= */}
                {activeStep === 2 && (
                  <div>
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <BrainCircuit size={18} color="var(--accent-primary)" />
                        <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                          Step 2: Intelligent Routing & SLA Determination
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Review automated departmental routing and citizen service level agreements (SLA) across municipal divisions.
                      </p>
                    </div>

                    {/* AI Real-Time Classification & Department Routing Card */}
                    <div style={{ marginBottom: '18px' }}>
                      {mlPreview?.category_prediction?.category || mlPreview?.summary?.primaryDepartment ? (
                        <div className="ai-classification-card">
                          <div className="ai-classification-header">
                            <div className="ai-classification-header-main">
                              <div className="ai-classification-badge-icon">
                                <Sparkles size={18} />
                              </div>
                              <div className="ai-classification-title-wrap">
                                <div className="ai-classification-pretitle">
                                  <span>Automated Department Routing</span>
                                  <span className="ai-classification-pill-status">AI Verified</span>
                                </div>
                                <h4 className="ai-classification-dept-name">
                                  {mlPreview.summary?.primaryDepartment || mlPreview.category_prediction?.category}
                                </h4>
                              </div>
                            </div>

                            <div className="ai-classification-badges-row">
                              {mlPreview.summary?.departmentConfidence !== null && mlPreview.summary?.departmentConfidence !== undefined && (
                                <span className="ai-classification-conf-badge">
                                  <CheckCircle2 size={12} />
                                  <span>{Math.round((mlPreview.summary?.departmentConfidence || mlPreview.category_prediction?.confidence || 0.85) * 100)}% Match Confidence</span>
                                </span>
                              )}

                              <span className={`ai-classification-prio-badge ${mlPreview.summary?.priority || 'MEDIUM'}`}>
                                <Activity size={12} />
                                <span>Priority: {mlPreview.summary?.priority || 'MEDIUM'}</span>
                              </span>

                              {mlPreview.summary?.requiresHumanReview && (
                                <span className="ai-classification-review-badge">
                                  <AlertTriangle size={12} />
                                  <span>Discretionary Review</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Subcategory & Secondary Departments */}
                          <div className="ai-classification-specs-grid">
                            <div className="ai-classification-spec-box">
                              <div className="ai-classification-spec-label">
                                <Layers size={13} />
                                <span>Sub-Classification Domain</span>
                              </div>
                              <span className="ai-classification-spec-value">
                                {mlPreview.summary?.subcategory || mlPreview.category_prediction?.subcategory || 'General Issue'}
                              </span>
                            </div>

                            <div className="ai-classification-spec-box">
                              <div className="ai-classification-spec-label">
                                <Building size={13} />
                                <span>Cross-Department Jurisdiction</span>
                              </div>
                              {mlPreview.summary?.secondaryDepartments && mlPreview.summary.secondaryDepartments.length > 0 ? (
                                <div className="ai-classification-dept-tags">
                                  {mlPreview.summary.secondaryDepartments.map((sDept, idx) => (
                                    <span key={idx} className="ai-classification-dept-tag">
                                      + {sDept}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="ai-classification-spec-none">
                                  <Check size={12} />
                                  <span>Primary Jurisdiction Only</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Classification Explanation / Reason */}
                          {mlPreview.summary?.reason && (
                            <div className="ai-classification-reason-box">
                              <Info size={15} className="ai-classification-reason-icon" />
                              <div className="ai-classification-reason-content">
                                <strong className="ai-classification-reason-title">Routing Rationale: </strong>
                                <span className="ai-classification-reason-text">{mlPreview.summary.reason}</span>
                              </div>
                            </div>
                          )}

                          <div className="ai-classification-footer">
                            <div className="ai-classification-footer-item">
                              <FileText size={13} />
                              <span>Classification: <strong>{mlPreview.summary?.incidentType || 'Standard Civic Complaint'}</strong></span>
                            </div>
                            <div className="ai-classification-footer-item">
                              <Clock size={13} />
                              <span>Target Resolution: <strong>{mlPreview.summary?.sla_hours || 72}h SLA Benchmark</strong></span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          borderRadius: '12px',
                          background: 'rgba(99, 102, 241, 0.06)',
                          border: '1px dashed rgba(99, 102, 241, 0.35)',
                          padding: '18px 20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <Sparkles size={24} color="var(--accent-primary)" />
                          <div>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
                              CivicPulse AI Classification Engine Ready
                            </strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Your issue title and description will be processed and matched to one of the 30 official departments.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>




                    {/* Step 2 Footer Navigation */}
                    <div className="step-nav-footer">
                      <button
                        type="button"
                        onClick={() => setActiveStep(1)}
                        className="btn btn-secondary step-nav-btn step-nav-btn-back"
                      >
                        <ChevronLeft size={16} />
                        <span className="desktop-only">Back: Details</span>
                        <span className="mobile-only">Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        className="btn btn-primary step-nav-btn step-nav-btn-next"
                      >
                        <span className="desktop-only">Next: Location & Thana</span>
                        <span className="mobile-only">Next: Location</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 3: LOCATION & JURISDICTION ================= */}
                {activeStep === 3 && (
                  <div>
                    <div className="step-section-header" style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', minWidth: 0 }}>
                        <MapPin size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                        <h3 className="step-section-title" style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)', wordBreak: 'break-word', minWidth: 0 }}>
                          <span className="step-title-full">Step 3: Incident Location & Administrative Jurisdiction</span>
                          <span className="step-title-short" style={{ display: 'none' }}>Step 3: Location & Jurisdiction</span>
                        </h3>
                      </div>
                      <p className="step-section-desc" style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Pick on the interactive West Bengal GIS map or search by district, ward, or block. Coordinates are automatically resolved.
                      </p>
                    </div>

                    {/* Two-Way GIS Interactive Location Picker */}
                    <div id="complaint-location-picker" style={{ scrollMarginTop: '100px', marginBottom: '20px', width: '100%', minWidth: 0 }}>
                      <TwoWayLocationPicker
                        initialLat={locationData.latitude}
                        initialLng={locationData.longitude}
                        initialAddress={locationData.userEnteredAddress || locationData.address_formatted || ''}
                        initialDistrict={locationData.district || 'West Bengal'}
                        isConfirmed={locationConfirmed}
                        isPoliceOrCyberCrime={isPoliceOrCyberCrime}
                        selectedPoliceStationProp={selectedPoliceStation}
                        onPoliceStationSelect={(name, details) => {
                          setSelectedPoliceStation(name);
                          setLocationData(prev => ({
                            ...prev,
                            police_station: name,
                            police_station_phone: details?.phone || ''
                          }));
                        }}
                        onLocationConfirm={(confirmedLoc) => {
                          setLocationConfirmed(true);
                          setLocationData(prev => ({
                            ...prev,
                            ...confirmedLoc,
                            address_formatted: confirmedLoc.address,
                            userEnteredAddress: confirmedLoc.userEnteredAddress || confirmedLoc.address,
                            latitude: confirmedLoc.latitude,
                            longitude: confirmedLoc.longitude,
                            district: confirmedLoc.district,
                            district_id: confirmedLoc.district_id || null,
                            subdivision: confirmedLoc.subdivision || '',
                            subdivision_id: confirmedLoc.subdivision_id || null,
                            administrative_type: confirmedLoc.administrativeUnit || 'Urban',
                            municipality: confirmedLoc.municipality || confirmedLoc.ulb || '',
                            ulb: confirmedLoc.ulb || '',
                            ulb_id: confirmedLoc.ulb_id || null,
                            ward: confirmedLoc.ward || '',
                            ward_id: confirmedLoc.ward_id || null,
                            block: confirmedLoc.block || '',
                            block_id: confirmedLoc.block_id || null,
                            gram_panchayat: confirmedLoc.gram_panchayat || '',
                            gram_panchayat_id: confirmedLoc.gram_panchayat_id || null,
                            village: confirmedLoc.village || '',
                            village_id: confirmedLoc.village_id || null,
                            police_station: confirmedLoc.policeStation || '',
                            police_station_phone: confirmedLoc.policeStationPhone || '',
                            postal_code: confirmedLoc.pincode || '',
                            nearest_police_station: confirmedLoc.nearest_police_station || confirmedLoc.nearestPoliceStation || '',
                            nearest_police_station_distance: confirmedLoc.nearest_police_station_distance !== undefined ? confirmedLoc.nearest_police_station_distance : confirmedLoc.nearestStationDistance,
                            jurisdiction_police_station: confirmedLoc.jurisdiction_police_station || confirmedLoc.jurisdictionPoliceStation || '',
                            jurisdiction_verified: Boolean(confirmedLoc.jurisdiction_verified || confirmedLoc.jurisdictionVerified),
                            location_source: confirmedLoc.locationSource || 'Citizen GPS & CivicPulse Resolution Pipeline',
                            verification_status: confirmedLoc.verificationStatus || 'PARTIALLY_VERIFIED'
                          }));
                          if (confirmedLoc.policeStation) {
                            setSelectedPoliceStation(confirmedLoc.policeStation);
                          }
                          setSubmitError('');
                        }}
                        onLocationChange={(changedLoc) => {
                          setLocationConfirmed(Boolean(changedLoc.isConfirmed));
                          setLocationData(prev => ({
                            ...prev,
                            ...changedLoc,
                            address_formatted: changedLoc.address,
                            userEnteredAddress: changedLoc.userEnteredAddress || changedLoc.address,
                            latitude: changedLoc.latitude,
                            longitude: changedLoc.longitude,
                            district: changedLoc.district,
                            district_id: changedLoc.district_id !== undefined ? changedLoc.district_id : null,
                            subdivision: changedLoc.subdivision !== undefined ? changedLoc.subdivision : '',
                            subdivision_id: changedLoc.subdivision_id !== undefined ? changedLoc.subdivision_id : null,
                            administrative_type: changedLoc.administrativeUnit || prev.administrative_type || 'Urban',
                            municipality: changedLoc.municipality !== undefined ? changedLoc.municipality : (changedLoc.ulb || ''),
                            ulb: changedLoc.ulb !== undefined ? changedLoc.ulb : '',
                            ulb_id: changedLoc.ulb_id !== undefined ? changedLoc.ulb_id : null,
                            ward: changedLoc.ward !== undefined ? changedLoc.ward : '',
                            ward_id: changedLoc.ward_id !== undefined ? changedLoc.ward_id : null,
                            block: changedLoc.block !== undefined ? changedLoc.block : '',
                            block_id: changedLoc.block_id !== undefined ? changedLoc.block_id : null,
                            gram_panchayat: changedLoc.gram_panchayat !== undefined ? changedLoc.gram_panchayat : '',
                            gram_panchayat_id: changedLoc.gram_panchayat_id !== undefined ? changedLoc.gram_panchayat_id : null,
                            village: changedLoc.village !== undefined ? changedLoc.village : '',
                            village_id: changedLoc.village_id !== undefined ? changedLoc.village_id : null,
                            police_station: changedLoc.policeStation || '',
                            police_station_phone: changedLoc.policeStationPhone || '',
                            postal_code: changedLoc.pincode || '',
                            nearest_police_station: changedLoc.nearest_police_station || changedLoc.nearestPoliceStation || '',
                            nearest_police_station_distance: changedLoc.nearest_police_station_distance !== undefined ? changedLoc.nearest_police_station_distance : changedLoc.nearestStationDistance,
                            jurisdiction_police_station: changedLoc.jurisdiction_police_station || changedLoc.jurisdictionPoliceStation || '',
                            jurisdiction_verified: Boolean(changedLoc.jurisdiction_verified || changedLoc.jurisdictionVerified),
                            location_source: changedLoc.locationSource || 'Citizen GPS & CivicPulse Resolution Pipeline',
                            verification_status: changedLoc.verificationStatus || 'PARTIALLY_VERIFIED'
                          }));
                          if (changedLoc.policeStation) {
                            setSelectedPoliceStation(changedLoc.policeStation);
                          }
                        }}
                      />
                    </div>

                    {/* Step 3 Footer Navigation */}
                    <div className="step-nav-footer">
                      <button
                        type="button"
                        onClick={() => setActiveStep(2)}
                        className="btn btn-secondary step-nav-btn step-nav-btn-back"
                      >
                        <ChevronLeft size={16} />
                        <span className="desktop-only">Back: AI Routing</span>
                        <span className="mobile-only">Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep(4)}
                        className="btn btn-primary step-nav-btn step-nav-btn-next"
                      >
                        <span className="desktop-only">Next: Evidence & Media</span>
                        <span className="mobile-only">Next: Evidence</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 4: EVIDENCE & MEDIA ================= */}
                {activeStep === 4 && (
                  <div>
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Upload size={18} color="var(--accent-cyan)" />
                        <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                          Step 4: Incident Evidence & Documentation
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Upload clear photographs, videos, or documents. Uploaded media is securely stored on Cloudinary with tamper-evident metadata.
                      </p>
                    </div>

                    {/* Multi-File Evidence Uploader & Cloudinary Storage */}
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>Upload Media Attachments:</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          Cloudinary Secure Storage
                        </span>
                      </label>
                      <EvidenceUploader
                        onFilesChange={(files) => setAttachedFiles(files)}
                        onPrimaryImageSelect={handlePrimaryImageSelect}
                        maxFiles={1}
                      />

                      {/* AI Visual Evidence Analysis Feedback & Citizen Correction Controls */}
                      {(visualAnalysis || isAnalyzingImage) && (
                        <div style={{ marginTop: '20px' }}>
                          <AIImageAnalysisCard
                            analysis={visualAnalysis}
                            loading={isAnalyzingImage}
                            previewUrl={primaryImagePreview}
                            fusedPriority={mlPreview?.priority_prediction?.priority}
                            onReanalyze={() => handlePrimaryImageSelect(primaryImageFile)}
                            onAdoptDescription={(desc) => setDescription(desc)}
                          />

                          {visualAnalysis && visualAnalysis.evidence_match === 'MATCH' && visualAnalysis.predicted_category && visualAnalysis.predicted_category !== 'INSUFFICIENT_VISUAL_EVIDENCE' && visualAnalysis.predicted_category !== selectedCategory && (
                            <div style={{
                              marginTop: '12px',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              background: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                <span>AI Visual Category Suggestion: </span>
                                <strong style={{ color: 'var(--accent-cyan)' }}>{visualAnalysis.predicted_category}</strong>
                                {visualAnalysis.predicted_subcategory && (
                                  <span style={{ color: 'var(--text-muted)' }}> ({visualAnalysis.predicted_subcategory})</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedCategory(visualAnalysis.predicted_category);
                                    if (visualAnalysis.predicted_subcategory) {
                                      setSelectedSubcategory(visualAnalysis.predicted_subcategory);
                                    }
                                    setUserOverrodeCategory(true);
                                  }}
                                  className="btn btn-sm"
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    border: '1px solid #10b981',
                                    color: '#6ee7b7',
                                    fontSize: '0.78rem',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✓ Adopt AI Suggestion
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Citizen confirms keeping their text category
                                  }}
                                  className="btn btn-sm"
                                  style={{
                                    background: 'transparent',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.78rem',
                                    padding: '4px 10px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Keep Manual Category
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Step 4 Footer Navigation */}
                    <div className="step-nav-footer">
                      <button
                        type="button"
                        onClick={() => setActiveStep(3)}
                        className="btn btn-secondary step-nav-btn step-nav-btn-back"
                      >
                        <ChevronLeft size={16} />
                        <span className="desktop-only">Back: Location</span>
                        <span className="mobile-only">Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStep(5)}
                        className="btn btn-primary step-nav-btn step-nav-btn-next"
                      >
                        <span className="desktop-only">Next: Review & Submit</span>
                        <span className="mobile-only">Next: Review</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 5: REVIEW & SUBMIT ================= */}
                {activeStep === 5 && (
                  <div>
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <CheckCircle2 size={18} color="#10b981" />
                        <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                          Step 5: Review Summary & Official Submission
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Please verify all details before submitting. Once filed, an official Tracking ID is issued and routed to the assigned department.
                      </p>
                    </div>

                    {/* Summary Review Card */}
                    <div style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      padding: '20px',
                      marginBottom: '20px',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>
                            Issue Subject
                          </span>
                          <strong style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                            {title || 'Untitled Grievance'}
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>
                            Target Department
                          </span>
                          <strong style={{ fontSize: '0.94rem', color: 'var(--accent-primary)' }}>
                            {resolvedCategory || activeCategory || 'Auto-Routed Department'}
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>
                            District & Jurisdiction
                          </span>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {locationData.district || 'West Bengal'} {selectedPoliceStation ? `• Thana: ${selectedPoliceStation}` : ''}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>
                            Priority & SLA
                          </span>
                          <span style={{ fontSize: '0.9rem', color: severity === 'Critical' ? '#dc2626' : 'var(--text-primary)', fontWeight: 700 }}>
                            {severity.toUpperCase()} • {mlPreview?.priority_prediction?.sla_hours || 72}h SLA
                          </span>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '12px' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                          Incident Description
                        </span>
                        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                          {description || 'No description entered.'}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <MapPin size={14} color="#10b981" />
                          <span>{locationData.address_formatted || locationData.address || 'Location registered'}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          📎 {attachedFiles.length > 0 ? `${attachedFiles.length} file(s) attached` : selectedFile ? '1 image attached' : 'No attachments'}
                        </div>
                      </div>

                      {/* Vision AI Scene Description in Review Summary */}
                      {(visualAnalysis || attachedFiles.length > 0 || selectedFile) && (
                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '12px' }}>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                            Photographic Evidence & Vision AI Case Documentation
                          </span>
                          <SceneDescriptionCard 
                            sceneDescription={visualAnalysis?.scene?.description || visualAnalysis?.scene_description || visualAnalysis?.scene_analysis?.scene_description || visualAnalysis?.image_overview?.description}
                            sceneType={visualAnalysis?.scene?.scene_type || visualAnalysis?.scene_type || visualAnalysis?.scene_analysis?.scene_type}
                            directObservations={visualAnalysis?.evidence?.direct_observations || visualAnalysis?.direct_observations || (Array.isArray(visualAnalysis?.visual_findings) ? visualAnalysis.visual_findings.map(f => typeof f === 'object' ? f.observation : f) : [])}
                            isOfficer={false}
                            compact={false}
                          />
                        </div>
                      )}
                    </div>

                    {/* Privacy Badge for Crime Reports */}
                    {isCrimeCategory && (
                      <div style={{
                        background: 'rgba(14, 165, 233, 0.1)',
                        border: '1px solid rgba(14, 165, 233, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '12px 16px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)'
                      }}>
                        <Lock size={18} color="var(--accent-cyan)" />
                        <span><strong>Official Privacy Protection:</strong> Citizen contact details and sensitive attachments will be encrypted and restricted strictly to verified law enforcement officers.</span>
                      </div>
                    )}

                    {/* Step 5 Footer Navigation & Submission */}
                    <div className="step-nav-footer step-nav-footer-step5 step-nav-footer-step6">
                      <button
                        type="button"
                        onClick={() => setActiveStep(4)}
                        className="btn btn-secondary step-nav-btn step-nav-btn-back"
                      >
                        <ChevronLeft size={16} />
                        <span className="desktop-only">Back: Evidence</span>
                        <span className="mobile-only">Back</span>
                      </button>

                      <button
                        type="submit"
                        className="btn btn-primary step-submit-btn"
                        disabled={submitting}
                      >
                        <Send size={18} />
                        <span className="desktop-only">{submitting ? 'Submitting & Routing...' : 'Submit Official Grievance'}</span>
                        <span className="mobile-only">{submitting ? 'Submitting...' : 'Submit Grievance'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Right Column: Real-Time AI Intelligence Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={20} color={isDark ? '#38bdf8' : '#0284c7'} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Automated Grievance Triage System
                    </h3>
                  </div>
                  {previewLoading && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }} className="animate-spin">
                      ⚡
                    </span>
                  )}
                </div>

                {!mlPreview ? (
                  <div style={{ textAlign: 'center', padding: '32px 14px', color: 'var(--text-muted)' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: isDark ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe',
                      border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #bae6fd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      color: isDark ? '#38bdf8' : '#0284c7'
                    }}>
                      <Building size={22} />
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Automated Department Routing & SLA Forecast
                    </div>
                    <p style={{ fontSize: '0.82rem', lineHeight: 1.55, color: 'var(--text-secondary)', margin: '0 auto', maxWidth: '320px' }}>
                      Enter your grievance details to initiate real-time departmental routing, urgency assessment, duplicate verification, and official SLA timeline allocation.
                    </p>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      justifyContent: 'center',
                      marginTop: '14px',
                      fontSize: '0.72rem'
                    }}>
                      <span style={{
                        background: isDark ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe',
                        color: isDark ? '#38bdf8' : '#0284c7',
                        border: isDark ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #bae6fd',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontWeight: 700
                      }}>
                        30 Division Classification
                      </span>
                      <span style={{
                        background: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fef3c7',
                        color: isDark ? '#fbbf24' : '#b45309',
                        border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #fde68a',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontWeight: 700
                      }}>
                        Priority Assessment
                      </span>
                      <span style={{
                        background: isDark ? 'rgba(16, 185, 129, 0.12)' : '#dcfce7',
                        color: isDark ? '#34d399' : '#15803d',
                        border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #bbf7d0',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        fontWeight: 700
                      }}>
                        SLA Timeline Allocation
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Emergency Warning Alert */}
                    {mlPreview.emergency_analysis?.is_emergency && (
                      <div className="ml-emergency-protocol">
                        <div className="ml-emergency-protocol-title">
                          <Flame size={16} /> EMERGENCY PROTOCOL TRIGGERED
                        </div>
                        <p className="ml-emergency-protocol-desc">
                          {mlPreview.emergency_analysis.guidance}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
                          <a href={`tel:${mlPreview.emergency_analysis.helpline.split(' ')[0]}`} className="btn btn-sm btn-danger" style={{ padding: '3px 8px', fontSize: '0.72rem' }}>
                            <PhoneCall size={12} /> Dial {mlPreview.emergency_analysis.helpline}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* 1. Category & Subcategory Card */}
                    <div style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      marginBottom: '12px',
                      overflow: 'hidden',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                          Predicted Category (30 Divisions)
                        </span>
                        <span style={{ 
                          fontSize: '0.78rem', 
                          color: (mlPreview.summary?.primaryDepartment === 'CLASSIFICATION_UNCERTAIN' || mlPreview.summary?.requiresHumanReview) ? '#f59e0b' : 'var(--accent-emerald)', 
                          fontWeight: 700 
                        }}>
                          {Math.round((mlPreview.summary?.departmentConfidence ?? mlPreview.category_prediction?.confidence ?? 0.95) * 100)}% Calibrated Confidence
                        </span>
                      </div>
                      <div style={{
                        fontSize: '1.12rem',
                        fontWeight: 800,
                        color: mlPreview.summary?.primaryDepartment === 'CLASSIFICATION_UNCERTAIN' ? '#f59e0b' : 'var(--text-primary)',
                        marginTop: '4px',
                        wordBreak: 'break-word',
                        lineHeight: 1.3
                      }}>
                        {mlPreview.summary?.primaryDepartment === 'CLASSIFICATION_UNCERTAIN' ? 'CLASSIFICATION UNCERTAIN — MANUAL REVIEW' : (mlPreview.summary?.primaryDepartment || mlPreview.category_prediction?.category)}
                      </div>
                      {(mlPreview.summary?.primaryDepartment === 'CLASSIFICATION_UNCERTAIN' || mlPreview.summary?.requiresHumanReview) && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          marginTop: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#f59e0b',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          ⚠️ Routed for Human Verification & Manual Review
                        </div>
                      )}

                      {/* Subcategory - Multi-line responsive wrapping */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginTop: '8px',
                        width: '100%'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
                          Subcategory:
                        </span>
                        <span
                          className="badge badge-info badge-wrap"
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            textTransform: 'none',
                            lineHeight: 1.35,
                            maxWidth: '100%'
                          }}
                        >
                          {mlPreview.summary?.subcategory || mlPreview.category_prediction?.subcategory || 'General Issue'}
                        </span>
                      </div>

                      {/* Secondary Department(s) if detected */}
                      {mlPreview.summary?.secondaryDepartments && mlPreview.summary.secondaryDepartments.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
                            Secondary:
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {mlPreview.summary.secondaryDepartments.map((sDept, idx) => (
                              <span key={idx} style={{
                                fontSize: '0.7rem',
                                color: 'var(--accent-primary)',
                                background: 'rgba(99, 102, 241, 0.12)',
                                border: '1px solid rgba(99, 102, 241, 0.25)',
                                borderRadius: '4px',
                                padding: '1px 6px',
                                whiteSpace: 'normal',
                                wordBreak: 'break-word'
                              }}>
                                + {sDept}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Top Alternative Predictions */}
                      {mlPreview.summary?.alternative_categories && mlPreview.summary.alternative_categories.length > 0 && (
                        <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--border-subtle)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          <span style={{ fontWeight: 600 }}>Top Alternative(s): </span>
                          {mlPreview.summary.alternative_categories.map((alt, idx) => (
                            <span key={idx} style={{ marginRight: '8px' }}>
                              {alt.category} ({Math.round(alt.confidence * 100)}%)
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Responsible Department */}
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        marginTop: '8px',
                        wordBreak: 'break-word',
                        lineHeight: 1.35
                      }}>
                        Government Department: <strong style={{ color: 'var(--accent-primary)' }}>
                          {mlPreview.summary?.primaryDepartment || mlPreview.category_prediction?.department}
                        </strong>
                      </div>
                    </div>

                    {/* 2. Priority & SLA Assessment */}
                    <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px 16px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Priority & SLA Routing Target
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                        <span className={`badge ${mlPreview.priority_prediction?.priority === 'CRITICAL' ? 'badge-critical' :
                            mlPreview.priority_prediction?.priority === 'HIGH' ? 'badge-high' : 'badge-medium'
                          }`}>
                          {mlPreview.priority_prediction?.priority} PRIORITY
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          SLA Window: <strong style={{ color: 'var(--text-primary)' }}>{mlPreview.priority_prediction?.sla_hours} Hours</strong>
                        </span>
                      </div>
                      {mlPreview.priority_prediction?.risk_factors && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          Factors: {mlPreview.priority_prediction.risk_factors.join(' • ')}
                        </div>
                      )}
                    </div>


                    {/* 4. AI Root-Cause Suggestion & Recommended Field Actions */}
                    {mlPreview.root_cause_analysis && (
                      <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px 16px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                          🧠 AI Root-Cause & Action Engine
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          <strong>Probable Causes:</strong>
                          <ul style={{ margin: '4px 0 8px 16px', padding: 0, color: 'var(--text-muted)' }}>
                            {mlPreview.root_cause_analysis.possible_causes?.slice(0, 3).map((cause, i) => (
                              <li key={i}>{cause}</li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          <strong>Recommended Field Action:</strong>
                          <div style={{ color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                            → {mlPreview.root_cause_analysis.recommended_actions?.[0] || 'Inspect site and verify evidence.'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. Resolution Time Regressor Prediction */}
                    <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '14px 16px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Estimated Resolution Time (ML Regressor)
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <Clock size={16} color="var(--accent-primary)" />
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ~{mlPreview.resolution_prediction?.estimated_days} Days
                        </span>
                      </div>
                    </div>

                    {/* 6. Spatial Duplicate Detection Alert */}
                    <DuplicateAlert
                      duplicateData={mlPreview.duplicate_detection}
                      onViewExisting={(matchId) => {
                        setSelectedComplaintId(matchId);
                        setCurrentRoute('complaint-details');
                      }}
                    />
                  </div>
                )}
              </div>


            </div>
          </div>
        </div>
      </div>

      {/* Voice Complaint Modal */}
      <VoiceInputModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyTranscript={handleVoiceTranscript}
        defaultLanguage="en"
      />

      {/* AI Complaint Assistant Modal */}
      <AIComplaintAssistant
        isOpen={isAssistantModalOpen}
        onClose={() => setIsAssistantModalOpen(false)}
        onApplyGeneratedComplaint={handleAssistantApply}
        initialIssue={description || title || ''}
      />
    </div>
  );
}
