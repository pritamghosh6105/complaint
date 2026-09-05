import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  Building2, 
  Trees, 
  Sparkles, 
  Search, 
  Shield, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  Compass,
  Layers
} from 'lucide-react';
import SearchableSelect from '../common/SearchableSelect';
import api from '../../services/api';

const pinIcon = L.divIcon({
  html: `
    <div style="
      background-color: #ef4444;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #ffffff;
      box-shadow: 0 0 15px rgba(239,68,68,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  className: 'custom-pin-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      const lat = parseFloat(e.latlng.lat.toFixed(5));
      const lng = parseFloat(e.latlng.lng.toFixed(5));
      onLocationSelect(lat, lng);
    }
  });
  return null;
}

export default function LocationSelector({ 
  value = {}, 
  onChange,
  onGPSDetectionMessage = null 
}) {
  // Mode: 'urban' | 'rural' | 'custom'
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

  // Selections
  const [selectedDistrictId, setSelectedDistrictId] = useState(value.district_id || 2); // Default North 24 Parganas
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState(value.subdivision_id || 2);
  const [selectedULBId, setSelectedULBId] = useState(value.ulb_id || 3);
  const [selectedWardId, setSelectedWardId] = useState(value.ward_id || '');
  const [selectedWardName, setSelectedWardName] = useState(value.ward || 'Ward 1');
  const [selectedBlockId, setSelectedBlockId] = useState(value.block_id || 1);
  const [selectedGPId, setSelectedGPId] = useState(value.gram_panchayat_id || 1);
  const [selectedVillageId, setSelectedVillageId] = useState(value.village_id || '');
  const [selectedPSId, setSelectedPSId] = useState(value.police_station_id || '');
  const [locality, setLocality] = useState(value.locality || '');
  const [landmark, setLandmark] = useState(value.landmark || '');
  const [postalCode, setPostalCode] = useState(value.postal_code || '');

  // GPS Map state
  const [lat, setLat] = useState(value.latitude || 22.7230);
  const [lng, setLng] = useState(value.longitude || 88.4800);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [gpsNotification, setGpsNotification] = useState('');

  // 1. Initial Load: Fetch All Districts
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const res = await api.get('/location/districts');
        setDistricts(res.data.districts || []);
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    };
    fetchDistricts();
  }, []);

  // 2. Fetch Subdivisions when District changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setSubdivisions([]);
      return;
    }
    const fetchSubdivisions = async () => {
      try {
        const res = await api.get(`/location/subdivisions?district_id=${selectedDistrictId}`);
        setSubdivisions(res.data.subdivisions || []);
      } catch (err) {
        console.error('Failed to load subdivisions:', err);
      }
    };
    fetchSubdivisions();
  }, [selectedDistrictId]);

  // 3. Fetch ULBs, Blocks, and Police Stations when District/Subdivision changes
  useEffect(() => {
    if (!selectedDistrictId) return;

    const fetchDistrictLocations = async () => {
      try {
        const subQuery = selectedSubdivisionId ? `&subdivision_id=${selectedSubdivisionId}` : '';
        const [ulbRes, blkRes, psRes] = await Promise.all([
          api.get(`/location/ulbs?district_id=${selectedDistrictId}${subQuery}`),
          api.get(`/location/blocks?district_id=${selectedDistrictId}${subQuery}`),
          api.get(`/location/police-stations?district_id=${selectedDistrictId}${subQuery}`)
        ]);
        setUlbs(ulbRes.data.ulbs || []);
        setBlocks(blkRes.data.blocks || []);
        setPoliceStations(psRes.data.police_stations || []);
      } catch (err) {
        console.error('Failed to load district entities:', err);
      }
    };
    fetchDistrictLocations();
  }, [selectedDistrictId, selectedSubdivisionId]);

  // 4. Fetch Wards when ULB changes
  useEffect(() => {
    if (!selectedULBId) {
      setWards([]);
      return;
    }
    const fetchWards = async () => {
      try {
        const res = await api.get(`/location/wards?ulb_id=${selectedULBId}`);
        setWards(res.data.wards || []);
      } catch (err) {
        console.error('Failed to load wards:', err);
      }
    };
    fetchWards();
  }, [selectedULBId]);

  // 5. Fetch Gram Panchayats when Block changes
  useEffect(() => {
    if (!selectedBlockId) {
      setGramPanchayats([]);
      return;
    }
    const fetchGPs = async () => {
      try {
        const res = await api.get(`/location/gram-panchayats?block_id=${selectedBlockId}`);
        setGramPanchayats(res.data.gram_panchayats || []);
      } catch (err) {
        console.error('Failed to load GPs:', err);
      }
    };
    fetchGPs();
  }, [selectedBlockId]);

  // 6. Fetch Villages when Gram Panchayat changes
  useEffect(() => {
    if (!selectedGPId) {
      setVillages([]);
      return;
    }
    const fetchVillages = async () => {
      try {
        const res = await api.get(`/location/villages?gram_panchayat_id=${selectedGPId}`);
        setVillages(res.data.villages || []);
      } catch (err) {
        console.error('Failed to load villages:', err);
      }
    };
    fetchVillages();
  }, [selectedGPId]);

  // Emit updated Location state to parent component whenever changes occur
  useEffect(() => {
    const distObj = districts.find(d => d.id === Number(selectedDistrictId));
    const subObj = subdivisions.find(s => s.id === Number(selectedSubdivisionId));
    const ulbObj = ulbs.find(u => u.id === Number(selectedULBId));
    const wardObj = wards.find(w => w.id === Number(selectedWardId));
    const blkObj = blocks.find(b => b.id === Number(selectedBlockId));
    const gpObj = gramPanchayats.find(g => g.id === Number(selectedGPId));
    const vilObj = villages.find(v => v.id === Number(selectedVillageId));
    const psObj = policeStations.find(p => p.id === Number(selectedPSId));

    const finalWard = adminType === 'Urban' 
      ? (wardObj ? wardObj.name : selectedWardName || 'Ward 1')
      : (gpObj ? gpObj.name : '');

    const locationPayload = {
      state: 'West Bengal',
      administrative_type: adminType,
      district_id: selectedDistrictId ? Number(selectedDistrictId) : null,
      district: distObj ? distObj.name : 'North 24 Parganas',
      subdivision_id: selectedSubdivisionId ? Number(selectedSubdivisionId) : null,
      subdivision: subObj ? subObj.name : '',
      ulb_id: adminType === 'Urban' && selectedULBId ? Number(selectedULBId) : null,
      ulb_type: adminType === 'Urban' && ulbObj ? ulbObj.type : null,
      municipality: adminType === 'Urban' && ulbObj ? ulbObj.name : '',
      ward_id: adminType === 'Urban' && selectedWardId ? Number(selectedWardId) : null,
      ward: finalWard,
      block_id: adminType === 'Rural' && selectedBlockId ? Number(selectedBlockId) : null,
      block: adminType === 'Rural' && blkObj ? blkObj.name : '',
      gram_panchayat_id: adminType === 'Rural' && selectedGPId ? Number(selectedGPId) : null,
      gram_panchayat: adminType === 'Rural' && gpObj ? gpObj.name : '',
      village_id: adminType === 'Rural' && selectedVillageId ? Number(selectedVillageId) : null,
      village: adminType === 'Rural' && vilObj ? vilObj.name : (adminType === 'Rural' && gpObj ? gpObj.name : ''),
      mouza: adminType === 'Rural' && vilObj ? vilObj.mouza : '',
      police_station_id: selectedPSId ? Number(selectedPSId) : null,
      police_station: psObj ? psObj.name : '',
      locality: locality.trim(),
      landmark: landmark.trim(),
      postal_code: postalCode.trim(),
      latitude: lat,
      longitude: lng,
      address_formatted: [
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
    landmark,
    postalCode,
    lat,
    lng
  ]);

  // Handle District Change -> clean child dependencies
  const handleDistrictChange = (distId) => {
    setSelectedDistrictId(distId);
    setSelectedSubdivisionId('');
    setSelectedULBId('');
    setSelectedWardId('');
    setSelectedBlockId('');
    setSelectedGPId('');
    setSelectedVillageId('');
    setSelectedPSId('');

    // Pan map to district centroid if available
    const dist = districts.find(d => d.id === Number(distId));
    if (dist && dist.center_lat && dist.center_lng) {
      setLat(dist.center_lat);
      setLng(dist.center_lng);
    }
  };

  // Handle Subdivision Change
  const handleSubdivisionChange = (subId) => {
    setSelectedSubdivisionId(subId);
    setSelectedULBId('');
    setSelectedWardId('');
    setSelectedBlockId('');
    setSelectedGPId('');
    setSelectedVillageId('');
  };

  // Handle PIN Code Quick Lookup
  const handlePincodeChange = async (pin) => {
    setPostalCode(pin);
    if (pin.length === 6 && /^\d+$/.test(pin)) {
      try {
        const res = await api.get(`/location/pincode/${pin}`);
        if (res.data && res.data.district_id) {
          setSelectedDistrictId(res.data.district_id);
          if (res.data.subdivision_id) {
            setSelectedSubdivisionId(res.data.subdivision_id);
          }
          if (res.data.locality && !locality) {
            setLocality(res.data.locality);
          }
          if (res.data.latitude && res.data.longitude) {
            setLat(res.data.latitude);
            setLng(res.data.longitude);
          }
          setGpsNotification(`PIN Code identified: ${res.data.locality}, ${res.data.district_name}`);
        }
      } catch (err) {
        // code not indexed yet
      }
    }
  };

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
        const newLat = parseFloat(pos.coords.latitude.toFixed(5));
        const newLng = parseFloat(pos.coords.longitude.toFixed(5));
        setLat(newLat);
        setLng(newLng);

        try {
          const res = await api.post('/location/reverse-geocode', {
            latitude: newLat,
            longitude: newLng
          });

          if (res.data) {
            const data = res.data;
            if (data.administrative_type) {
              setAdminType(data.administrative_type);
            }
            if (data.district_id) {
              setSelectedDistrictId(data.district_id);
            }
            if (data.subdivision_id) {
              setSelectedSubdivisionId(data.subdivision_id);
            }
            if (data.ulb_id) {
              setSelectedULBId(data.ulb_id);
            }
            if (data.block_id) {
              setSelectedBlockId(data.block_id);
            }
            if (data.gram_panchayat_id) {
              setSelectedGPId(data.gram_panchayat_id);
            }
            if (data.village_id) {
              setSelectedVillageId(data.village_id);
            }
            if (data.police_station_id) {
              setSelectedPSId(data.police_station_id);
            }
            if (data.village && !locality) {
              setLocality(data.village);
            }

            const label = data.detected_location_label || `${data.district}, West Bengal`;
            const msg = `📍 Location detected: ${label}. Please verify.`;
            setGpsNotification(msg);
            if (onGPSDetectionMessage) onGPSDetectionMessage(msg);
          }
        } catch (err) {
          setGpsNotification('Coordinates detected. Please verify administrative area.');
        }
      },
      (err) => {
        setLoadingGPS(false);
        alert('GPS permission denied or unavailable. You can click on the map to set location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Map Click handler
  const handleMapPinSelect = async (clickedLat, clickedLng) => {
    setLat(clickedLat);
    setLng(clickedLng);

    try {
      const res = await api.post('/location/reverse-geocode', {
        latitude: clickedLat,
        longitude: clickedLng
      });
      if (res.data && res.data.detected_location_label) {
        setGpsNotification(`Map pin: ${res.data.detected_location_label}.`);
      }
    } catch (e) {
      // ignore
    }
  };

  const currentDistrict = districts.find(d => d.id === Number(selectedDistrictId));
  const currentULB = ulbs.find(u => u.id === Number(selectedULBId));
  const currentBlock = blocks.find(b => b.id === Number(selectedBlockId));
  const currentGP = gramPanchayats.find(g => g.id === Number(selectedGPId));

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(14px)',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      borderRadius: '14px',
      padding: '18px',
      marginBottom: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)'
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
        paddingBottom: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(37, 99, 235, 0.3))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <MapPin size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📍 Location & Jurisdiction
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                🏛️ State: West Bengal
              </span>
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Comprehensive administrative coverage across all 23 districts (Urban ULBs & Rural Panchayats).
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
            fontSize: '0.8rem',
            padding: '6px 14px',
            borderRadius: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(56, 189, 248, 0.1)',
            borderColor: 'rgba(56, 189, 248, 0.3)',
            color: '#38bdf8'
          }}
        >
          <Navigation size={14} className={loadingGPS ? 'animate-spin' : ''} />
          {loadingGPS ? 'Detecting via GPS...' : '📍 Use My GPS'}
        </button>
      </div>

      {/* GPS Notification Banner */}
      {gpsNotification && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(56, 189, 248, 0.12)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '8px',
          marginBottom: '14px',
          fontSize: '0.82rem',
          color: '#e0f2fe'
        }}>
          <Sparkles size={14} color="#38bdf8" />
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

      {/* Administrative Area Mode Selector */}
      <div style={{ marginBottom: '14px' }}>
        <label className="form-label" style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px' }}>
          Administrative Hierarchy:
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setAdminType('Urban')}
            className={`btn btn-sm ${adminType === 'Urban' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Building2 size={14} /> 🏢 Urban / Municipal
          </button>
          <button
            type="button"
            onClick={() => setAdminType('Rural')}
            className={`btn btn-sm ${adminType === 'Rural' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Trees size={14} /> 🌾 Rural / Panchayat
          </button>
          <button
            type="button"
            onClick={() => setAdminType('Other')}
            className={`btn btn-sm ${adminType === 'Other' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '6px 14px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Compass size={14} /> ✍️ Other / Custom
          </button>
        </div>
      </div>

      {/* Cascading Form Fields Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
        gap: '12px',
        marginBottom: '14px'
      }}>
        {/* District (All 23 Districts) */}
        <div>
          <label className="form-label" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            District (West Bengal) *
          </label>
          <SearchableSelect
            options={districts}
            value={selectedDistrictId}
            onChange={handleDistrictChange}
            placeholder="Search district..."
            searchPlaceholder="Type district name..."
            labelKey="name"
            valueKey="id"
            secondaryKey="division"
            storageKey="wb_districts"
          />
        </div>

        {/* Sub-Division */}
        <div>
          <label className="form-label" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
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

        {/* URBAN: Municipality / Corporation */}
        {adminType === 'Urban' && (
          <div>
            <label className="form-label" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              Municipality / Corporation *
            </label>
            <SearchableSelect
              options={ulbs}
              value={selectedULBId}
              onChange={(ulbId) => {
                setSelectedULBId(ulbId);
                setSelectedWardId('');
              }}
              placeholder="Search municipality/corp..."
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
            <label className="form-label" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              Municipal Ward *
            </label>
            <SearchableSelect
              options={wards}
              value={selectedWardId}
              onChange={(wId, item) => {
                setSelectedWardId(wId);
                if (item) setSelectedWardName(item.name);
              }}
              placeholder={wards.length > 0 ? "Search ward..." : "Select ULB first"}
              disabled={wards.length === 0}
              labelKey="name"
              valueKey="id"
              storageKey="wb_wards"
            />
          </div>
        )}

        {/* RURAL: CD Block */}
        {adminType === 'Rural' && (
          <div>
            <label className="form-label" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              Community Development Block *
            </label>
            <SearchableSelect
              options={blocks}
              value={selectedBlockId}
              onChange={(blkId) => {
                setSelectedBlockId(blkId);
                setSelectedGPId('');
                setSelectedVillageId('');
              }}
              placeholder="Search CD block..."
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
            <label className="form-label" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
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
            <label className="form-label" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
              Village / Mouza
            </label>
            <SearchableSelect
              options={villages}
              value={selectedVillageId}
              onChange={(vId, item) => {
                setSelectedVillageId(vId);
                if (item && !locality) setLocality(item.name);
              }}
              placeholder={villages.length > 0 ? "Search village..." : "Type custom below"}
              disabled={villages.length === 0}
              labelKey="name"
              valueKey="id"
              secondaryKey="jl_no"
              storageKey="wb_villages"
            />
          </div>
        )}

        {/* Police Station Jurisdiction */}
        <div>
          <label className="form-label" style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Shield size={12} color="#38bdf8" /> Police Station Jurisdiction
          </label>
          <SearchableSelect
            options={policeStations}
            value={selectedPSId}
            onChange={(psId) => setSelectedPSId(psId)}
            placeholder="Search police station..."
            disabled={policeStations.length === 0}
            labelKey="name"
            valueKey="id"
            secondaryKey="commissionerate"
            storageKey="wb_police_stations"
          />
        </div>

        {/* Postal PIN Code */}
        <div>
          <label className="form-label" style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Hash size={12} /> Postal PIN Code
          </label>
          <input
            type="text"
            className="form-input"
            maxLength={6}
            value={postalCode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            placeholder="e.g. 700124, 741235..."
            style={{ fontSize: '0.85rem', padding: '7px 10px' }}
          />
        </div>
      </div>

      {/* Street / Landmark / Locality Detail Inputs */}
      <div className="grid-cols-2" style={{ marginBottom: '14px' }}>
        <div>
          <label className="form-label" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Locality / Street / Colony / Para
          </label>
          <input
            type="text"
            className="form-input"
            value={locality}
            onChange={(e) => setLocality(e.target.value)}
            placeholder="e.g. Adhata Bazar, Deshbandhu Park, Jessore Road..."
            style={{ fontSize: '0.85rem', padding: '7px 10px' }}
          />
        </div>
        <div>
          <label className="form-label" style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            Landmark
          </label>
          <input
            type="text"
            className="form-input"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="e.g. Near BDO Office, Opposite Hospital, Behind Primary School..."
            style={{ fontSize: '0.85rem', padding: '7px 10px' }}
          />
        </div>
      </div>

      {/* Interactive Map Pinning */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Layers size={13} color="#38bdf8" /> OpenStreetMap GIS Incident Pin:
          </span>
          <span style={{ fontSize: '0.74rem', color: '#38bdf8' }}>
            *Click anywhere or use GPS to position pin
          </span>
        </div>

        <div 
          className="leaflet-map-responsive"
          style={{ 
            height: '210px', 
            width: '100%', 
            borderRadius: '10px', 
            overflow: 'hidden', 
            border: '1px solid rgba(255, 255, 255, 0.12)',
            position: 'relative'
          }}>
          <MapContainer
            center={[lat || 22.7230, lng || 88.4800]}
            zoom={12}
            scrollWheelZoom={false}
            style={{ width: '100%', height: '100%' }}
            key={`${lat}-${lng}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleMapPinSelect} />
            {lat && lng && (
              <Marker position={[lat, lng]} icon={pinIcon} />
            )}
          </MapContainer>
        </div>

        {/* Live Coordinate Badges */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '8px',
          fontSize: '0.75rem',
          color: '#94a3b8'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span>Lat: <strong style={{ color: '#ffffff' }}>{lat ? lat.toFixed(4) : '22.7230'}</strong></span>
            <span>Lng: <strong style={{ color: '#ffffff' }}>{lng ? lng.toFixed(4) : '88.4800'}</strong></span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(56, 189, 248, 0.12)',
              color: '#38bdf8',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 600
            }}>
              District: {currentDistrict ? currentDistrict.name : 'North 24 Parganas'}
            </span>
            {(currentULB || currentBlock) && (
              <span style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 600
              }}>
                Area: {adminType === 'Urban' ? (currentULB?.name || '') : (currentBlock?.name || '')}
              </span>
            )}
            {locality && (
              <span style={{
                background: 'rgba(244, 63, 94, 0.12)',
                color: '#fb7185',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 600
              }}>
                Locality: {locality}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
