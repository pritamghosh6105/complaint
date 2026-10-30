import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Crosshair, ZoomIn, ZoomOut } from 'lucide-react';
import UserGpsMarker from '../maps/UserGpsMarker';

// Custom glowing pin icon for incident marking
const incidentPinIcon = L.divIcon({
  html: `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        position: absolute;
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        background: linear-gradient(135deg, #ef4444, #b91c1c);
        transform: rotate(-45deg);
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 16px rgba(239, 68, 68, 0.8), 0 4px 10px rgba(0,0,0,0.5);
      "></div>
      <div style="
        position: absolute;
        width: 8px;
        height: 8px;
        background: #ffffff;
        border-radius: 50%;
        top: 8px;
        box-shadow: 0 0 4px rgba(0,0,0,0.4);
      "></div>
      <div style="
        position: absolute;
        bottom: -4px;
        width: 14px;
        height: 4px;
        background: rgba(0, 0, 0, 0.35);
        border-radius: 50%;
        filter: blur(1.5px);
      "></div>
    </div>
  `,
  className: 'incident-pin-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Map click & pan synchronization
function MapEventsHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));
      onSelect(lat, lng);
    }
  });
  return null;
}

// Controller component to smoothly pan when coords update externally
function MapCenterController({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.panTo([lat, lng], { animate: true, duration: 0.8 });
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationMapPicker({
  lat = 22.5726,
  lng = 88.3639,
  userGpsLocation = null,
  onLocationChange,
  height = '240px',
  zoom = 13,
  readOnly = false,
  districtCentroid = null
}) {
  const markerRef = useRef(null);

  // Drag handler for precise pin placement
  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker && onLocationChange && !readOnly) {
        const { lat: newLat, lng: newLng } = marker.getLatLng();
        onLocationChange(parseFloat(newLat.toFixed(6)), parseFloat(newLng.toFixed(6)));
      }
    }
  };

  const safeLat = typeof lat === 'number' && !isNaN(lat) ? lat : 22.5726;
  const safeLng = typeof lng === 'number' && !isNaN(lng) ? lng : 88.3639;

  return (
    <div style={{
      width: '100%',
      height,
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(56, 189, 248, 0.25)',
      position: 'relative',
      boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.4)'
    }}>
      <MapContainer
        center={[safeLat, safeLng]}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapCenterController lat={safeLat} lng={safeLng} />
        
        {!readOnly && (
          <MapEventsHandler
            onSelect={(newLat, newLng) => {
              if (onLocationChange) onLocationChange(newLat, newLng);
            }}
          />
        )}

        {/* Exact GPS Blue Dot of User's Current Location */}
        {userGpsLocation && (
          <UserGpsMarker
            position={[userGpsLocation.lat, userGpsLocation.lng]}
            accuracy={userGpsLocation.accuracy}
            showAccuracyCircle={true}
            label="Your Exact Location"
          />
        )}

        <Marker
          position={[safeLat, safeLng]}
          icon={incidentPinIcon}
          draggable={!readOnly}
          eventHandlers={eventHandlers}
          ref={markerRef}
        />
      </MapContainer>

      {/* Floating map controls badge */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        padding: '4px 10px',
        fontSize: '0.72rem',
        color: '#94a3b8',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'none'
      }}>
        <Crosshair size={12} color="#38bdf8" />
        <span>{readOnly ? 'Fixed Location' : 'Drag pin or click map to pinpoint'}</span>
      </div>
    </div>
  );
}
