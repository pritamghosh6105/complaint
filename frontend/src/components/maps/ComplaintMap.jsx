import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Eye, AlertTriangle, Clock, Search, Navigation, Layers, Flame, MapPin, Maximize2, Minimize2, Filter } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;

const createCustomIcon = (priority, status) => {
  let color = '#3b82f6';
  if (status === 'Resolved') color = '#10b981';
  else if (priority === 'CRITICAL') color = '#ef4444';
  else if (priority === 'HIGH') color = '#f97316';
  else if (priority === 'MEDIUM') color = '#eab308';
  else color = '#10b981';

  const isCritical = priority === 'CRITICAL' && status !== 'Resolved';

  const svgHtml = `
    <div style="
      background-color: ${color};
      width: ${isCritical ? '32px' : '26px'};
      height: ${isCritical ? '32px' : '26px'};
      border-radius: 50%;
      border: 3px solid #ffffff;
      box-shadow: 0 0 ${isCritical ? '18px #ef4444' : '10px rgba(0,0,0,0.3)'};
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      animation: ${isCritical ? 'pulseGlow 1.5s infinite ease-in-out' : 'none'};
    ">
      <div style="width: 7px; height: 7px; background: white; border-radius: 50%;"></div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

function LocationCenterButton() {
  const map = useMap();
  const handleGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
        () => alert('GPS position unavailable.')
      );
    }
  };

  return (
    <button
      onClick={handleGPS}
      className="btn btn-sm btn-secondary"
      title="Center to my current location"
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 500,
        boxShadow: 'var(--shadow-lg)',
        padding: '8px 12px',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.78rem'
      }}
    >
      <Navigation size={14} color="var(--accent-primary)" />
      <span>My GPS</span>
    </button>
  );
}

function MapResizeHandler({ isExpanded }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [isExpanded, map]);
  return null;
}

export default function ComplaintMap({ complaints = [], onSelectComplaint, center = [22.9750, 88.4340], zoom = 13, height = '680px' }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedWard, setSelectedWard] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHalos, setShowHalos] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = ['All', ...new Set(complaints.map(c => c.category).filter(Boolean))];
  const priorities = ['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const wards = ['All', ...new Set(complaints.map(c => c.ward).filter(Boolean))];

  const filtered = complaints.filter(c => {
    if (!c.latitude || !c.longitude || Math.abs(c.latitude) < 0.1) return false;
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (selectedPriority !== 'All' && c.priority !== selectedPriority) return false;
    if (selectedWard !== 'All' && c.ward !== selectedWard) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (c.title || '').toLowerCase().includes(q) ||
        (c.tracking_id || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.ward || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeFilterCount = (selectedCategory !== 'All' ? 1 : 0) + (selectedPriority !== 'All' ? 1 : 0) + (selectedWard !== 'All' ? 1 : 0);

  return (
    <div style={{
      position: isExpanded ? 'fixed' : 'relative',
      top: isExpanded ? 0 : 'auto',
      left: isExpanded ? 0 : 'auto',
      right: isExpanded ? 0 : 'auto',
      bottom: isExpanded ? 0 : 'auto',
      width: isExpanded ? '100vw' : '100%',
      height: isExpanded ? '100vh' : height,
      zIndex: isExpanded ? 9999 : 1,
      borderRadius: isExpanded ? 0 : 'var(--radius-md)',
      overflow: 'hidden',
      border: isExpanded ? 'none' : '1px solid var(--border-subtle)',
      boxShadow: isExpanded ? '0 25px 50px -12px rgba(0, 0, 0, 0.85)' : 'var(--shadow-md)',
      transition: 'height 0.3s ease, border-radius 0.3s ease'
    }}>
      
      {/* Top Filter & Search Bar Overlay */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        zIndex: 500,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Search Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '120px' }}>
            <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search map by title, ID, or ward..."
              style={{ padding: '6px 10px', fontSize: '0.82rem', height: '34px', width: '100%' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className={`btn btn-sm ${mobileFiltersOpen || activeFilterCount > 0 ? 'btn-primary' : 'btn-secondary'} mobile-only`}
            style={{ padding: '4px 10px', fontSize: '0.78rem', height: '34px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title="Toggle Filter Options"
          >
            <Filter size={13} />
            <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`btn btn-sm ${isExpanded ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem', height: '34px', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}
            title={isExpanded ? "Collapse Map" : "Maximize / Fullscreen Map"}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span className="desktop-only">{isExpanded ? 'Exit Fullscreen' : 'Maximize'}</span>
          </button>
        </div>

        {/* Dropdown Filters (Always visible on desktop, toggled on mobile) */}
        <div 
          className={mobileFiltersOpen ? 'flex-mobile-show' : 'desktop-only'}
          style={{ 
            display: mobileFiltersOpen ? 'flex' : undefined,
            gap: '8px', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            paddingTop: mobileFiltersOpen ? '6px' : '0',
            borderTop: mobileFiltersOpen ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
          }}
        >
          <select 
            className="form-select" 
            style={{ padding: '5px 8px', fontSize: '0.78rem', width: 'auto', flexGrow: 1, minWidth: '130px', height: '34px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>)}
          </select>

          <select 
            className="form-select" 
            style={{ padding: '5px 8px', fontSize: '0.78rem', width: 'auto', flexGrow: 1, minWidth: '120px', height: '34px' }}
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            {priorities.map(p => <option key={p} value={p}>{p === 'All' ? 'All Priorities' : p}</option>)}
          </select>

          <select 
            className="form-select" 
            style={{ padding: '5px 8px', fontSize: '0.78rem', width: 'auto', flexGrow: 1, minWidth: '110px', height: '34px' }}
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
          >
            {wards.map(w => <option key={w} value={w}>{w === 'All' ? 'All Wards' : w}</option>)}
          </select>

          <button
            onClick={() => setShowHalos(!showHalos)}
            className={`btn btn-sm ${showHalos ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem', height: '34px' }}
            title="Toggle Hotspot Density Halos"
          >
            <Flame size={13} /> {showHalos ? 'Hotspots On' : 'Hotspots Off'}
          </button>
        </div>
      </div>

      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <MapResizeHandler isExpanded={isExpanded} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationCenterButton />

        {filtered.map(comp => {
          const isCritical = comp.priority === 'CRITICAL' && comp.status !== 'Resolved';
          const isResolved = comp.status === 'Resolved';
          const haloColor = isResolved ? '#10b981' : isCritical ? '#ef4444' : comp.priority === 'HIGH' ? '#f97316' : '#eab308';

          return (
            <React.Fragment key={comp.id || comp.tracking_id}>
              {/* Optional Hotspot Halo */}
              {showHalos && (
                <Circle 
                  center={[comp.latitude, comp.longitude]}
                  radius={isCritical ? 180 : 100}
                  pathOptions={{
                    color: haloColor,
                    fillColor: haloColor,
                    fillOpacity: 0.18,
                    weight: 1
                  }}
                />
              )}

              <Marker 
                position={[comp.latitude, comp.longitude]}
                icon={createCustomIcon(comp.priority, comp.status)}
              >
                <Popup>
                  <div style={{ minWidth: '240px', padding: '4px' }}>
                    {/* Header: Tracking ID + Priority */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 700, 
                        color: 'var(--accent-cyan)', 
                        fontSize: '0.8rem',
                        background: 'rgba(6, 182, 212, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        #{comp.tracking_id || `CMP-${comp.id}`}
                      </span>
                      <span className={`badge ${
                        comp.priority === 'CRITICAL' ? 'badge-critical' : comp.priority === 'HIGH' ? 'badge-high' : 'badge-medium'
                      }`}>
                        {comp.priority}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.96rem', fontWeight: 700, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
                      {comp.title || comp.category}
                    </h4>

                    {/* Metadata Grid */}
                    <div style={{ 
                      background: 'var(--bg-surface-elevated)', 
                      padding: '8px 10px', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.78rem',
                      marginBottom: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Category:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{comp.category}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Ward:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{comp.ward || 'General'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                        <span style={{ color: comp.status === 'Resolved' ? 'var(--status-low)' : 'var(--accent-primary)', fontWeight: 600 }}>
                          {comp.status}
                        </span>
                      </div>
                      {comp.created_at && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Reported:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{new Date(comp.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {comp.image_url && (
                      <img 
                        src={comp.image_url} 
                        alt="Evidence" 
                        style={{ width: '100%', height: '85px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }} 
                      />
                    )}

                    {onSelectComplaint && (
                      <button 
                        className="btn btn-primary btn-sm" 
                        style={{ width: '100%', marginTop: '4px', fontSize: '0.8rem' }}
                        onClick={() => onSelectComplaint(comp)}
                      >
                        <Eye size={13} /> View Full Audit Stepper
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
