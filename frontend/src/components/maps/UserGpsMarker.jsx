import React from 'react';
import { Marker, Circle, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * High-precision, glowing GPS Blue Dot Leaflet Icon
 * Styled in the industry-standard navigation aesthetic (Google Maps / Apple Maps / Mapbox)
 */
export const userGpsBlueDotIcon = L.divIcon({
  html: `
    <div class="user-gps-blue-dot-container" style="
      position: relative;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <!-- Pulsing Outer Ripple -->
      <div class="gps-blue-dot-pulse-ring"></div>
      
      <!-- Middle Glow Aura -->
      <div style="
        position: absolute;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.28);
        box-shadow: 0 0 12px rgba(37, 99, 235, 0.7);
        pointer-events: none;
      "></div>

      <!-- Core Deep Blue Dot with White Border -->
      <div class="gps-blue-dot-core" style="
        position: relative;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 35%, #93c5fd 0%, #3b82f6 38%, #1d4ed8 75%, #1e40af 100%);
        border: 2.5px solid #ffffff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.45), 0 0 14px rgba(37, 99, 235, 0.95);
        z-index: 2;
      "></div>
    </div>
  `,
  className: 'user-gps-blue-dot-marker',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17]
});

/**
 * Reusable User GPS Blue Dot Marker with Accuracy Circle
 */
export default function UserGpsMarker({ 
  position, 
  accuracy = 25, 
  showAccuracyCircle = true,
  label = 'Your Exact Location'
}) {
  if (!position || isNaN(position[0]) || isNaN(position[1])) return null;

  const lat = position[0];
  const lng = position[1];
  const safeAccuracy = Math.min(Math.max(Number(accuracy) || 20, 10), 1500);

  return (
    <React.Fragment>
      {/* Accuracy Radius Halo */}
      {showAccuracyCircle && (
        <Circle
          center={[lat, lng]}
          radius={safeAccuracy}
          pathOptions={{
            color: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.12,
            weight: 1.5,
            dashArray: '5, 5'
          }}
        />
      )}

      {/* Pulsing Exact Blue Dot */}
      <Marker
        position={[lat, lng]}
        icon={userGpsBlueDotIcon}
        zIndexOffset={1200}
      >
        <Tooltip direction="top" offset={[0, -16]} permanent={false} opacity={0.95}>
          <div style={{
            padding: '3px 6px',
            textAlign: 'center',
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '0.78rem',
            lineHeight: 1.3
          }}>
            <div style={{ fontWeight: 700, color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#2563eb',
                boxShadow: '0 0 6px #2563eb',
                display: 'inline-block'
              }}></span>
              {label}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
              Exact GPS • Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
              {safeAccuracy > 0 && ` (±${Math.round(safeAccuracy)}m)`}
            </div>
          </div>
        </Tooltip>

        <Popup>
          <div style={{ minWidth: '180px', padding: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#2563eb',
                boxShadow: '0 0 8px #2563eb',
                display: 'inline-block'
              }}></span>
              <strong style={{ color: '#1e3a8a', fontSize: '0.88rem' }}>Your Exact Location</strong>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#475569', lineHeight: 1.5 }}>
              <div><strong>Latitude:</strong> {lat.toFixed(6)}</div>
              <div><strong>Longitude:</strong> {lng.toFixed(6)}</div>
              <div><strong>GPS Accuracy:</strong> ~{Math.round(safeAccuracy)} meters</div>
            </div>
          </div>
        </Popup>
      </Marker>
    </React.Fragment>
  );
}
