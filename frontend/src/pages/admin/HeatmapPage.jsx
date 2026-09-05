import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from 'react-leaflet';
import { 
  Flame, 
  MapPin, 
  AlertTriangle, 
  Layers, 
  ArrowLeft, 
  ShieldAlert,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  Filter,
  Shield,
  Building,
  TreePine,
  Search,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import SearchableSelect from '../../components/common/SearchableSelect';

// Helper component to smoothly re-center Leaflet map
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function HeatmapPage({ setCurrentRoute, setSelectedComplaintId }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeInspectorPoint, setActiveInspectorPoint] = useState(null);
  const [summaryMeta, setSummaryMeta] = useState({ total: 0, crimeCount: 0, shieldedCount: 0 });

  // Map state
  const [mapCenter, setMapCenter] = useState([22.5726, 88.3639]); // Default West Bengal / Kolkata
  const [mapZoom, setMapZoom] = useState(11);

  // Cascading Location Option Lists
  const [districts, setDistricts] = useState([]);
  const [subdivisions, setSubdivisions] = useState([]);
  const [ulbs, setUlbs] = useState([]);
  const [wards, setWards] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [gramPanchayats, setGramPanchayats] = useState([]);
  const [policeStations, setPoliceStations] = useState([]);

  // Active Filter Selections
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedSubdivision, setSelectedSubdivision] = useState('');
  const [selectedSubdivisionId, setSelectedSubdivisionId] = useState('');
  const [adminType, setAdminType] = useState('ALL'); // 'ALL' | 'Urban' | 'Rural'
  const [selectedULB, setSelectedULB] = useState('');
  const [selectedULBId, setSelectedULBId] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedGP, setSelectedGP] = useState('');
  const [selectedGPId, setSelectedGPId] = useState('');
  const [selectedPS, setSelectedPS] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [viewType, setViewType] = useState('all'); // 'all' | 'civic' | 'crime'
  const [timeframe, setTimeframe] = useState('all'); // 'all' | '7d' | '30d' | '6m'
  const [showHotspots, setShowHotspots] = useState(true);
  const [hotspots, setHotspots] = useState([]);

  // Fetch initial West Bengal districts, police stations, and hotspots
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [distRes, psRes, hotRes] = await Promise.all([
          api.get('/location/districts'),
          api.get('/location/police-stations'),
          api.get('/analytics/hotspots').catch(() => ({ data: { hotspots: [] } }))
        ]);
        setDistricts(distRes.data.districts || []);
        setPoliceStations(psRes.data.police_stations || []);
        setHotspots(hotRes.data?.hotspots || []);
      } catch (err) {
        console.error('Failed to load initial location datasets:', err);
      }
    };
    fetchInitialData();
  }, []);

  // Cascade Subdivisions, ULBs, Blocks, and Police Stations when District changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setSubdivisions([]);
      setUlbs([]);
      setBlocks([]);
      setSelectedSubdivision('');
      setSelectedSubdivisionId('');
      setSelectedULB('');
      setSelectedULBId('');
      setSelectedWard('');
      setSelectedBlock('');
      setSelectedBlockId('');
      setSelectedGP('');
      setSelectedGPId('');
      return;
    }

    // Recenter map to district centroid if available
    const matchedDist = districts.find(d => d.id === Number(selectedDistrictId));
    if (matchedDist && matchedDist.center_lat && matchedDist.center_lng) {
      setMapCenter([matchedDist.center_lat, matchedDist.center_lng]);
      setMapZoom(11);
    }

    const fetchDistrictChildren = async () => {
      try {
        const [subRes, ulbRes, blkRes, psRes] = await Promise.all([
          api.get(`/location/subdivisions?district_id=${selectedDistrictId}`),
          api.get(`/location/ulbs?district_id=${selectedDistrictId}`),
          api.get(`/location/blocks?district_id=${selectedDistrictId}`),
          api.get(`/location/police-stations?district_id=${selectedDistrictId}`)
        ]);
        setSubdivisions(subRes.data.subdivisions || []);
        setUlbs(ulbRes.data.ulbs || []);
        setBlocks(blkRes.data.blocks || []);
        setPoliceStations(psRes.data.police_stations || []);
      } catch (err) {
        console.error('Failed cascading district children:', err);
      }
    };
    fetchDistrictChildren();
  }, [selectedDistrictId, districts]);

  // Cascade Wards when ULB changes
  useEffect(() => {
    if (!selectedULBId) {
      setWards([]);
      setSelectedWard('');
      return;
    }

    const matchedULB = ulbs.find(u => u.id === Number(selectedULBId));
    if (matchedULB && matchedULB.lat && matchedULB.lng) {
      setMapCenter([matchedULB.lat, matchedULB.lng]);
      setMapZoom(13);
    }

    const fetchWards = async () => {
      try {
        const res = await api.get(`/location/wards?ulb_id=${selectedULBId}`);
        setWards(res.data.wards || []);
      } catch (err) {
        console.error('Failed fetching wards:', err);
      }
    };
    fetchWards();
  }, [selectedULBId, ulbs]);

  // Cascade Gram Panchayats when Block changes
  useEffect(() => {
    if (!selectedBlockId) {
      setGramPanchayats([]);
      setSelectedGP('');
      setSelectedGPId('');
      return;
    }

    const matchedBlk = blocks.find(b => b.id === Number(selectedBlockId));
    if (matchedBlk && matchedBlk.lat && matchedBlk.lng) {
      setMapCenter([matchedBlk.lat, matchedBlk.lng]);
      setMapZoom(12);
    }

    const fetchGPs = async () => {
      try {
        const res = await api.get(`/location/gram-panchayats?block_id=${selectedBlockId}`);
        setGramPanchayats(res.data.gram_panchayats || []);
      } catch (err) {
        console.error('Failed fetching gram panchayats:', err);
      }
    };
    fetchGPs();
  }, [selectedBlockId, blocks]);

  // Main GIS Heatmap Fetching with Full Filter Query Params
  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDistrict) params.append('district', selectedDistrict);
      if (selectedDistrictId) params.append('district_id', selectedDistrictId);
      if (selectedSubdivision) params.append('subdivision', selectedSubdivision);
      if (selectedSubdivisionId) params.append('subdivision_id', selectedSubdivisionId);
      if (adminType === 'Urban') {
        if (selectedULB) params.append('municipality', selectedULB);
        if (selectedULBId) params.append('ulb_id', selectedULBId);
        if (selectedWard) params.append('ward', selectedWard);
      } else if (adminType === 'Rural') {
        if (selectedBlock) params.append('block', selectedBlock);
        if (selectedBlockId) params.append('block_id', selectedBlockId);
        if (selectedGP) params.append('gram_panchayat', selectedGP);
      }
      if (selectedPS) params.append('police_station', selectedPS);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedPriority !== 'All') params.append('priority', selectedPriority);
      if (viewType !== 'all') params.append('view_type', viewType);
      if (timeframe !== 'all') params.append('timeframe', timeframe);

      const res = await api.get(`/analytics/gis-heatmap?${params.toString()}`);
      const pts = res.data.points || [];
      setPoints(pts);
      setSummaryMeta({
        total: res.data.total_points || pts.length,
        crimeCount: pts.filter(p => p.is_crime).length,
        shieldedCount: res.data.crime_shielded_count || 0
      });

      if (res.data.center && res.data.center.lat && res.data.center.lng && selectedDistrict) {
        setMapCenter([res.data.center.lat, res.data.center.lng]);
        if (res.data.center.zoom) setMapZoom(res.data.center.zoom);
      }

      if (pts.length > 0) {
        setActiveInspectorPoint(pts[0]);
      } else {
        setActiveInspectorPoint(null);
      }
    } catch (err) {
      console.error('Heatmap query error:', err);
    } finally {
      setLoading(false);
    }
  }, [
    selectedDistrict,
    selectedDistrictId,
    selectedSubdivision,
    selectedSubdivisionId,
    adminType,
    selectedULB,
    selectedULBId,
    selectedWard,
    selectedBlock,
    selectedBlockId,
    selectedGP,
    selectedPS,
    selectedCategory,
    selectedPriority,
    viewType,
    timeframe
  ]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  const resetFilters = () => {
    setSelectedDistrict('');
    setSelectedDistrictId('');
    setSelectedSubdivision('');
    setSelectedSubdivisionId('');
    setAdminType('ALL');
    setSelectedULB('');
    setSelectedULBId('');
    setSelectedWard('');
    setSelectedBlock('');
    setSelectedBlockId('');
    setSelectedGP('');
    setSelectedGPId('');
    setSelectedPS('');
    setSelectedCategory('All');
    setSelectedPriority('All');
    setViewType('all');
    setMapCenter([22.5726, 88.3639]);
    setMapZoom(10);
  };

  const criticalCount = points.filter(p => p.priority === 'CRITICAL').length;
  const highCount = points.filter(p => p.priority === 'HIGH').length;
  const resolvedCount = points.filter(p => p.status === 'Resolved').length;

  const getHeatColor = (p) => {
    if (p.is_crime) return '#8b5cf6'; // Purple for law enforcement/crime
    if (p.priority === 'CRITICAL') return '#ef4444';
    if (p.priority === 'HIGH') return '#f97316';
    if (p.priority === 'MEDIUM') return '#eab308';
    return '#10b981';
  };

  return (
    <div className="page-wrapper">
      <div className="container">
        
        {/* Top Header & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-critical)' }}>
                <Flame size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.85rem', color: 'var(--text-primary)', margin: 0 }}>
                  West Bengal State GIS Incident Map
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                  <span style={{ 
                    background: 'rgba(59, 130, 246, 0.15)', 
                    color: 'var(--accent-cyan)', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.72rem', 
                    fontWeight: 700 
                  }}>
                    STATE: WEST BENGAL (23 DISTRICTS)
                  </span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    Urban Municipal & Rural Panchayat Real-Time Geospatial Intelligence
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={resetFilters}
              title="Reset all filters"
            >
              <RefreshCw size={14} /> Reset Filters
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentRoute('admin-dashboard')}
            >
              <ArrowLeft size={16} /> Back to Admin Portal
            </button>
          </div>
        </div>

        {/* Live Status & Privacy Shield Ribbon */}
        <div className="glass-card" style={{ 
          padding: '14px 22px', 
          marginBottom: '20px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          borderLeft: '4px solid var(--accent-primary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981' }} />
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Active Spatial Clusters: {points.length} Incident Vectors
              </strong>
              {selectedDistrict && (
                <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                  (Filtered: {selectedDistrict} {selectedULB ? `• ${selectedULB}` : selectedBlock ? `• ${selectedBlock}` : ''})
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.82rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-critical)', fontWeight: 700 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-critical)' }} />
              {criticalCount} Critical
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-high)', fontWeight: 700 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-high)' }} />
              {highCount} High
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-low)', fontWeight: 700 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-low)' }} />
              {resolvedCount} Resolved
            </span>
            {summaryMeta.crimeCount > 0 && (
              <span style={{ 
                background: 'rgba(139, 92, 246, 0.15)', 
                color: '#c084fc', 
                padding: '3px 10px', 
                borderRadius: 'var(--radius-full)', 
                fontWeight: 700, 
                fontSize: '0.76rem',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Shield size={12} /> {summaryMeta.crimeCount} Crime Stations Active
              </span>
            )}
          </div>
        </div>

        {/* Crime Privacy Warning Banner */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.82rem',
          color: '#cbd5e1'
        }}>
          <ShieldAlert size={18} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Public GIS Shielding Active:</strong> Sensitive crime incident locations are blurred to the nearest police station beat radius to safeguard citizen safety. Law enforcement and authorized administrators view full unmasked records.
          </span>
        </div>

        {/* Split View: Map + Filter & Detail Sidebar */}
        <div className="heatmap-split-grid">
          
          {/* Main Map View */}
          <div className="heatmap-map-container" style={{ 
            height: 'min(720px, 75vh)',
            minHeight: '300px',
            borderRadius: 'var(--radius-md)', 
            overflow: 'hidden', 
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-md)',
            position: 'relative'
          }}>
            <MapContainer 
              center={mapCenter} 
              zoom={mapZoom} 
              scrollWheelZoom={true}
              style={{ width: '100%', height: '100%' }}
            >
              <MapRecenter center={mapCenter} zoom={mapZoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {points.map(pt => (
                <React.Fragment key={pt.id}>
                  {/* Outer Intensity Halo */}
                  <Circle 
                    center={[pt.lat, pt.lng]}
                    radius={pt.priority === 'CRITICAL' ? 240 : 140}
                    pathOptions={{
                      color: getHeatColor(pt),
                      fillColor: getHeatColor(pt),
                      fillOpacity: pt.is_crime ? 0.3 : 0.22,
                      weight: 1
                    }}
                  />

                  {/* Core Interactive Marker */}
                  <CircleMarker 
                    center={[pt.lat, pt.lng]}
                    radius={pt.priority === 'CRITICAL' ? 9 : 7}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: getHeatColor(pt),
                      fillOpacity: 0.95,
                      weight: 2
                    }}
                    eventHandlers={{
                      click: () => setActiveInspectorPoint(pt)
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '240px', padding: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                            #{pt.tracking_id}
                          </span>
                          {pt.is_crime && (
                            <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a855f7', padding: '2px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                              🛡️ Law Enf.
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                          {pt.category} • {pt.priority}
                        </div>

                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0', lineHeight: 1.4 }}>
                          📍 {pt.municipality || pt.block || pt.district || 'West Bengal'}
                          {pt.ward && ` • Ward ${pt.ward}`}
                          {pt.gram_panchayat && ` • GP ${pt.gram_panchayat}`}
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '6px 0', fontWeight: 500 }}>
                          {pt.title}
                        </p>

                        {setSelectedComplaintId && (
                          <button 
                            className="btn btn-primary btn-sm"
                            style={{ width: '100%', marginTop: '6px', fontSize: '0.76rem' }}
                            onClick={() => {
                              setSelectedComplaintId(pt.id);
                              setCurrentRoute('complaint-details');
                            }}
                          >
                            Inspect Full Audit Trail
                          </button>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              ))}

              {/* Civic Problem Hotspot Clusters Layer (Pulsing Halo Circles) */}
              {showHotspots && hotspots.map((h, i) => (
                <React.Fragment key={`hotspot-${i}`}>
                  {/* Outer Pulsing Zone */}
                  <Circle
                    center={[h.latitude, h.longitude]}
                    radius={h.risk_level === 'CRITICAL' ? 1200 : 700}
                    pathOptions={{
                      color: h.badge_color || '#ef4444',
                      fillColor: h.badge_color || '#ef4444',
                      fillOpacity: 0.18,
                      weight: 2,
                      dashArray: '4, 6'
                    }}
                  />
                  {/* Inner Core Hotspot */}
                  <CircleMarker
                    center={[h.latitude, h.longitude]}
                    radius={13}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: h.badge_color || '#ef4444',
                      fillOpacity: 0.95,
                      weight: 3
                    }}
                  >
                    <Popup>
                      <div style={{ minWidth: '220px', padding: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, color: h.badge_color || '#ef4444', fontSize: '0.82rem' }}>
                            🔥 {h.risk_level} RISK HOTSPOT
                          </span>
                          <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.15)', color: h.badge_color, padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {h.total_complaints} Incidents
                          </span>
                        </div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block', marginBottom: '2px' }}>
                          📍 {h.area}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          {h.municipality} • {h.district}
                        </div>
                        <div style={{ fontSize: '0.8rem', background: 'var(--bg-surface)', padding: '6px 8px', borderRadius: '4px', marginBottom: '8px' }}>
                          Top Category: <strong style={{ color: 'var(--accent-cyan)' }}>{h.top_category}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                          ⚡ Action: {h.recommended_intervention}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              ))}
            </MapContainer>

            {/* Map Legend Overlay */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.72rem',
              color: '#e2e8f0',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>SPATIAL VECTOR LEGEND</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span>Critical Priority Vector</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316' }} />
                <span>High Priority Vector</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6' }} />
                <span>Crime / Law Enforcement Beat</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                <span>Medium / Low / Resolved</span>
              </div>
              {showHotspots && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', marginTop: '2px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px dashed #ef4444', background: 'rgba(239, 68, 68, 0.3)' }} />
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>Civic Problem Hotspot Halo</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Cascading Filters & Selected Point Inspector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: 'min(720px, 75vh)' }}>
            
            {/* Filter Control Box */}
            <Card style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={16} color="var(--accent-primary)" />
                  <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-primary)' }}>State GIS Filters</h3>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  {points.length} Results
                </span>
              </div>

              {/* View Type Toggle (Civic vs Crime) */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Sector View:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {[
                    { key: 'all', label: 'All Issues' },
                    { key: 'civic', label: 'Civic Only' },
                    { key: 'crime', label: 'Crime / Police' }
                  ].map(v => (
                    <button
                      key={v.key}
                      onClick={() => setViewType(v.key)}
                      className="btn btn-sm"
                      style={{
                        padding: '5px 4px',
                        fontSize: '0.72rem',
                        background: viewType === v.key ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                        color: viewType === v.key ? '#fff' : 'var(--text-secondary)',
                        border: viewType === v.key ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        borderRadius: '4px'
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeframe Filter (7 Days, 30 Days, 6 Months, All Time) */}
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Timeframe:</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temporal Filter</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {[
                    { key: 'all', label: 'All Time' },
                    { key: '7d', label: '7 Days' },
                    { key: '30d', label: '30 Days' },
                    { key: '6m', label: '6 Months' }
                  ].map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTimeframe(t.key)}
                      className="btn btn-sm"
                      style={{
                        padding: '4px 2px',
                        fontSize: '0.7rem',
                        fontWeight: timeframe === t.key ? 700 : 500,
                        background: timeframe === t.key ? 'var(--accent-cyan)' : 'var(--bg-surface-elevated)',
                        color: timeframe === t.key ? '#000' : 'var(--text-secondary)',
                        border: timeframe === t.key ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                        borderRadius: '4px'
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Civic Hotspot Overlay Toggle */}
              <div style={{ marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => setShowHotspots(!showHotspots)}
                  className="btn btn-sm"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 10px',
                    fontSize: '0.75rem',
                    background: showHotspots ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-surface-elevated)',
                    border: showHotspots ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                    color: showHotspots ? '#ef4444' : 'var(--text-muted)',
                    borderRadius: '6px'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Flame size={14} color={showHotspots ? '#ef4444' : 'var(--text-muted)'} />
                    {showHotspots ? 'Civic Hotspots Layer (Active)' : 'Civic Hotspots Layer (Hidden)'}
                  </span>
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    background: showHotspots ? '#ef4444' : 'var(--border-subtle)',
                    color: showHotspots ? '#fff' : 'var(--text-muted)',
                    fontWeight: 700
                  }}>
                    {hotspots.length}
                  </span>
                </button>
              </div>

              {/* 1. District Cascading Dropdown */}
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>West Bengal District:</label>
                <SearchableSelect 
                  options={districts.map(d => ({
                    value: String(d.id),
                    label: d.name,
                    secondary: `${d.division} Division • HQ: ${d.headquarters}`
                  }))}
                  value={selectedDistrictId}
                  onChange={(val, opt) => {
                    setSelectedDistrictId(val);
                    setSelectedDistrict(opt ? opt.label : '');
                  }}
                  placeholder="Select District (All 23)..."
                  storageKey="gis_recent_districts"
                />
              </div>

              {/* 2. Sub-Division Dropdown (Cascades from District) */}
              {selectedDistrictId && subdivisions.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Subdivision:</label>
                  <SearchableSelect 
                    options={subdivisions.map(s => ({
                      value: String(s.id),
                      label: s.name,
                      secondary: `Subdivision of ${selectedDistrict}`
                    }))}
                    value={selectedSubdivisionId}
                    onChange={(val, opt) => {
                      setSelectedSubdivisionId(val);
                      setSelectedSubdivision(opt ? opt.label : '');
                    }}
                    placeholder="All Subdivisions..."
                    storageKey="gis_recent_subdivisions"
                  />
                </div>
              )}

              {/* 3. Administrative Type (Urban / Rural / All) */}
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Local Body Category:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {[
                    { key: 'ALL', label: 'All Bodies' },
                    { key: 'Urban', label: 'Urban (ULB)' },
                    { key: 'Rural', label: 'Rural (Panchayat)' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setAdminType(tab.key)}
                      className="btn btn-sm"
                      style={{
                        padding: '5px 4px',
                        fontSize: '0.72rem',
                        background: adminType === tab.key ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                        color: adminType === tab.key ? '#fff' : 'var(--text-secondary)',
                        border: adminType === tab.key ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        borderRadius: '4px'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4A. Urban Hierarchy: Municipality/Corporation & Ward */}
              {(adminType === 'Urban' || adminType === 'ALL') && ulbs.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Municipality / ULB:</label>
                  <SearchableSelect 
                    options={ulbs.map(u => ({
                      value: String(u.id),
                      label: u.name,
                      secondary: `${u.type} • ${u.wards_count || 0} Wards`
                    }))}
                    value={selectedULBId}
                    onChange={(val, opt) => {
                      setSelectedULBId(val);
                      setSelectedULB(opt ? opt.label : '');
                    }}
                    placeholder="Select ULB..."
                    storageKey="gis_recent_ulbs"
                  />
                </div>
              )}

              {selectedULBId && wards.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Ward:</label>
                  <SearchableSelect 
                    options={wards.map(w => ({
                      value: w.ward_name,
                      label: w.ward_name,
                      secondary: `Ward in ${selectedULB}`
                    }))}
                    value={selectedWard}
                    onChange={(val) => setSelectedWard(val)}
                    placeholder="All Wards..."
                    storageKey="gis_recent_wards"
                  />
                </div>
              )}

              {/* 4B. Rural Hierarchy: CD Block & Gram Panchayat */}
              {(adminType === 'Rural' || adminType === 'ALL') && blocks.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>CD Block:</label>
                  <SearchableSelect 
                    options={blocks.map(b => ({
                      value: String(b.id),
                      label: b.name,
                      secondary: `Block HQ: ${b.headquarters || 'N/A'}`
                    }))}
                    value={selectedBlockId}
                    onChange={(val, opt) => {
                      setSelectedBlockId(val);
                      setSelectedBlock(opt ? opt.label : '');
                    }}
                    placeholder="Select CD Block..."
                    storageKey="gis_recent_blocks"
                  />
                </div>
              )}

              {selectedBlockId && gramPanchayats.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>Gram Panchayat:</label>
                  <SearchableSelect 
                    options={gramPanchayats.map(g => ({
                      value: String(g.id),
                      label: g.name,
                      secondary: `GP in ${selectedBlock}`
                    }))}
                    value={selectedGPId}
                    onChange={(val, opt) => {
                      setSelectedGPId(val);
                      setSelectedGP(opt ? opt.label : '');
                    }}
                    placeholder="All Gram Panchayats..."
                    storageKey="gis_recent_gps"
                  />
                </div>
              )}

              {/* 5. Police Station Jurisdiction Filter */}
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Police Station Jurisdiction:</label>
                <SearchableSelect 
                  options={policeStations.map(p => ({
                    value: p.name,
                    label: p.name,
                    secondary: p.commissionerate || 'District Police'
                  }))}
                  value={selectedPS}
                  onChange={(val) => setSelectedPS(val)}
                  placeholder="All Police Stations..."
                  storageKey="gis_recent_ps"
                />
              </div>

              {/* 6. Priority Filter */}
              <div style={{ marginBottom: '12px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Priority:</label>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                    <button
                      key={p}
                      onClick={() => setSelectedPriority(p)}
                      className="btn btn-sm"
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.72rem',
                        background: selectedPriority === p ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                        color: selectedPriority === p ? '#fff' : 'var(--text-secondary)',
                        border: selectedPriority === p ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Category Filter */}
              <div style={{ marginBottom: '6px' }}>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Category:</label>
                <select 
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                >
                  <option value="All">All Categories</option>
                  {[
                    'Road Damage', 
                    'Garbage & Waste', 
                    'Streetlight', 
                    'Water Supply', 
                    'Drainage & Sewage', 
                    'Electricity', 
                    'Traffic & Signals',
                    'Police & Law Enforcement',
                    'Cyber Crime',
                    'Women & Child Safety'
                  ].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </Card>

            {/* Selected Incident Quick-Inspector */}
            {activeInspectorPoint ? (
              <Card style={{ padding: '18px', borderLeft: `4px solid ${getHeatColor(activeInspectorPoint)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    #{activeInspectorPoint.tracking_id}
                  </span>
                  <Badge variant={activeInspectorPoint.priority}>
                    {activeInspectorPoint.priority}
                  </Badge>
                </div>

                <h4 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {activeInspectorPoint.title}
                </h4>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} color="var(--accent-primary)" />
                    <span>
                      {activeInspectorPoint.district || 'West Bengal'}
                      {activeInspectorPoint.subdivision && ` • ${activeInspectorPoint.subdivision} Subdiv`}
                    </span>
                  </div>
                  <div style={{ paddingLeft: '18px', color: 'var(--text-muted)' }}>
                    {activeInspectorPoint.municipality ? (
                      <span>🏛️ ULB: {activeInspectorPoint.municipality} {activeInspectorPoint.ward ? `(Ward: ${activeInspectorPoint.ward})` : ''}</span>
                    ) : activeInspectorPoint.block ? (
                      <span>🌾 Block: {activeInspectorPoint.block} {activeInspectorPoint.gram_panchayat ? `(GP: ${activeInspectorPoint.gram_panchayat})` : ''}</span>
                    ) : null}
                  </div>
                  {activeInspectorPoint.police_station && (
                    <div style={{ paddingLeft: '18px', color: '#c084fc', fontSize: '0.74rem' }}>
                      🚓 PS: {activeInspectorPoint.police_station}
                    </div>
                  )}
                  <div style={{ paddingLeft: '18px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Coords: {activeInspectorPoint.lat.toFixed(4)}, {activeInspectorPoint.lng.toFixed(4)}
                  </div>
                </div>

                <div style={{ 
                  background: 'var(--bg-surface-elevated)', 
                  padding: '8px 12px', 
                  borderRadius: 'var(--radius-sm)', 
                  marginBottom: '12px',
                  fontSize: '0.76rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Category:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{activeInspectorPoint.category}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                    <strong style={{ color: 'var(--accent-cyan)' }}>{activeInspectorPoint.status || 'Active'}</strong>
                  </div>
                </div>

                {setSelectedComplaintId && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', fontSize: '0.8rem' }}
                    onClick={() => {
                      setSelectedComplaintId(activeInspectorPoint.id);
                      setCurrentRoute('complaint-details');
                    }}
                  >
                    <Eye size={13} /> Open Full Details & Timeline
                  </button>
                )}
              </Card>
            ) : null}

          </div>
        </div>

      </div>
    </div>
  );
}
