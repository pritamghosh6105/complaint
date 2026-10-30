import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Building2, 
  Trees, 
  Sparkles, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  Compass,
  Layers,
  ChevronRight,
  RefreshCw,
  Info
} from 'lucide-react';
import SearchableSelect from '../common/SearchableSelect';
import LocationMapPicker from './LocationMapPicker';
import api from '../../services/api';

export default function LocationSelector({ 
  value = {}, 
  onChange,
  onGPSDetectionMessage = null 
}) {
  // Mode: 'Urban' | 'Rural' | 'Other'
  const [adminType, setAdminType] = useState(value.administrative_type || 'Urban');

  // Master Data Options from Backend
  const [districts, setDistricts] = useState([]);
  const [subdivisions, setSubdivisions] = useState([]);
  const [ulbs, setUlbs] = useState([]);
  const [wards, setWards] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [villages, setVillages] = useState([]);
  const [policeStations, setPoliceStations] = useState([]);

  // Selected Identifiers (String IDs)
  const [selectedDistrictId, setSelectedDistrictId] = useState(value.district_id ? String(value.district_id) : '');
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState(value.subdivision_id ? String(value.subdivision_id) : '');
  const [selectedULBId, setSelectedULBId] = useState(value.ulb_id ? String(value.ulb_id) : '');
  const [selectedWardId, setSelectedWardId] = useState(value.ward_id ? String(value.ward_id) : '');
  const [selectedWardName, setSelectedWardName] = useState(value.ward || '');
  const [selectedBlockId, setSelectedBlockId] = useState(value.block_id ? String(value.block_id) : '');
  const [selectedGPId, setSelectedGPId] = useState(value.gram_panchayat_id ? String(value.gram_panchayat_id) : '');
  const [selectedVillageId, setSelectedVillageId] = useState(value.village_id ? String(value.village_id) : '');
  const [selectedPSId, setSelectedPSId] = useState(value.police_station_id ? String(value.police_station_id) : '');
  
  // Text fields
  const [locality, setLocality] = useState(value.locality || '');
  const [street, setStreet] = useState(value.street || '');
  const [landmark, setLandmark] = useState(value.landmark || '');
  const [postalCode, setPostalCode] = useState(value.postal_code || '');

  // Fast Client-side In-Memory Cache (0ms re-selections)
  const clientCache = React.useRef(new Map());

  // Real-time PIN Code Validation & Post Office Picker state
  const [pincodeValidation, setPincodeValidation] = useState({
    loading: false,
    valid: null,
    warning: null,
    district: null,
    postOffices: []
  });

  // GPS Map state (Default center: Kolkata / West Bengal centroid 22.5726, 88.3639)
  const [lat, setLat] = useState(typeof value.latitude === 'number' ? value.latitude : 22.5726);
  const [lng, setLng] = useState(typeof value.longitude === 'number' ? value.longitude : 88.3639);
  const [userGpsLocation, setUserGpsLocation] = useState(null);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [gpsNotification, setGpsNotification] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState(null);

  // Helper to match entity by id or _id
  const findItem = (list, id) => {
    if (!id) return null;
    return list.find(item => String(item.id || item._id) === String(id)) || null;
  };

  // 1. Initial Load: Fetch All 23 West Bengal Districts (with cache)
  useEffect(() => {
    let isMounted = true;
    const fetchDistricts = async () => {
      if (clientCache.current.has('districts_wb')) {
        setDistricts(clientCache.current.get('districts_wb'));
        return;
      }
      try {
        const res = await api.get('/locations/districts');
        const list = res.data.districts || res.data || [];
        if (isMounted) {
          clientCache.current.set('districts_wb', list);
          setDistricts(list);
          if (!selectedDistrictId && list.length > 0) {
            const defaultDist = list.find(d => d.name === 'Kolkata') || list[0];
            setSelectedDistrictId(String(defaultDist.id || defaultDist._id));
          }
        }
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    };
    fetchDistricts();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Subdivisions and Police Stations when District changes (Client-side cached)
  useEffect(() => {
    if (!selectedDistrictId) {
      setSubdivisions([]);
      setPoliceStations([]);
      return;
    }
    const cacheKeySub = `sub_${selectedDistrictId}`;
    const cacheKeyPs = `ps_${selectedDistrictId}`;

    if (clientCache.current.has(cacheKeySub) && clientCache.current.has(cacheKeyPs)) {
      setSubdivisions(clientCache.current.get(cacheKeySub));
      setPoliceStations(clientCache.current.get(cacheKeyPs));
      return;
    }

    let isMounted = true;
    const fetchDistrictChildren = async () => {
      try {
        const [subRes, psRes] = await Promise.all([
          api.get(`/locations/subdivisions?districtId=${selectedDistrictId}`),
          api.get(`/locations/police-stations?districtId=${selectedDistrictId}`)
        ]);
        if (isMounted) {
          const subList = subRes.data.subdivisions || [];
          const psList = psRes.data.policeStations || psRes.data.police_stations || [];
          clientCache.current.set(cacheKeySub, subList);
          clientCache.current.set(cacheKeyPs, psList);
          setSubdivisions(subList);
          setPoliceStations(psList);
        }
      } catch (err) {
        console.error('Failed to load subdivisions or police stations:', err);
      }
    };
    fetchDistrictChildren();
    return () => { isMounted = false; };
  }, [selectedDistrictId]);

  // 3. Smart Conditional Fetching: ULBs for Urban, Blocks for Rural (Client-side cached)
  useEffect(() => {
    if (!selectedDistrictId) {
      setUlbs([]);
      setBlocks([]);
      return;
    }
    const subQuery = selectedSubdivisionId ? `&subdivisionId=${selectedSubdivisionId}` : '';
    let isMounted = true;

    if (adminType === 'Urban') {
      const cacheKeyUlb = `ulb_${selectedDistrictId}_${selectedSubdivisionId || 'all'}`;
      if (clientCache.current.has(cacheKeyUlb)) {
        setUlbs(clientCache.current.get(cacheKeyUlb));
        return;
      }
      api.get(`/locations/ulbs?districtId=${selectedDistrictId}${subQuery}`)
        .then(res => {
          if (isMounted) {
            const list = res.data.ulbs || [];
            clientCache.current.set(cacheKeyUlb, list);
            setUlbs(list);
          }
        })
        .catch(err => console.error('Failed to load ULBs:', err));
    } else if (adminType === 'Rural') {
      const cacheKeyBlk = `blk_${selectedDistrictId}_${selectedSubdivisionId || 'all'}`;
      if (clientCache.current.has(cacheKeyBlk)) {
        setBlocks(clientCache.current.get(cacheKeyBlk));
        return;
      }
      api.get(`/locations/blocks?districtId=${selectedDistrictId}${subQuery}`)
        .then(res => {
          if (isMounted) {
            const list = res.data.blocks || [];
            clientCache.current.set(cacheKeyBlk, list);
            setBlocks(list);
          }
        })
        .catch(err => console.error('Failed to load Blocks:', err));
    }
    return () => { isMounted = false; };
  }, [selectedDistrictId, selectedSubdivisionId, adminType]);

  // 4. Fetch Wards when ULB changes (Urban only, Client-side cached)
  useEffect(() => {
    if (!selectedULBId || adminType !== 'Urban') {
      setWards([]);
      return;
    }
    const cacheKeyWard = `ward_${selectedULBId}`;
    if (clientCache.current.has(cacheKeyWard)) {
      setWards(clientCache.current.get(cacheKeyWard));
      return;
    }
    let isMounted = true;
    api.get(`/locations/wards?ulbId=${selectedULBId}`)
      .then(res => {
        if (isMounted) {
          const list = res.data.wards || [];
          clientCache.current.set(cacheKeyWard, list);
          setWards(list);
        }
      })
      .catch(err => console.error('Failed to load wards:', err));
    return () => { isMounted = false; };
  }, [selectedULBId, adminType]);

  // 5. Fetch Gram Panchayats when Block changes (Rural only, Client-side cached)
  useEffect(() => {
    if (!selectedBlockId || adminType !== 'Rural') {
      setGramPanchayats([]);
      return;
    }
    const cacheKeyGp = `gp_${selectedBlockId}`;
    if (clientCache.current.has(cacheKeyGp)) {
      setGramPanchayats(clientCache.current.get(cacheKeyGp));
      return;
    }
    let isMounted = true;
    api.get(`/locations/gram-panchayats?blockId=${selectedBlockId}`)
      .then(res => {
        if (isMounted) {
          const list = res.data.gramPanchayats || res.data.gram_panchayats || [];
          clientCache.current.set(cacheKeyGp, list);
          setGramPanchayats(list);
        }
      })
      .catch(err => console.error('Failed to load GPs:', err));
    return () => { isMounted = false; };
  }, [selectedBlockId, adminType]);

  // 6. Fetch Villages when Gram Panchayat changes (Rural only, Client-side cached)
  useEffect(() => {
    if (!selectedGPId || adminType !== 'Rural') {
      setVillages([]);
      return;
    }
    const cacheKeyVil = `vil_${selectedGPId}`;
    if (clientCache.current.has(cacheKeyVil)) {
      setVillages(clientCache.current.get(cacheKeyVil));
      return;
    }
    let isMounted = true;
    api.get(`/locations/villages?gramPanchayatId=${selectedGPId}&limit=100`)
      .then(res => {
        if (isMounted) {
          const list = res.data.villages || [];
          clientCache.current.set(cacheKeyVil, list);
          setVillages(list);
        }
      })
      .catch(err => console.error('Failed to load villages:', err));
    return () => { isMounted = false; };
  }, [selectedGPId, adminType]);

  // Emit updated Location state to parent component whenever changes occur
  useEffect(() => {
    const distObj = findItem(districts, selectedDistrictId);
    const subObj = findItem(subdivisions, selectedSubdivisionId);
    const ulbObj = findItem(ulbs, selectedULBId);
    const wardObj = findItem(wards, selectedWardId);
    const blkObj = findItem(blocks, selectedBlockId);
    const gpObj = findItem(gramPanchayats, selectedGPId);
    const vilObj = findItem(villages, selectedVillageId);
    const psObj = findItem(policeStations, selectedPSId);

    const finalWard = adminType === 'Urban' 
      ? (wardObj ? wardObj.name : selectedWardName)
      : (gpObj ? gpObj.name : '');

    const locationPayload = {
      state: 'West Bengal',
      administrative_type: adminType,
      district_id: selectedDistrictId || null,
      district: distObj ? distObj.name : 'West Bengal',
      subdivision_id: selectedSubdivisionId || null,
      subdivision: subObj ? subObj.name : '',
      
      // Urban Specific
      ulb_id: adminType === 'Urban' && selectedULBId ? selectedULBId : null,
      ulb_type: adminType === 'Urban' && ulbObj ? ulbObj.type : null,
      municipality: adminType === 'Urban' && ulbObj ? ulbObj.name : '',
      ward_id: adminType === 'Urban' && selectedWardId ? selectedWardId : null,
      ward: adminType === 'Urban' ? finalWard : '',
      
      // Rural Specific
      block_id: adminType === 'Rural' && selectedBlockId ? selectedBlockId : null,
      block: adminType === 'Rural' && blkObj ? blkObj.name : '',
      gram_panchayat_id: adminType === 'Rural' && selectedGPId ? selectedGPId : null,
      gram_panchayat: adminType === 'Rural' && gpObj ? gpObj.name : '',
      village_id: adminType === 'Rural' && selectedVillageId ? selectedVillageId : null,
      village: adminType === 'Rural' && vilObj ? vilObj.name : '',
      mouza: adminType === 'Rural' && vilObj ? (vilObj.mouza || vilObj.name) : '',

      // Police & Postal
      police_station_id: selectedPSId || null,
      police_station: psObj ? psObj.name : '',
      locality: locality.trim(),
      street: street.trim(),
      landmark: landmark.trim(),
      postal_code: postalCode.trim(),
      latitude: lat,
      longitude: lng,
      address_formatted: [
        street,
        locality,
        adminType === 'Urban' ? (wardObj?.name || selectedWardName) : (vilObj?.name || gpObj?.name),
        adminType === 'Urban' ? ulbObj?.name : blkObj?.name,
        psObj ? `${psObj.name}` : null,
        distObj?.name,
        'West Bengal',
        postalCode
      ].filter(Boolean).join(', ')
    };

    if (onChange) {
      onChange(locationPayload);
    }
  }, [
    adminType,
    selectedDistrictId,
    selectedSubdivisionId,
    selectedULBId,
    selectedWardId,
    selectedWardName,
    selectedBlockId,
    selectedGPId,
    selectedVillageId,
    selectedPSId,
    locality,
    street,
    landmark,
    postalCode,
    lat,
    lng,
    districts,
    subdivisions,
    ulbs,
    wards,
    blocks,
    gramPanchayats,
    villages,
    policeStations
  ]);

  // Handle District Change -> reset dependent child selections
  const handleDistrictChange = (distId) => {
    setSelectedDistrictId(distId);
    setSelectedSubdivisionId('');
    setSelectedULBId('');
    setSelectedWardId('');
    setSelectedWardName('');
    setSelectedBlockId('');
    setSelectedGPId('');
    setSelectedVillageId('');
    setSelectedPSId('');

    // Pan map to district centroid if available
    const dist = findItem(districts, distId);
    if (dist && dist.latitude && dist.longitude) {
      setLat(dist.latitude);
      setLng(dist.longitude);
    }
  };

  // Handle Subdivision Change
  const handleSubdivisionChange = (subId) => {
    setSelectedSubdivisionId(subId);
    setSelectedULBId('');
    setSelectedWardId('');
    setSelectedWardName('');
    setSelectedBlockId('');
    setSelectedGPId('');
    setSelectedVillageId('');
  };

  // Handle PIN Code Quick Lookup & Real-Time Validation
  const handlePincodeChange = async (pin) => {
    setPostalCode(pin);
    const cleanPin = pin.trim();

    if (cleanPin.length !== 6) {
      setPincodeValidation({ loading: false, valid: null, warning: null, district: null, postOffices: [] });
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setPincodeValidation({
        loading: false,
        valid: false,
        warning: 'Invalid PIN format. Must be a 6-digit number.',
        district: null,
        postOffices: []
      });
      return;
    }

    try {
      setPincodeValidation(prev => ({ ...prev, loading: true }));
      const selectedDist = findItem(districts, selectedDistrictId);
      const distName = selectedDist?.name || '';
      
      const res = await api.get(`/locations/validate-pincode?pincode=${cleanPin}&district=${encodeURIComponent(distName)}`);
      if (res.data && res.data.success) {
        const d = res.data;
        setPincodeValidation({
          loading: false,
          valid: d.valid,
          warning: d.warning || null,
          district: d.district || null,
          postOffices: d.postOffices || []
        });

        // If district not selected, auto-select from PIN
        if (d.district && !selectedDistrictId) {
          const matchDist = districts.find(item => item.name.toLowerCase() === d.district.toLowerCase());
          if (matchDist) setSelectedDistrictId(String(matchDist.id || matchDist._id));
        }

        // Set default locality if empty
        if (d.postOffices && d.postOffices.length > 0 && !locality) {
          setLocality(d.postOffices[0]);
        }
      }
    } catch (err) {
      setPincodeValidation({ loading: false, valid: false, warning: 'Failed to validate PIN code.', district: null, postOffices: [] });
    }
  };

  // Handle GPS coordinate resolution and auto-filling
  const handleResolveCoordinates = useCallback(async (targetLat, targetLng) => {
    try {
      const res = await api.get(`/locations/resolve?lat=${targetLat}&lng=${targetLng}`);
      if (res.data && res.data.success && res.data.resolution) {
        const r = res.data.resolution;
        setResolutionDetails(r);

        // Auto-select administrative hierarchy if resolved
        if (r.district && r.district.id) {
          setSelectedDistrictId(String(r.district.id));
        } else if (r.district && r.district.name) {
          const d = districts.find(item => item.name.toLowerCase() === r.district.name.toLowerCase());
          if (d) setSelectedDistrictId(String(d.id || d._id));
        }

        if (r.subdivision && r.subdivision.id) {
          setSelectedSubdivisionId(String(r.subdivision.id));
        }

        // Set Urban vs Rural based on resolution
        if (r.urbanOrRural === 'Urban') {
          setAdminType('Urban');
          if (r.municipality?.id || r.corporation?.id) {
            const ulbId = String(r.municipality?.id || r.corporation?.id);
            setSelectedULBId(ulbId);
          }
          if (r.ward?.id) {
            setSelectedWardId(String(r.ward.id));
          }
        } else if (r.urbanOrRural === 'Rural') {
          setAdminType('Rural');
          if (r.block?.id) {
            setSelectedBlockId(String(r.block.id));
          }
          if (r.gramPanchayat?.id) {
            setSelectedGPId(String(r.gramPanchayat.id));
          }
        }

        // Nearest Police Station
        if (r.policeStation?.id) {
          setSelectedPSId(String(r.policeStation.id));
        }

        // Postal, Street & Locality
        if (r.pincode && !postalCode) setPostalCode(r.pincode);
        if (r.locality && !locality) setLocality(r.locality);
        if (r.street && !street) setStreet(r.street);
        if (r.landmark && !landmark) setLandmark(r.landmark);

        const summary = `${r.district ? r.district.name : 'West Bengal'}${r.policeStation ? ` • PS: ${r.policeStation.name}` : ''}`;
        const msg = `📍 Detected: ${summary} (${r.accuracy})`;
        setGpsNotification(msg);
        if (onGPSDetectionMessage) onGPSDetectionMessage(msg);
      }
    } catch (err) {
      console.warn('Coordinates resolution notice:', err);
      setGpsNotification('Location coordinates recorded. Please verify administrative area.');
    }
  }, [districts, postalCode, locality, street, landmark, onGPSDetectionMessage]);

  // Handle "Use My GPS"
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLoadingGPS(false);
        const newLat = parseFloat(pos.coords.latitude.toFixed(6));
        const newLng = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = pos.coords.accuracy || 20;
        setUserGpsLocation({ lat: newLat, lng: newLng, accuracy });
        setLat(newLat);
        setLng(newLng);
        await handleResolveCoordinates(newLat, newLng);
      },
      (err) => {
        setLoadingGPS(false);
        alert('GPS permission denied or unavailable. You can click on the map to pinpoint your location.');
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  // Map Click / Pin Drag handler
  const handleMapPinSelect = async (clickedLat, clickedLng) => {
    setLat(clickedLat);
    setLng(clickedLng);
    await handleResolveCoordinates(clickedLat, clickedLng);
  };

  const currentDistrict = findItem(districts, selectedDistrictId);
  const currentSubdivision = findItem(subdivisions, selectedSubdivisionId);
  const currentULB = findItem(ulbs, selectedULBId);
  const currentBlock = findItem(blocks, selectedBlockId);
  const currentGP = findItem(gramPanchayats, selectedGPId);
  const currentPS = findItem(policeStations, selectedPSId);

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '22px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)'
    }}>
      {/* Header Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '12px',
        marginBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        paddingBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(37, 99, 235, 0.35))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)'
          }}>
            <MapPin size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              West Bengal Jurisdiction & Location
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '2px 10px',
                borderRadius: '14px',
                letterSpacing: '0.02em'
              }}>
                🏛️ State: West Bengal
              </span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Official 23-district administrative system with verified GIS boundary routing.
            </span>
          </div>
        </div>

        {/* GPS Quick Action */}
        <button
          type="button"
          onClick={handleUseGPS}
          disabled={loadingGPS}
          className="btn btn-secondary btn-sm"
          style={{
            fontSize: '0.82rem',
            padding: '7px 16px',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(56, 189, 248, 0.12)',
            borderColor: 'rgba(56, 189, 248, 0.35)',
            color: '#38bdf8',
            cursor: loadingGPS ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Navigation size={15} className={loadingGPS ? 'animate-spin' : ''} />
          {loadingGPS ? 'Detecting via GPS...' : '📍 Use My Current Location'}
        </button>
      </div>

      {/* Detected Location Card (if GPS / Map clicked) */}
      {resolutionDetails && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#38bdf8" />
              <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>
                GIS Auto-Detected Jurisdiction
              </strong>
            </div>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              background: resolutionDetails.accuracy.includes('HIGH') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)',
              color: resolutionDetails.accuracy.includes('HIGH') ? '#34d399' : '#facc15',
              border: resolutionDetails.accuracy.includes('HIGH') ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(234, 179, 8, 0.4)'
            }}>
              {resolutionDetails.accuracy}
            </span>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
            {resolutionDetails.formattedAddress && (
              <div><strong>Address:</strong> {resolutionDetails.formattedAddress}</div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
              {resolutionDetails.district && (
                <span>District: <strong>{resolutionDetails.district.name}</strong></span>
              )}
              {resolutionDetails.policeStation && (
                <span>Police: <strong>{resolutionDetails.policeStation.name}</strong> ({resolutionDetails.policeStation.distanceMeters}m)</span>
              )}
              {resolutionDetails.pincode && (
                <span>PIN: <strong>{resolutionDetails.pincode}</strong></span>
              )}
            </div>
          </div>

          <div style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '6px',
            marginTop: '2px'
          }}>
            <Info size={13} color="#38bdf8" />
            <span>Please verify that the selected administrative dropdowns match your complaint location.</span>
          </div>
        </div>
      )}

      {/* GPS Notification Banner */}
      {gpsNotification && !resolutionDetails && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '10px',
          marginBottom: '16px',
          fontSize: '0.84rem',
          color: '#e0f2fe'
        }}>
          <Sparkles size={15} color="#38bdf8" />
          <span style={{ flex: 1 }}>{gpsNotification}</span>
          <button 
            type="button" 
            onClick={() => setGpsNotification('')} 
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Administrative Area Mode Tabs */}
      <div style={{ marginBottom: '16px' }}>
        <label className="form-label" style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '8px' }}>
          Select Administrative Hierarchy:
        </label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setAdminType('Urban')}
            className={`btn btn-sm ${adminType === 'Urban' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              fontSize: '0.84rem', 
              padding: '8px 18px', 
              borderRadius: '10px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              fontWeight: 600
            }}
          >
            <Building2 size={16} /> 🏢 Urban / Municipality / Ward
          </button>
          <button
            type="button"
            onClick={() => setAdminType('Rural')}
            className={`btn btn-sm ${adminType === 'Rural' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              fontSize: '0.84rem', 
              padding: '8px 18px', 
              borderRadius: '10px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              fontWeight: 600
            }}
          >
            <Trees size={16} /> 🌾 Rural / Block / Panchayat
          </button>
          <button
            type="button"
            onClick={() => setAdminType('Other')}
            className={`btn btn-sm ${adminType === 'Other' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ 
              fontSize: '0.84rem', 
              padding: '8px 18px', 
              borderRadius: '10px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px',
              fontWeight: 600
            }}
          >
            <Compass size={16} /> ✍️ Custom / Unclassified
          </button>
        </div>
      </div>

      {/* Cascading Form Fields Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '14px',
        marginBottom: '16px'
      }}>
        {/* District (All 23 West Bengal Districts) */}
        <div>
          <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            District (West Bengal) *
          </label>
          <SearchableSelect
            options={districts}
            value={selectedDistrictId}
            onChange={handleDistrictChange}
            placeholder="Search 23 districts..."
            searchPlaceholder="Type district name..."
            labelKey="name"
            valueKey="id"
            secondaryKey="lgdCode"
            storageKey="wb_districts"
          />
        </div>

        {/* Sub-Division */}
        <div>
          <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Sub-Division
          </label>
          <SearchableSelect
            options={subdivisions}
            value={selectedSubdivisionId}
            onChange={handleSubdivisionChange}
            placeholder={subdivisions.length > 0 ? "Search sub-division..." : "Select district first"}
            disabled={subdivisions.length === 0}
            labelKey="name"
            valueKey="id"
            storageKey="wb_subdivisions"
          />
        </div>

        {/* URBAN: Municipality / Corporation / ULB */}
        {adminType === 'Urban' && (
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Municipality / Corporation *
            </label>
            <SearchableSelect
              options={ulbs}
              value={selectedULBId}
              onChange={(ulbId) => {
                setSelectedULBId(ulbId);
                setSelectedWardId('');
                setSelectedWardName('');
              }}
              placeholder={ulbs.length > 0 ? "Search municipality/corp..." : "No ULB in selected area"}
              disabled={ulbs.length === 0}
              labelKey="name"
              valueKey="id"
              secondaryKey="type"
              storageKey="wb_ulbs"
            />
          </div>
        )}

        {/* URBAN: Ward */}
        {adminType === 'Urban' && (
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Municipal Ward *
            </label>
            <SearchableSelect
              options={wards}
              value={selectedWardId}
              onChange={(wId, item) => {
                setSelectedWardId(wId);
                if (item) setSelectedWardName(item.name);
              }}
              placeholder={wards.length > 0 ? "Search ward..." : (selectedULBId ? "Select ward or type below" : "Select ULB first")}
              disabled={wards.length === 0}
              labelKey="name"
              valueKey="id"
              storageKey="wb_wards"
            />
          </div>
        )}

        {/* RURAL: Community Development Block */}
        {adminType === 'Rural' && (
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              CD Block (Rural) *
            </label>
            <SearchableSelect
              options={blocks}
              value={selectedBlockId}
              onChange={(blkId) => {
                setSelectedBlockId(blkId);
                setSelectedGPId('');
                setSelectedVillageId('');
              }}
              placeholder={blocks.length > 0 ? "Search CD block..." : "No blocks in area"}
              disabled={blocks.length === 0}
              labelKey="name"
              valueKey="id"
              storageKey="wb_blocks"
            />
          </div>
        )}

        {/* RURAL: Gram Panchayat */}
        {adminType === 'Rural' && (
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Gram Panchayat *
            </label>
            <SearchableSelect
              options={gramPanchayats}
              value={selectedGPId}
              onChange={(gpId) => {
                setSelectedGPId(gpId);
                setSelectedVillageId('');
              }}
              placeholder={gramPanchayats.length > 0 ? "Search GP..." : "Select block first"}
              disabled={gramPanchayats.length === 0}
              labelKey="name"
              valueKey="id"
              storageKey="wb_gps"
            />
          </div>
        )}

        {/* RURAL: Village / Mouza */}
        {adminType === 'Rural' && (
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Village / Mouza
            </label>
            <SearchableSelect
              options={villages}
              value={selectedVillageId}
              onChange={(vId, item) => {
                setSelectedVillageId(vId);
                if (item && !locality) setLocality(item.name);
              }}
              placeholder={villages.length > 0 ? "Search village..." : "Type custom locality below"}
              disabled={villages.length === 0}
              labelKey="name"
              valueKey="id"
              storageKey="wb_villages"
            />
          </div>
        )}

        {/* Police Station Jurisdiction */}
        <div>
          <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Shield size={13} color="#38bdf8" /> Police Station Jurisdiction
          </label>
          <SearchableSelect
            options={policeStations}
            value={selectedPSId}
            onChange={(psId) => setSelectedPSId(psId)}
            placeholder="Search police station..."
            disabled={policeStations.length === 0}
            labelKey="name"
            valueKey="id"
            secondaryKey="policeDistrict"
            storageKey="wb_police_stations"
          />
        </div>

        {/* Postal PIN Code */}
        <div>
          <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Hash size={13} /> Postal PIN Code (6 Digits)
          </label>
          <input
            type="text"
            className="form-input"
            maxLength={6}
            value={postalCode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            placeholder="e.g. 700073, 700124..."
            style={{ fontSize: '0.88rem', padding: '8px 12px' }}
          />

          {pincodeValidation.loading && (
            <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '4px' }}>
              Validating PIN code...
            </div>
          )}

          {pincodeValidation.warning && (
            <div style={{
              fontSize: '0.75rem',
              color: '#f59e0b',
              marginTop: '5px',
              padding: '6px 10px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={14} />
              <span>{pincodeValidation.warning}</span>
            </div>
          )}

          {pincodeValidation.valid && !pincodeValidation.warning && (
            <div style={{
              fontSize: '0.74rem',
              color: '#10b981',
              marginTop: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <CheckCircle2 size={13} />
              <span>Verified PIN: <strong>{pincodeValidation.district}</strong></span>
            </div>
          )}

          {pincodeValidation.postOffices && pincodeValidation.postOffices.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                Select Post Office / Locality:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {pincodeValidation.postOffices.slice(0, 8).map((po, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setLocality(po)}
                    style={{
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: locality === po ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: locality === po ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: locality === po ? '#38bdf8' : '#cbd5e1',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {po}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Street / Landmark / Locality Detail Inputs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '14px',
        marginBottom: '16px' 
      }}>
        <div>
          <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Street / Road / Lane
          </label>
          <input
            type="text"
            className="form-input"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="e.g. Park Street, Jessore Road, GP Main Road..."
            style={{ fontSize: '0.88rem', padding: '8px 12px' }}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Locality / Colony / Para / Mohalla
          </label>
          <input
            type="text"
            className="form-input"
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            placeholder="e.g. Bowbazar, Salt Lake Sector V, Adhata..."
            style={{ fontSize: '0.88rem', padding: '8px 12px' }}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            Landmark
          </label>
          <input
            type="text"
            className="form-input"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="e.g. Near BDO Office, Opposite Hospital..."
            style={{ fontSize: '0.88rem', padding: '8px 12px' }}
          />
        </div>
      </div>

      {/* Interactive Map Pinning */}
      <div style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} color="#38bdf8" /> OpenStreetMap GIS Incident Location:
          </span>
          <span style={{ fontSize: '0.76rem', color: '#38bdf8' }}>
            *Click on map or drag pin to update incident coordinates
          </span>
        </div>

        {/* Reusable Leaflet Map Picker */}
        <LocationMapPicker
          lat={lat}
          lng={lng}
          userGpsLocation={userGpsLocation}
          onLocationChange={handleMapPinSelect}
          height="230px"
          zoom={13}
        />

        {/* Live Coordinate Badges */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '10px',
          fontSize: '0.78rem',
          color: '#94a3b8'
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <span>Lat: <strong style={{ color: 'var(--text-primary)' }}>{typeof lat === 'number' ? lat.toFixed(5) : '22.5726'}</strong></span>
            <span>Lng: <strong style={{ color: 'var(--text-primary)' }}>{typeof lng === 'number' ? lng.toFixed(5) : '88.3639'}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              padding: '3px 10px',
              borderRadius: '8px',
              fontWeight: 600
            }}>
              District: {currentDistrict ? currentDistrict.name : 'West Bengal'}
            </span>
            {currentSubdivision && (
              <span style={{
                background: 'rgba(147, 51, 234, 0.15)',
                color: '#c084fc',
                padding: '3px 10px',
                borderRadius: '8px',
                fontWeight: 600
              }}>
                Subdiv: {currentSubdivision.name}
              </span>
            )}
            {(currentULB || currentBlock) && (
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                padding: '3px 10px',
                borderRadius: '8px',
                fontWeight: 600
              }}>
                {adminType === 'Urban' ? `ULB: ${currentULB?.name || ''}` : `Block: ${currentBlock?.name || ''}`}
              </span>
            )}
            {currentPS && (
              <span style={{
                background: 'rgba(234, 179, 8, 0.15)',
                color: '#facc15',
                padding: '3px 10px',
                borderRadius: '8px',
                fontWeight: 600
              }}>
                PS: {currentPS.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
