import React, { useState, useEffect } from 'react';
import { MapContainer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Navigation, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import { MapAutoInvalidate, FastTileLayer, getSavedProviderId } from './MapConfig';
import UserGpsMarker from './UserGpsMarker';

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
    async click(e) {
      const lat = parseFloat(e.latlng.lat.toFixed(5));
      const lng = parseFloat(e.latlng.lng.toFixed(5));
      onLocationSelect(lat, lng);
    }
  });
  return null;
}

function MapPanController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, Math.max(map.getZoom(), 15), { duration: 1.0 });
    }
  }, [center, map]);
  return null;
}

export default function LocationPicker({ latitude, longitude, onLocationChange }) {
  const [loadingGps, setLoadingGps] = useState(false);
  const [detectedLocality, setDetectedLocality] = useState('');
  const [userGps, setUserGps] = useState(null);

  const fetchLocality = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`, {
        headers: { 'Accept-Language': 'en' }
      });
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const localName = addr.village || addr.suburb || addr.town || addr.neighbourhood || addr.city_district || addr.hamlet || addr.county || '';
        if (localName) {
          setDetectedLocality(localName);
        }
        return { locality: localName, displayName: data.display_name };
      }
    } catch (e) {
      // ignore network errors for geocoding
    }
    return null;
  };

  const handleSelectPoint = async (lat, lng) => {
    const geo = await fetchLocality(lat, lng);
    onLocationChange(lat, lng, geo);
  };

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      setLoadingGps(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setLoadingGps(false);
          const lat = parseFloat(position.coords.latitude.toFixed(5));
          const lng = parseFloat(position.coords.longitude.toFixed(5));
          const accuracy = position.coords.accuracy || 20;
          setUserGps({ lat, lng, accuracy });
          await handleSelectPoint(lat, lng);
        },
        (error) => {
          setLoadingGps(false);
          alert('GPS permission was denied or unavailable. You can click anywhere on the map to set the location pin.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const center = [latitude || 22.7000, longitude || 88.4000];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={16} color="var(--accent-primary)" /> Pin Incident Location on Map:
        </label>
        <button 
          type="button"
          onClick={handleUseGPS}
          className="btn btn-secondary btn-sm"
          disabled={loadingGps}
          style={{ 
            fontSize: '0.8rem', 
            padding: '5px 12px', 
            borderRadius: '10px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px',
            background: userGps ? 'rgba(37, 99, 235, 0.2)' : undefined,
            borderColor: userGps ? '#2563eb' : undefined,
            color: userGps ? '#38bdf8' : undefined
          }}
          title="Detect device GPS coordinates and display exact location as a blue dot"
        >
          <Navigation size={13} className={loadingGps ? 'animate-spin' : ''} /> 
          {loadingGps ? 'Detecting GPS...' : userGps ? '📍 GPS Blue Dot Active' : 'Use My GPS'}
        </button>
      </div>

      <div style={{ height: '240px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', position: 'relative' }}>
        <MapContainer 
          center={center} 
          zoom={12} 
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%' }}
        >
          <MapAutoInvalidate />
          <FastTileLayer providerId={getSavedProviderId()} />
          <MapPanController center={userGps ? [userGps.lat, userGps.lng] : center} />
          <MapClickHandler onLocationSelect={handleSelectPoint} />

          {/* Exact GPS Blue Dot of User Location */}
          {userGps && (
            <UserGpsMarker
              position={[userGps.lat, userGps.lng]}
              accuracy={userGps.accuracy}
              showAccuracyCircle={true}
              label="Your Exact Location"
            />
          )}

          {latitude && longitude && (
            <Marker position={[latitude, longitude]} icon={pinIcon} />
          )}
        </MapContainer>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>Lat: <strong style={{ color: 'var(--text-primary)' }}>{latitude ? latitude.toFixed(4) : '22.7000'}</strong></span>
          <span>Lng: <strong style={{ color: 'var(--text-primary)' }}>{longitude ? longitude.toFixed(4) : '88.4000'}</strong></span>
        </div>

        {detectedLocality && (
          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px', 
            color: '#38bdf8', 
            background: 'rgba(56, 189, 248, 0.12)', 
            padding: '2px 8px', 
            borderRadius: '6px',
            fontWeight: 700 
          }}>
            <Sparkles size={12} /> Detected: {detectedLocality}
          </span>
        )}

        <span style={{ color: 'var(--accent-cyan)' }}>*Click anywhere on map to move pin</span>
      </div>
    </div>
  );
}
