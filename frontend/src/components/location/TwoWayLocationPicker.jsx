import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapContainer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw, 
  Edit3, 
  Shield, 
  PhoneCall,
  Compass, 
  X,
  Maximize2,
  Minimize2,
  Check,
  Building2,
  Mail,
  Plus,
  Minus,
  Crosshair,
  ChevronDown,
  Smartphone
} from 'lucide-react';
import api from '../../services/api';
import { FastTileLayer, MapAutoInvalidate, MapLayerSwitcher, getSavedProviderId } from '../maps/MapConfig';
import UserGpsMarker from '../maps/UserGpsMarker';

// High-visibility Glowing Incident Marker
const incidentPinIcon = L.divIcon({
  html: `
    <div style="
      position: relative;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        transform: rotate(-45deg);
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 16px rgba(239, 68, 68, 0.8), 0 4px 12px rgba(0,0,0,0.5);
      "></div>
      <div style="
        position: absolute;
        width: 10px;
        height: 10px;
        background: #ffffff;
        border-radius: 50%;
        top: 9px;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      "></div>
      <div style="
        position: absolute;
        bottom: -4px;
        width: 16px;
        height: 5px;
        background: rgba(0, 0, 0, 0.35);
        border-radius: 50%;
        filter: blur(1.5px);
      "></div>
    </div>
  `,
  className: 'two-way-incident-pin',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

// Map Click Listener
function MapClickHandler({ onLocationSelect, disabled }) {
  useMapEvents({
    click(e) {
      if (disabled) return;
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));
      onLocationSelect(lat, lng);
    }
  });
  return null;
}

// Controller to smoothly pan map when coordinates change externally
function MapCenterController({ lat, lng, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], zoom || map.getZoom(), { duration: 1.0 });
    }
  }, [lat, lng, zoom, map]);
  return null;
}

// Custom High-Contrast Floating Map Controls (+ / - / Recenter)
function CustomMapControls({ lat, lng, gpsDotLocation }) {
  const map = useMap();

  return (
    <div 
      className="custom-map-controls-group"
      style={{
        position: 'absolute',
        top: '12px',
        left: '12px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        pointerEvents: 'auto'
      }}
      aria-label="Map Navigation Controls"
    >
      {/* Zoom In (+ Button) */}
      <button
        type="button"
        className="custom-map-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.zoomIn();
        }}
        title="Zoom In (+)"
        aria-label="Zoom in"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(12px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
          e.currentTarget.style.color = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>

      {/* Zoom Out (- Button) */}
      <button
        type="button"
        className="custom-map-btn"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          map.zoomOut();
        }}
        title="Zoom Out (-)"
        aria-label="Zoom out"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'var(--bg-surface)',
          border: '1.5px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'blur(12px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)';
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
          e.currentTarget.style.color = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
      >
        <Minus size={20} strokeWidth={2.5} />
      </button>

      {/* Recenter on Exact GPS Blue Dot */}
      {gpsDotLocation && (
        <button
          type="button"
          className="custom-map-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            map.flyTo([gpsDotLocation.lat, gpsDotLocation.lng], 16, { duration: 0.8 });
          }}
          title="Center on My Exact GPS Location (Blue Dot)"
          aria-label="Center on GPS blue dot"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(37, 99, 235, 0.15)',
            border: '1.5px solid #2563eb',
            color: '#38bdf8',
            boxShadow: '0 0 12px rgba(37, 99, 235, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(12px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
            e.currentTarget.style.boxShadow = '0 0 16px rgba(37, 99, 235, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(37, 99, 235, 0.4)';
          }}
        >
          <Navigation size={18} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}

export default function TwoWayLocationPicker({
  initialLat = 22.7230,
  initialLng = 88.4800,
  initialAddress = '',
  initialDistrict = '',
  onLocationConfirm,
  onLocationChange,
  isConfirmed = false,
  isPoliceOrCyberCrime = false,
  selectedPoliceStationProp = '',
  onPoliceStationSelect
}) {
  const [lat, setLat] = useState(initialLat || 22.7230);
  const [lng, setLng] = useState(initialLng || 88.4800);
  const [zoom, setZoom] = useState(14);
  const [gpsDotLocation, setGpsDotLocation] = useState(null);

  // Address Inputs & Geocoding State
  const [searchInput, setSearchInput] = useState(initialAddress || '');
  const [detectedAddress, setDetectedAddress] = useState(initialAddress || '');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [customAddressInput, setCustomAddressInput] = useState(initialAddress || '');
  const [showGpsNotice, setShowGpsNotice] = useState(false);

  // Administrative Hierarchy State
  const [district, setDistrict] = useState(initialDistrict || 'North 24 Parganas');
  const [subdivision, setSubdivision] = useState('');
  const [administrativeUnit, setAdministrativeUnit] = useState('Urban');
  const [ulb, setUlb] = useState('');
  const [ward, setWard] = useState('');
  const [block, setBlock] = useState('');
  const [gramPanchayat, setGramPanchayat] = useState('');
  const [village, setVillage] = useState('');

  // Postal & PIN State
  const [pincode, setPincode] = useState('');
  const [postOffice, setPostOffice] = useState('');

  // Police Station State (Separation of Nearest from Jurisdictional)
  const [nearestStation, setNearestStation] = useState(null);
  const [nearestStationDistance, setNearestStationDistance] = useState(null);
  const [jurisdictionStation, setJurisdictionStation] = useState(null);
  const [policeJurisdictionVerified, setPoliceJurisdictionVerified] = useState(false);
  const [selectedPoliceStation, setSelectedPoliceStation] = useState(selectedPoliceStationProp || '');
  const [policeStationDetails, setPoliceStationDetails] = useState(null);
  const [districtPoliceStations, setDistrictPoliceStations] = useState([]);
  const [showManualStationSelector, setShowManualStationSelector] = useState(true);

  // Verification & Sources State
  const [verification, setVerification] = useState({
    districtVerified: true,
    subdivisionVerified: false,
    ulbVerified: false,
    wardVerified: false,
    blockVerified: false,
    gramPanchayatVerified: false,
    villageVerified: false,
    pincodeVerified: false,
    policeJurisdictionVerified: false
  });

  const [sources, setSources] = useState({
    districtSource: 'REVERSE_GEOCODER',
    subdivisionSource: 'NOT_VERIFIED',
    ulbSource: 'NOT_VERIFIED',
    wardSource: 'NOT_VERIFIED',
    blockSource: 'NOT_VERIFIED',
    gramPanchayatSource: 'NOT_VERIFIED',
    villageSource: 'NOT_VERIFIED',
    pincodeSource: 'POSTCODE_DATABASE',
    addressSource: 'REVERSE_GEOCODER',
    nearestPoliceSource: 'GPS_DISTANCE',
    policeJurisdictionSource: 'NOT_VERIFIED'
  });

  const [confidence, setConfidence] = useState('PARTIALLY_VERIFIED');
  const [resolutionStatus, setResolutionStatus] = useState('PARTIALLY_VERIFIED');

  // Operational State
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [loadingReverse, setLoadingReverse] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [confirmed, setConfirmed] = useState(true); // Auto-confirm map locations by default
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(getSavedProviderId());

  const markerRef = useRef(null);

  // -------------------------------------------------------------
  // Emit updated location payload to parent (NewComplaint.jsx)
  // -------------------------------------------------------------
  const emitLocationPayload = useCallback((overrides = {}) => {
    const activeLat = overrides.latitude !== undefined ? overrides.latitude : lat;
    const activeLng = overrides.longitude !== undefined ? overrides.longitude : lng;
    const activeDistrict = overrides.district !== undefined ? overrides.district : district;
    const activeSubdivision = overrides.subdivision !== undefined ? overrides.subdivision : subdivision;
    const activeAdminType = overrides.administrativeUnit !== undefined ? overrides.administrativeUnit : administrativeUnit;
    const activeUlb = overrides.ulb !== undefined ? overrides.ulb : ulb;
    const activeWard = overrides.ward !== undefined ? overrides.ward : ward;
    const activeBlock = overrides.block !== undefined ? overrides.block : block;
    const activeGp = overrides.gramPanchayat !== undefined ? overrides.gramPanchayat : gramPanchayat;
    const activeVillage = overrides.village !== undefined ? overrides.village : village;
    const activePin = overrides.pincode !== undefined ? overrides.pincode : pincode;
    const activePostOffice = overrides.postOffice !== undefined ? overrides.postOffice : postOffice;
    const activeSelectedStation = overrides.selectedPoliceStation !== undefined ? overrides.selectedPoliceStation : selectedPoliceStation;
    const activeNearestStation = overrides.nearestStation !== undefined ? overrides.nearestStation : nearestStation;
    const activeNearestDist = overrides.nearestStationDistance !== undefined ? overrides.nearestStationDistance : nearestStationDistance;
    const activeJurisdictionStation = overrides.jurisdictionStation !== undefined ? overrides.jurisdictionStation : jurisdictionStation;
    const activeJurisdictionVerified = overrides.policeJurisdictionVerified !== undefined ? overrides.policeJurisdictionVerified : policeJurisdictionVerified;
    const activeConfirmed = overrides.isConfirmed !== undefined ? overrides.isConfirmed : confirmed;
    const activeConfidence = overrides.confidence !== undefined ? overrides.confidence : confidence;
    const activeSources = overrides.sources !== undefined ? overrides.sources : sources;
    const activeAddress = overrides.address !== undefined ? overrides.address : (detectedAddress || searchInput);

    const payload = {
      latitude: activeLat,
      longitude: activeLng,
      coordinates: [activeLng, activeLat], // GeoJSON standard: [longitude, latitude]
      userEnteredAddress: overrides.userEnteredAddress || activeAddress,
      address: activeAddress,
      state: 'West Bengal',
      district: activeDistrict,
      district_id: null,
      subdivision: activeSubdivision,
      subdivision_id: null,
      administrativeUnit: activeAdminType,
      administrative_type: activeAdminType,
      urbanRural: activeAdminType,
      municipality: activeUlb,
      ulb: activeUlb,
      ulb_id: null,
      ward: activeWard,
      ward_id: null,
      block: activeBlock,
      block_id: null,
      gramPanchayat: activeGp,
      gram_panchayat: activeGp,
      gram_panchayat_id: null,
      village: activeVillage,
      village_id: null,
      pincode: activePin,
      postal_code: activePin,
      postOffice: activePostOffice,
      post_office: activePostOffice,

      // Police Separation
      policeStation: activeSelectedStation || (activeNearestStation ? activeNearestStation.name : null),
      police_station: activeSelectedStation || (activeNearestStation ? activeNearestStation.name : null),
      policeStationPhone: overrides.policeStationDetails?.phone || activeNearestStation?.phone || null,
      police_station_phone: overrides.policeStationDetails?.phone || activeNearestStation?.phone || null,
      policeStationDetails: overrides.policeStationDetails || activeNearestStation || null,

      nearestPoliceStation: activeNearestStation?.name || null,
      nearest_police_station: activeNearestStation?.name || null,
      nearestPoliceStationDistance: activeNearestDist,
      nearest_police_station_distance: activeNearestDist,
      jurisdictionPoliceStation: activeJurisdictionStation?.name || null,
      jurisdiction_police_station: activeJurisdictionStation?.name || null,
      jurisdictionVerified: activeJurisdictionVerified,
      jurisdiction_verified: activeJurisdictionVerified,

      locationSource: overrides.locationSource || 'Interactive GIS Map Pin (Auto-Decoded)',
      location_source: overrides.locationSource || 'Interactive GIS Map Pin (Auto-Decoded)',
      verificationStatus: overrides.resolutionStatus || resolutionStatus,
      verification_status: overrides.resolutionStatus || resolutionStatus,
      confidence: activeConfidence,
      sources: activeSources,
      isConfirmed: activeConfirmed
    };

    if (onLocationChange) {
      onLocationChange(payload);
    }

    return payload;
  }, [
    lat, lng, district, subdivision, administrativeUnit,
    ulb, ward, block, gramPanchayat, village, pincode, postOffice,
    selectedPoliceStation, nearestStation, nearestStationDistance,
    jurisdictionStation, policeJurisdictionVerified, confirmed,
    confidence, sources, resolutionStatus, detectedAddress, searchInput, onLocationChange
  ]);

  // -------------------------------------------------------------
  // Reverse Geocode on map click / pin drag
  // -------------------------------------------------------------
  const handleReverseGeocode = useCallback(async (targetLat, targetLng) => {
    setLoadingReverse(true);
    setErrorMessage('');
    try {
      const res = await api.get(`/locations/resolve?lat=${targetLat}&lng=${targetLng}`);
      if (res.data && (res.data.resolution || res.data.success)) {
        const r = res.data.resolution || res.data;

        // 1. Coordinates
        const resolvedLat = r.coordinates?.latitude || targetLat;
        const resolvedLng = r.coordinates?.longitude || targetLng;

        // 2. Candidate Reverse-Geocoded Address
        const resolvedAddress = r.address?.displayName || r.formattedAddress || `Location at ${targetLat.toFixed(5)}, ${targetLng.toFixed(5)}`;
        setDetectedAddress(resolvedAddress);
        setCustomAddressInput(resolvedAddress);
        setSearchInput(resolvedAddress);

        // 3. Administrative Boundary Matching (Clean reset - never keep old values)
        const resolvedDistrict = r.administrative?.district || r.district?.name || r.district || '';
        const resolvedSubdivision = r.administrative?.subdivision || r.subdivision || '';
        const resolvedUlb = r.administrative?.ulb || r.municipality || '';
        const resolvedWard = r.administrative?.ward || r.ward || '';
        const resolvedBlock = r.administrative?.block || r.block || '';
        const resolvedGp = r.administrative?.gramPanchayat || r.gramPanchayat || '';
        const resolvedVillage = r.administrative?.village || r.village || '';
        const resolvedAdminType = r.administrative?.urbanRural || (resolvedUlb ? 'Urban' : 'Rural');

        setDistrict(resolvedDistrict);
        setSubdivision(resolvedSubdivision);
        setUlb(resolvedUlb);
        setWard(resolvedWard);
        setBlock(resolvedBlock);
        setGramPanchayat(resolvedGp);
        setVillage(resolvedVillage);
        setAdministrativeUnit(resolvedAdminType);

        // 4. Postal Verification
        const resolvedPin = r.postal?.pincode || r.pincode || '';
        const resolvedPo = r.postal?.postOffice || r.postOffice || '';
        setPincode(resolvedPin);
        setPostOffice(resolvedPo);

        // 5. Police Station Resolution
        const nearestObj = r.police?.nearestStation || null;
        const nearestDist = r.police?.nearestStationDistance !== undefined ? r.police.nearestStationDistance : (nearestObj?.distanceKm ?? null);
        const jurisdictionObj = r.police?.jurisdictionStation || null;
        const isJurisdictionVerified = Boolean(r.police?.jurisdictionVerified);
        const activePsName = nearestObj ? nearestObj.name : '';

        setNearestStation(nearestObj);
        setNearestStationDistance(nearestDist);
        setJurisdictionStation(jurisdictionObj);
        setPoliceJurisdictionVerified(isJurisdictionVerified);
        setSelectedPoliceStation(activePsName);
        setPoliceStationDetails(nearestObj);

        // 6. Verification Flags & Sources
        const verif = r.verification || {
          districtVerified: Boolean(resolvedDistrict),
          subdivisionVerified: Boolean(resolvedSubdivision),
          ulbVerified: Boolean(resolvedUlb),
          wardVerified: Boolean(resolvedWard),
          blockVerified: Boolean(resolvedBlock),
          gramPanchayatVerified: Boolean(resolvedGp),
          villageVerified: Boolean(resolvedVillage),
          pincodeVerified: Boolean(resolvedPin),
          policeJurisdictionVerified: isJurisdictionVerified
        };
        setVerification(verif);

        const src = r.sources || {
          districtSource: 'REVERSE_GEOCODER',
          subdivisionSource: 'NOT_VERIFIED',
          ulbSource: 'NOT_VERIFIED',
          wardSource: 'NOT_VERIFIED',
          blockSource: 'NOT_VERIFIED',
          gramPanchayatSource: 'NOT_VERIFIED',
          villageSource: 'NOT_VERIFIED',
          pincodeSource: 'POSTCODE_DATABASE',
          addressSource: 'REVERSE_GEOCODER',
          nearestPoliceSource: 'GPS_DISTANCE',
          policeJurisdictionSource: 'NOT_VERIFIED'
        };
        setSources(src);

        const conf = r.confidence || 'PARTIALLY_VERIFIED';
        const stat = r.status || 'PARTIALLY_VERIFIED';
        setConfidence(conf);
        setResolutionStatus(stat);

        // Automatically set confirmed to true on click so citizen can immediately submit
        setConfirmed(true);
        setSuccessMessage(`✓ Decoded address: ${resolvedAddress}`);

        const payload = emitLocationPayload({
          latitude: resolvedLat,
          longitude: resolvedLng,
          address: resolvedAddress,
          userEnteredAddress: resolvedAddress,
          district: resolvedDistrict,
          subdivision: resolvedSubdivision,
          administrativeUnit: resolvedAdminType,
          ulb: resolvedUlb,
          ward: resolvedWard,
          block: resolvedBlock,
          gramPanchayat: resolvedGp,
          village: resolvedVillage,
          pincode: resolvedPin,
          postOffice: resolvedPo,
          nearestStation: nearestObj,
          nearestStationDistance: nearestDist,
          jurisdictionStation: jurisdictionObj,
          policeJurisdictionVerified: isJurisdictionVerified,
          selectedPoliceStation: activePsName,
          policeStationDetails: nearestObj,
          verification: verif,
          sources: src,
          confidence: conf,
          resolutionStatus: stat,
          isConfirmed: true
        });

        if (onLocationConfirm) {
          onLocationConfirm(payload);
        }
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
      const fallbackAddr = `Location at ${targetLat.toFixed(6)}, ${targetLng.toFixed(6)}`;
      setDetectedAddress(fallbackAddr);
      setCustomAddressInput(fallbackAddr);
      setConfirmed(true);
      emitLocationPayload({
        latitude: targetLat,
        longitude: targetLng,
        address: fallbackAddr,
        isConfirmed: true
      });
    } finally {
      setLoadingReverse(false);
    }
  }, [emitLocationPayload, onLocationConfirm]);

  // Initial reverse geocode on mount
  useEffect(() => {
    if (!detectedAddress && lat && lng) {
      handleReverseGeocode(lat, lng);
    }
  }, [lat, lng, detectedAddress, handleReverseGeocode]);

  // Fetch police stations for the district to populate quick selector
  useEffect(() => {
    let isMounted = true;
    async function fetchDistrictPoliceStations() {
      if (!district || district === 'West Bengal') return;
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('district', district);
        if (lat && lng) {
          queryParams.append('lat', lat);
          queryParams.append('lng', lng);
        }
        const res = await api.get(`/locations/police-stations?${queryParams.toString()}`);
        if (isMounted && res.data && Array.isArray(res.data.policeStations)) {
          setDistrictPoliceStations(res.data.policeStations);
        }
      } catch (err) {
        console.warn('Failed to fetch district police stations:', err);
      }
    }
    fetchDistrictPoliceStations();
    return () => { isMounted = false; };
  }, [district, lat, lng]);

  // Synchronize when parent updates selectedPoliceStationProp
  useEffect(() => {
    if (selectedPoliceStationProp && selectedPoliceStationProp !== selectedPoliceStation) {
      setSelectedPoliceStation(selectedPoliceStationProp);
      const found = districtPoliceStations.find(s => s.name === selectedPoliceStationProp);
      if (found) setPoliceStationDetails(found);
    }
  }, [selectedPoliceStationProp, districtPoliceStations]);

  // Open manual police station selector when cyber crime or police crime is active
  useEffect(() => {
    if (isPoliceOrCyberCrime) {
      setShowManualStationSelector(true);
    }
  }, [isPoliceOrCyberCrime]);

  // Select police station manually from district list
  const handleSelectStation = useCallback((stationName) => {
    setSelectedPoliceStation(stationName);
    const found = districtPoliceStations.find(s => s.name === stationName) || (nearestStation?.name === stationName ? nearestStation : null);
    setPoliceStationDetails(found || null);

    emitLocationPayload({
      selectedPoliceStation: stationName,
      policeStationDetails: found || null
    });

    if (onPoliceStationSelect) {
      onPoliceStationSelect(stationName, found || null);
    }
  }, [districtPoliceStations, nearestStation, emitLocationPayload, onPoliceStationSelect]);

  // Active station details for display
  const activeStation = useMemo(() => {
    if (selectedPoliceStation && districtPoliceStations.length > 0) {
      const found = districtPoliceStations.find(s => s.name === selectedPoliceStation);
      if (found) return found;
    }
    if (policeStationDetails) return policeStationDetails;
    return nearestStation;
  }, [selectedPoliceStation, districtPoliceStations, policeStationDetails, nearestStation]);

  // -------------------------------------------------------------
  // Forward Geocoding (Address Search)
  // -------------------------------------------------------------
  const handleAddressSearch = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!searchInput.trim()) {
      setErrorMessage('Please enter an address or landmark to search.');
      return;
    }

    setLoadingGeocode(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      let res;
      try {
        res = await api.post('/locations/geocode', { address: searchInput.trim() });
      } catch (postErr) {
        res = await api.get(`/locations/geocode?address=${encodeURIComponent(searchInput.trim())}`);
      }

      if (res.data && (res.data.success || res.data.latitude)) {
        const r = res.data;
        const newLat = r.latitude !== undefined && r.latitude !== null ? r.latitude : (r.coordinates ? r.coordinates[1] : null);
        const newLng = r.longitude !== undefined && r.longitude !== null ? r.longitude : (r.coordinates ? r.coordinates[0] : null);

        if (newLat && newLng) {
          setLat(newLat);
          setLng(newLng);
          setZoom(15);
          const fastAddr = r.formattedAddress || r.address?.displayName || r.rawAddress;
          if (fastAddr) {
            setDetectedAddress(fastAddr);
            setCustomAddressInput(fastAddr);
          }
          if (r.district) setDistrict(r.district);
          if (r.pincode) setPincode(r.pincode);
          handleReverseGeocode(newLat, newLng);
        }
      } else {
        setErrorMessage('Could not locate coordinates for this search. Click directly on the map to pinpoint.');
      }
    } catch (err) {
      setErrorMessage('Address search failed. Please click anywhere on the map to pinpoint your location.');
    } finally {
      setLoadingGeocode(false);
    }
  };

  // -------------------------------------------------------------
  // Map Pin Drag & Map Click Handlers (DIRECT INTERACTION)
  // -------------------------------------------------------------
  const handleMarkerDragEnd = () => {
    const marker = markerRef.current;
    if (marker) {
      const { lat: newLat, lng: newLng } = marker.getLatLng();
      const roundedLat = parseFloat(newLat.toFixed(6));
      const roundedLng = parseFloat(newLng.toFixed(6));
      setLat(roundedLat);
      setLng(roundedLng);
      handleReverseGeocode(roundedLat, roundedLng);
    }
  };

  const handleMapClick = (clickedLat, clickedLng) => {
    setLat(clickedLat);
    setLng(clickedLng);
    handleReverseGeocode(clickedLat, clickedLng);
  };

  // -------------------------------------------------------------
  // "Use My Current Location" via HTML5 Geolocation
  // -------------------------------------------------------------
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setLoadingGPS(true);
    setErrorMessage('');
    setSuccessMessage('');

    // Simple compact warning on GPS click
    setShowGpsNotice(true);

    const onLocationSuccess = (position) => {
      setLoadingGPS(false);
      const newLat = parseFloat(position.coords.latitude.toFixed(6));
      const newLng = parseFloat(position.coords.longitude.toFixed(6));
      const accuracy = position.coords.accuracy || 20;
      setGpsDotLocation({ lat: newLat, lng: newLng, accuracy });

      setLat(newLat);
      setLng(newLng);
      setZoom(16);
      setSuccessMessage('✓ GPS coordinates received. Please verify your pin on the map.');
      handleReverseGeocode(newLat, newLng);
    };

    const onLocationError = (error) => {
      if (error.code === 3 || error.code === 2) {
        navigator.geolocation.getCurrentPosition(
          onLocationSuccess,
          (fallbackErr) => {
            setLoadingGPS(false);
            setErrorMessage('Could not retrieve GPS coordinates. Please click directly on the map to pinpoint.');
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        setLoadingGPS(false);
        setErrorMessage('Location permission was denied or unavailable. Please click directly on the map to place your pin.');
      }
    };

    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      onLocationError,
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
    );
  };

  // Save custom edited address
  const handleSaveCustomAddress = () => {
    const trimmed = customAddressInput.trim();
    if (!trimmed) return;
    setDetectedAddress(trimmed);
    setIsEditingAddress(false);
    setSuccessMessage('✓ Address updated.');
    emitLocationPayload({ address: trimmed, userEnteredAddress: trimmed });
  };

  return (
    <div 
      className="location-picker-card"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: 'clamp(14px, 3vw, 22px)',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-md)',
        transition: 'all 0.3s ease',
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0
      }}
    >
      {/* 1. Header Bar */}
      <div 
        className="location-picker-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '14px'
        }}
      >
        <div className="location-picker-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          <div 
            className="location-picker-pin-icon"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.2)',
              flexShrink: 0
            }}
          >
            <MapPin size={22} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="location-picker-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 
                className="location-picker-title"
                style={{ fontSize: '1.12rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, wordBreak: 'break-word' }}
              >
                Incident Location & Decoded Address
              </h3>
              <span 
                className="location-picker-badge"
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}
              >
                <Sparkles size={11} />
                <span>Live GIS Auto-Decode</span>
              </span>
            </div>
            <p className="location-picker-desc" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
              Click or drag anywhere on the map — CivicPulse AI decodes the address, district, PIN code, and nearest police station instantly.
            </p>
          </div>
        </div>

        {/* Use Current GPS Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={loadingGPS}
          className="btn btn-secondary btn-sm location-picker-gps-btn"
          style={{
            fontSize: '0.82rem',
            padding: '8px 16px',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: gpsDotLocation ? 'rgba(37, 99, 235, 0.2)' : 'rgba(56, 189, 248, 0.1)',
            borderColor: gpsDotLocation ? '#2563eb' : 'rgba(56, 189, 248, 0.35)',
            color: gpsDotLocation ? '#38bdf8' : 'var(--accent-primary)',
            opacity: loadingGPS ? 0.7 : 1,
            cursor: loadingGPS ? 'not-allowed' : 'pointer',
            transition: 'var(--transition)'
          }}
          title="Detect device GPS coordinates and display exact location as a blue dot"
        >
          <Navigation size={14} className={loadingGPS ? 'animate-spin' : ''} />
          <span>{loadingGPS ? 'Detecting GPS...' : gpsDotLocation ? '📍 GPS Blue Dot Active' : '📍 Use My Current Location'}</span>
        </button>
      </div>

      {/* 2. Address Search Bar */}
      <div 
        role="search"
        className="location-picker-search-bar"
        style={{ marginBottom: '14px' }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Search 
              size={14} 
              color="#94a3b8" 
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} 
            />
            <input
              type="text"
              className="form-input location-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddressSearch(e);
                }
              }}
              placeholder="Search landmark, street, or address (or tap map)..."
              style={{
                paddingLeft: '30px',
                paddingRight: '28px',
                height: '36px',
                minHeight: '36px',
                maxHeight: '36px',
                fontSize: '0.82rem',
                borderRadius: '8px',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box'
              }}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleAddressSearch(e);
            }}
            disabled={loadingGeocode || !searchInput.trim()}
            className="btn btn-primary location-search-btn"
            style={{
              height: '36px',
              minHeight: '36px',
              maxHeight: '36px',
              padding: '0 10px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
              cursor: loadingGeocode || !searchInput.trim() ? 'not-allowed' : 'pointer',
              opacity: loadingGeocode || !searchInput.trim() ? 0.6 : 1
            }}
            title="Search address or area"
          >
            {loadingGeocode ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span className="location-btn-text" style={{ fontSize: '0.75rem' }}>...</span>
              </>
            ) : (
              <>
                <Search size={13} />
                <span className="location-btn-text" style={{ fontSize: '0.78rem' }}>Search</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Simple GPS Accuracy Notice (Compact 1-Liner in Red) */}
      {showGpsNotice && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.38)',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          fontSize: '0.78rem',
          color: '#ef4444'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 500, color: '#ef4444' }}>
              GPS may not be accurate on PC. For exact street location, use mobile or tap directly on the map.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowGpsNotice(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '0 4px',
              fontSize: '0.9rem',
              lineHeight: 1,
              opacity: 0.85
            }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Messages */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '0.8rem',
          color: '#fca5a5',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Interactive Leaflet Map */}
      <div 
        className={`location-map-container ${isExpanded ? 'is-expanded' : ''}`}
        style={{
          height: isExpanded ? '540px' : 'clamp(260px, 42vh, 400px)',
          width: '100%',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1.5px solid var(--border-subtle)',
          position: 'relative',
          boxShadow: 'var(--shadow-md)',
          transition: 'height 0.3s ease',
          marginBottom: '18px'
        }}
      >
        {/* Top-Right Control Group */}
        <div 
          className="location-map-top-right"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'auto'
          }}
        >
          <MapLayerSwitcher 
            currentProvider={currentProvider} 
            onProviderChange={setCurrentProvider} 
            style={{ position: 'relative', top: 'auto', left: 'auto', zIndex: 'auto' }}
          />

          <button
            type="button"
            className="map-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'var(--bg-surface)',
              backdropFilter: 'blur(10px)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              fontSize: '0.74rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md)',
              height: '32px'
            }}
            title={isExpanded ? "Collapse map size" : "Expand map size"}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span className="map-expand-text-full">{isExpanded ? 'Collapse' : 'Expand Size'}</span>
            <span className="map-expand-text-short" style={{ display: 'none' }}>{isExpanded ? 'Collapse' : 'Expand'}</span>
          </button>
        </div>

        <MapContainer
          center={[lat, lng]}
          zoom={zoom}
          zoomControl={false}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <CustomMapControls lat={lat} lng={lng} gpsDotLocation={gpsDotLocation} />
          <MapAutoInvalidate extraDep={isExpanded} />
          <FastTileLayer providerId={currentProvider} />
          <MapCenterController lat={lat} lng={lng} zoom={zoom} />
          <MapClickHandler onLocationSelect={handleMapClick} disabled={false} />

          {/* Exact GPS Blue Dot of User's Location */}
          {gpsDotLocation && (
            <UserGpsMarker
              position={[gpsDotLocation.lat, gpsDotLocation.lng]}
              accuracy={gpsDotLocation.accuracy}
              showAccuracyCircle={true}
              label="Your Exact Location"
            />
          )}

          <Marker
            position={[lat, lng]}
            icon={incidentPinIcon}
            draggable={true}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
            ref={markerRef}
          />
        </MapContainer>

        {/* Floating Instruction / Status Badge (Bottom-Left) */}
        <div 
          className="location-map-floating-badge"
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            zIndex: 999,
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '7px 12px',
            fontSize: '0.76rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none',
            maxWidth: 'calc(100% - 24px)'
          }}
        >
          {loadingReverse ? (
            <>
              <RefreshCw size={13} className="animate-spin" color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                Decoding address & nearest station...
              </span>
            </>
          ) : (
            <>
              <Compass size={14} color="#10b981" style={{ flexShrink: 0 }} />
              <span>
                📍 <strong>Tap map or drag marker</strong> to pinpoint address
              </span>
            </>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* 4. PROMINENT DECODED ADDRESS & INCIDENT SUMMARY SECTION       */}
      {/* ============================================================= */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* A. Hero Decoded Address Display */}
        <div>
          <div 
            className="location-decoded-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.7)',
                display: 'inline-block'
              }} />
              <span style={{
                fontSize: '0.74rem',
                color: '#10b981',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <MapPin size={13} />
                <span>Decoded Incident Address</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {!isEditingAddress ? (
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(true)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '7px',
                    padding: '4px 11px',
                    fontSize: '0.74rem',
                    color: 'var(--accent-primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    transition: 'var(--transition)'
                  }}
                  title="Add landmark, floor, or street details"
                >
                  <Edit3 size={12} />
                  <span>Add Landmark / Edit</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleSaveCustomAddress}
                    style={{
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 12px',
                      fontSize: '0.74rem',
                      color: '#ffffff',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={12} />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAddress(false);
                      setCustomAddressInput(detectedAddress);
                    }}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {!isEditingAddress ? (
            <div 
              className="location-decoded-address-box"
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderLeft: '4px solid #10b981',
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: 'var(--shadow-sm)',
                wordBreak: 'break-word'
              }}
            >
              {detectedAddress || (loadingReverse ? 'Resolving address from map coordinates...' : 'Click on the map to pinpoint address')}
            </div>
          ) : (
            <input
              type="text"
              className="form-input"
              value={customAddressInput}
              onChange={(e) => setCustomAddressInput(e.target.value)}
              placeholder="e.g. Near Clock Tower, Main Road, Raiganj..."
              style={{
                fontSize: '0.94rem',
                borderRadius: '10px',
                padding: '10px 14px',
                width: '100%',
                background: 'var(--bg-surface-elevated)',
                border: '1.5px solid var(--accent-primary)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          )}
        </div>

        {/* B. 4-Column Metadata Grid */}
        <div 
          className="location-meta-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
            gap: '12px'
          }}
        >
          {/* GPS Coordinates */}
          <div 
            className="location-meta-card"
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9px',
              padding: '9px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
              boxSizing: 'border-box'
            }}
          >
            <div>
              <span className="location-meta-title" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Crosshair size={12} color="var(--accent-primary)" />
                <span>GPS Coordinates</span>
              </span>
              <div className="location-meta-val" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.84rem', color: 'var(--accent-primary)', marginTop: '3px' }}>
                {lat.toFixed(4)}, {lng.toFixed(4)}
              </div>
            </div>
            <div className="location-meta-sub" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              GeoJSON: [{lng.toFixed(4)}, {lat.toFixed(4)}]
            </div>
          </div>

          {/* District */}
          <div 
            className="location-meta-card"
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9px',
              padding: '9px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
              boxSizing: 'border-box'
            }}
          >
            <div>
              <span className="location-meta-title" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Building2 size={12} color="#10b981" />
                <span>District</span>
              </span>
              <div className="location-meta-val" style={{ fontWeight: 700, fontSize: '0.84rem', color: district ? '#10b981' : '#ca8a04', marginTop: '3px', wordBreak: 'break-word' }}>
                {district || 'West Bengal'}
              </div>
            </div>
            <div className="location-meta-sub" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>West Bengal</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>• Auto-Indexed</span>
            </div>
          </div>

          {/* PIN Code */}
          <div 
            className="location-meta-card"
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9px',
              padding: '9px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
              boxSizing: 'border-box'
            }}
          >
            <div>
              <span className="location-meta-title" style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={12} color="#8b5cf6" />
                <span>Postal PIN</span>
              </span>
              <div className="location-meta-val" style={{ fontWeight: 800, fontSize: '0.88rem', color: pincode ? 'var(--text-primary)' : '#ca8a04', fontFamily: 'monospace', marginTop: '3px' }}>
                {pincode || 'Determining...'}
              </div>
            </div>
            <div className="location-meta-sub" style={{ fontSize: '0.65rem', color: pincode ? '#10b981' : 'var(--text-muted)', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              {pincode ? (
                <>
                  <Check size={11} color="#10b981" />
                  <span>WB Postal DB</span>
                </>
              ) : (
                <span>PIN indexing</span>
              )}
            </div>
          </div>

          {/* Nearest / Assigned Police Station */}
          <div 
            className="location-meta-card"
            style={{
              background: isPoliceOrCyberCrime ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-surface-elevated)',
              border: isPoliceOrCyberCrime ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
              borderRadius: '9px',
              padding: '9px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)',
              boxSizing: 'border-box'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '2px' }}>
                <span className="location-meta-title" style={{ fontSize: '0.66rem', color: isPoliceOrCyberCrime ? 'var(--accent-cyan)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Shield size={12} color={isPoliceOrCyberCrime ? 'var(--accent-cyan)' : '#0284c7'} />
                  <span>{selectedPoliceStation && selectedPoliceStation !== nearestStation?.name ? 'Assigned Thana' : 'Nearest Thana'}</span>
                </span>
                {isPoliceOrCyberCrime && (
                  <span style={{ fontSize: '0.6rem', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--accent-cyan)', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>
                    ACTIVE
                  </span>
                )}
              </div>

              <div className="location-meta-val" style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', marginTop: '3px', wordBreak: 'break-word', lineHeight: 1.25 }}>
                {activeStation?.name || selectedPoliceStation || nearestStation?.name || 'Searching...'}
              </div>

              <div className="location-meta-sub" style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', marginTop: '3px', fontWeight: 600 }}>
                {activeStation?.distanceKm !== undefined && activeStation?.distanceKm !== null
                  ? `~${activeStation.distanceKm} km away`
                  : nearestStationDistance !== null ? `~${nearestStationDistance} km away` : ''}
                {activeStation?.phone ? ` • ${activeStation.phone}` : (nearestStation?.phone ? ` • ${nearestStation.phone}` : '')}
              </div>
            </div>
          </div>
        </div>

        {/* Manual Police Station Jurisdiction Selection (District-Wide) */}
        {(showManualStationSelector || isPoliceOrCyberCrime) && (
          <div 
            className="location-thana-card"
            style={{
              background: isPoliceOrCyberCrime 
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(59, 130, 246, 0.1) 100%)' 
                : 'var(--bg-surface-elevated)',
              border: isPoliceOrCyberCrime 
                ? '1px solid var(--accent-cyan)' 
                : '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '7px 10px',
              boxShadow: 'var(--shadow-sm)',
              boxSizing: 'border-box'
            }}
          >
            <div className="location-thana-header" style={{ marginBottom: '4px' }}>
              <div className="location-thana-header-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.25))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)',
                    flexShrink: 0
                  }}>
                    <Shield size={11} />
                  </div>
                  <strong className="location-thana-title" style={{ fontSize: '0.78rem', color: 'var(--text-primary)', wordBreak: 'break-word', minWidth: 0, fontWeight: 600 }}>
                    <span className="desktop-only">Choose Police Station / Thana in {district || 'West Bengal'}</span>
                    <span className="mobile-only">Choose Police Station / Thana</span>
                  </strong>
                </div>

                <span className="location-thana-count-tag" style={{
                  fontSize: '0.64rem',
                  background: 'rgba(6, 182, 212, 0.12)',
                  color: 'var(--accent-cyan)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap'
                }}>
                  <span className="desktop-only">{districtPoliceStations.length} Stations Available</span>
                  <span className="mobile-only">{districtPoliceStations.length} Available</span>
                </span>
              </div>

              <span className="location-thana-desc" style={{ fontSize: '0.67rem', color: isPoliceOrCyberCrime ? 'var(--accent-cyan)' : 'var(--text-secondary)', display: 'block', marginTop: '2px', lineHeight: 1.25 }}>
                {isPoliceOrCyberCrime 
                  ? '🚨 Crime Detected: Select preferred designated thana or cyber cell.'
                  : `Select thana in ${district} or keep calculated nearest station.`}
              </span>
            </div>

            <div className="location-thana-controls" style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '5px' }}>
              <div className="location-thana-select-wrap" style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <select
                  className="form-select"
                  value={selectedPoliceStation || activeStation?.name || ''}
                  onChange={(e) => handleSelectStation(e.target.value)}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '4px 24px 4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--accent-cyan)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none'
                  }}
                >
                  <option value="">-- Choose Police Station --</option>
                  {districtPoliceStations.map(ps => (
                    <option key={ps.id || ps._id || ps.name} value={ps.name}>
                      {ps.name === nearestStation?.name ? '📍 [Nearest] ' : ''}{ps.name} {ps.distanceKm !== null ? `(~${ps.distanceKm} km)` : ''} {ps.phone ? `• ${ps.phone}` : ''}
                    </option>
                  ))}
                </select>
                <div
                  style={{
                    position: 'absolute',
                    right: '7px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)'
                  }}
                  aria-hidden="true"
                >
                  <ChevronDown size={13} strokeWidth={2.4} />
                </div>
              </div>

              {nearestStation && (
                <button
                  type="button"
                  className="location-thana-reset-btn"
                  onClick={() => handleSelectStation(nearestStation.name)}
                  style={{
                    height: '32px',
                    background: (!selectedPoliceStation || selectedPoliceStation === nearestStation.name) ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
                    border: (!selectedPoliceStation || selectedPoliceStation === nearestStation.name) ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                    color: (!selectedPoliceStation || selectedPoliceStation === nearestStation.name) ? '#10b981' : 'var(--text-primary)',
                    borderRadius: '6px',
                    padding: '0 8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'var(--transition)'
                  }}
                >
                  {(!selectedPoliceStation || selectedPoliceStation === nearestStation.name) ? '✓ Nearest' : `⟲ Reset`}
                </button>
              )}
            </div>

            {/* Selected Thana Summary Box (Compact 1-Liner) */}
            {activeStation && (
              <div 
                className="location-thana-summary-box"
                style={{
                  marginTop: '5px',
                  background: 'var(--bg-surface)',
                  border: '1px dashed rgba(6, 182, 212, 0.4)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '4px',
                  fontSize: '0.72rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', minWidth: 0 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned:</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>{activeStation.name}</strong>
                  {activeStation.distanceKm !== null && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      (~{activeStation.distanceKm} km)
                    </span>
                  )}
                  {activeStation.address && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      • {activeStation.address}
                    </span>
                  )}
                </div>

                {activeStation.phone && (
                  <a
                    href={`tel:${activeStation.phone.replace(/[^0-9+]/g, '')}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontWeight: 700,
                      fontSize: '0.68rem',
                      boxShadow: '0 1px 4px rgba(6, 182, 212, 0.3)'
                    }}
                  >
                    <PhoneCall size={10} />
                    <span>Call: {activeStation.phone}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Police Jurisdiction Disclaimer */}
        <div 
          className="location-disclaimer"
          style={{
            fontSize: '0.74rem',
            color: policeJurisdictionVerified ? '#10b981' : '#d97706',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 4px'
          }}
        >
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          <span>
            {policeJurisdictionVerified 
              ? 'Jurisdiction verified via official boundary data.' 
              : 'The grievance will be routed to your chosen/nearest police station.'}
          </span>
        </div>

        {/* D. Bottom Status Pill */}
        <div 
          className="location-footer-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '6px',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: '#10b981',
            fontWeight: 700
          }}>
            <CheckCircle2 size={15} color="#10b981" />
            <span>Location Active & Resolved</span>
          </div>

          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Coordinates and address will be submitted.
          </span>
        </div>
      </div>
    </div>
  );
}
