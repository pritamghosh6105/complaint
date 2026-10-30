import React, { useState, useEffect } from 'react';
import { MapContainer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Eye, AlertTriangle, Clock, Search, Navigation, Layers, Flame, MapPin, Maximize2, Minimize2, Filter } from 'lucide-react';
import { MapAutoInvalidate, FastTileLayer, MapLayerSwitcher, getSavedProviderId } from './MapConfig';
import UserGpsMarker from './UserGpsMarker';

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
  const [gpsLocation, setGpsLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  const handleGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = pos.coords.accuracy || 20;
        setGpsLocation({ lat, lng, accuracy });
        map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
      },
      (err) => {
        setLocating(false);
        alert('Could not retrieve your exact GPS location. Please ensure location access is allowed in your browser.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  return (
    <>
      {/* Exact Blue Dot of User's Current GPS Location */}
      {gpsLocation && (
        <UserGpsMarker
          position={[gpsLocation.lat, gpsLocation.lng]}
          accuracy={gpsLocation.accuracy}
          showAccuracyCircle={true}
          label="Your Exact Location"
        />
      )}

      <button
        type="button"
        onClick={handleGPS}
        className="btn btn-sm btn-secondary"
        title="Show dot of my exact location in blue"
        disabled={locating}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          padding: '8px 14px',
          background: gpsLocation ? 'rgba(37, 99, 235, 0.2)' : 'var(--bg-glass)',
          border: gpsLocation ? '1.5px solid #2563eb' : '1px solid var(--border-subtle)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: gpsLocation ? '#38bdf8' : 'var(--text-primary)',
          cursor: locating ? 'not-allowed' : 'pointer',
          borderRadius: '10px',
          transition: 'all 0.25s ease'
        }}
      >
        <Navigation 
          size={14} 
          color={gpsLocation ? '#38bdf8' : 'var(--accent-primary)'} 
          style={{ animation: locating ? 'spin 1s linear infinite' : 'none' }}
        />
        <span>{locating ? 'Locating...' : gpsLocation ? '📍 My GPS (Blue Dot Active)' : 'My GPS'}</span>
      </button>
    </>
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
  const [currentProvider, setCurrentProvider] = useState(getSavedProviderId());
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
      
      <MapLayerSwitcher 
        currentProvider={currentProvider} 
        onProviderChange={setCurrentProvider} 
      />

      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <MapAutoInvalidate extraDep={isExpanded} />
        <FastTileLayer providerId={currentProvider} />

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
                        comp.priority === 'CRITICAL' ? 'badge-critical' : comp.priority === 'HIGH' ? 'badge-high' : comp.priority === 'LOW' ? 'badge-low' : 'badge-medium'
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
                      border: '1px solid var(--border-subtle)',
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
                        <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                        <span style={{ color: comp.status === 'Resolved' ? 'var(--status-low)' : 'var(--accent-primary)', fontWeight: 600 }}>
                          {comp.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>District:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{comp.district || comp.location?.district || 'West Bengal'}</span>
                      </div>
                      {(comp.police_station || comp.policeStation || comp.location?.policeStation) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Police Station:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{comp.police_station || comp.policeStation || comp.location?.policeStation}</span>
                        </div>
                      )}
                      {(comp.pincode || comp.postal_code || comp.location?.pincode) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Pincode:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{comp.pincode || comp.postal_code || comp.location?.pincode}</span>
                        </div>
                      )}
                      {comp.ward && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Ward:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{comp.ward}</span>
                        </div>
                      )}
                      {comp.created_at && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Date:</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{new Date(comp.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Short Description */}
                    {comp.description && (
                      <p style={{ 
                        fontSize: '0.78rem', 
                        color: 'var(--text-secondary)', 
                        margin: '6px 0 8px', 
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {comp.description}
                      </p>
                    )}

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
