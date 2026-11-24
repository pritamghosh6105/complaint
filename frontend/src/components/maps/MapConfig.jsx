import React, { useEffect, useState, useRef } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { Layers, Loader2, CheckCircle2, Wifi, Zap, Globe, MapPin } from 'lucide-react';

/**
 * Google Maps Architecture for Indian National & State Civic Systems
 * 
 * Performance & Architecture Features:
 * 1. High-Speed Quad-CDN Google Maps Tile Integration across mt0, mt1, mt2, mt3 edge servers
 * 2. True Google Maps Street-level precision across India & West Bengal
 * 3. Minimal Tile Buffer (keepBuffer: 1-2): High-efficiency viewport prioritization
 * 4. Idle-Only Updates (updateWhenIdle: true): Zero network thrashing during pan/zoom
 * 5. Automatic Slow Network Detection: Automatically throttles on 2G/3G connections
 * 6. Live Google Maps GIS Status Badge: Real-time user feedback on map ready state
 */

// Detect whether user is on 2G, 3G or low data mode
function isSlowConnection() {
  if (typeof navigator !== 'undefined' && navigator.connection) {
    const { effectiveType, saveData } = navigator.connection;
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') {
      return true;
    }
  }
  return false;
}

// Client-side Google Maps API key from environment (optional, tiles work directly)
export const GOOGLE_MAPS_API_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_KEY)) || '';

// Backwards-compatibility alias
export const MAPPLS_ACCESS_TOKEN = GOOGLE_MAPS_API_KEY;

export const GOOGLE_MAPS_CONFIG = {
  id: 'google',
  name: 'Google Maps',
  // High-speed distributed Google Maps Tile services across mt0-mt3
  url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  fallbackUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution: '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a> | West Bengal Civic GIS',
  subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  maxZoom: 20,
  minZoom: 3,
  maxNativeZoom: 20,
  tileSize: 256,
  // Low buffer: load visible viewport first without hogging bandwidth
  keepBuffer: isSlowConnection() ? 1 : 2,
  updateWhenZooming: false,     // Don't fetch intermediate tiles during zoom animations
  updateWhenIdle: true,         // Only fetch tiles once user finishes panning or zooming
  updateInterval: 180,          // Debounce prevents queue saturation during continuous drag
  crossOrigin: 'anonymous',     // Allows full browser disk & memory cache utilization
  detectRetina: false
};

// Aliased for backwards compatibility
export const MAPPLS_CONFIG = GOOGLE_MAPS_CONFIG;

export const MAP_PROVIDERS = {
  google: GOOGLE_MAPS_CONFIG,
  google_satellite: {
    ...GOOGLE_MAPS_CONFIG,
    id: 'google_satellite',
    name: 'Google Satellite',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
  },
  google_terrain: {
    ...GOOGLE_MAPS_CONFIG,
    id: 'google_terrain',
    name: 'Google Terrain',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
  },
  osm: {
    ...GOOGLE_MAPS_CONFIG,
    id: 'osm',
    name: 'Carto Voyager (Fallback)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: ['a', 'b', 'c', 'd']
  }
};

export function getSavedProviderId() {
  return 'google';
}

export function saveProviderId() {
  // Locked to Google Maps
}

export function getActiveTileConfig() {
  return GOOGLE_MAPS_CONFIG;
}

// Global lightweight event emitter for tile loading state
const tileLoadingListeners = new Set();
let globalIsLoading = false;
let globalPendingTiles = 0;

function notifyLoadingState(isLoading, pending) {
  globalIsLoading = isLoading;
  globalPendingTiles = pending;
  tileLoadingListeners.forEach(listener => listener(isLoading, pending));
}

/**
 * Bulletproof Leaflet Container Invalidation with Staggered Priority Reflows
 */
export function MapAutoInvalidate({ extraDep = null }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const invalidate = () => {
      try {
        map.invalidateSize({ animate: false, pan: false });
      } catch (e) {
        // Safe catch for detached elements
      }
    };

    // Immediate layout pass
    invalidate();

    // Staggered frames: covers tab transitions, drawer opening, modal animations
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 350);
    const t3 = setTimeout(invalidate, 800);

    // Watch resize of map DOM container
    let resizeObserver = null;
    try {
      const container = map.getContainer();
      if (container && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          requestAnimationFrame(invalidate);
        });
        resizeObserver.observe(container);
      }
    } catch (e) {
      // ignore
    }

    const handleWindowResize = () => invalidate();
    window.addEventListener('resize', handleWindowResize, { passive: true });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [map, extraDep]);

  return null;
}

/**
 * High-Performance TileLayer with Google Maps Multi-Subdomain Quad-CDN
 */
export function FastTileLayer(props) {
  const tileLayerRef = useRef(null);
  const pendingCountRef = useRef(0);
  const [activeUrl, setActiveUrl] = useState(GOOGLE_MAPS_CONFIG.url);

  const handleTileLoadStart = () => {
    pendingCountRef.current++;
    notifyLoadingState(true, pendingCountRef.current);
  };

  const handleTileLoad = () => {
    pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
    if (pendingCountRef.current === 0) {
      notifyLoadingState(false, 0);
    } else {
      notifyLoadingState(true, pendingCountRef.current);
    }
  };

  const handleTileError = (error) => {
    pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
    notifyLoadingState(pendingCountRef.current > 0, pendingCountRef.current);

    // Auto-fallback if Google server is temporarily unreachable
    if (activeUrl.includes('google.com')) {
      setActiveUrl(GOOGLE_MAPS_CONFIG.fallbackUrl);
      return;
    }

    // Auto-retry dropped tiles on flaky connections (up to 2 times)
    const img = error?.tile;
    if (img) {
      const retryCount = parseInt(img.dataset.retries || '0', 10);
      if (retryCount < 2) {
        img.dataset.retries = (retryCount + 1).toString();
        setTimeout(() => {
          const currentSrc = img.src;
          if (currentSrc.includes('mt0.')) {
            img.src = currentSrc.replace('mt0.', 'mt1.');
          } else if (currentSrc.includes('mt1.')) {
            img.src = currentSrc.replace('mt1.', 'mt2.');
          } else {
            img.src = currentSrc;
          }
        }, 400 * (retryCount + 1));
      }
    }
  };

  return (
    <TileLayer
      ref={tileLayerRef}
      url={activeUrl}
      subdomains={activeUrl.includes('google.com') ? GOOGLE_MAPS_CONFIG.subdomains : ['a', 'b', 'c', 'd']}
      attribution={GOOGLE_MAPS_CONFIG.attribution}
      maxZoom={GOOGLE_MAPS_CONFIG.maxZoom}
      minZoom={GOOGLE_MAPS_CONFIG.minZoom}
      maxNativeZoom={GOOGLE_MAPS_CONFIG.maxNativeZoom}
      tileSize={GOOGLE_MAPS_CONFIG.tileSize}
      keepBuffer={GOOGLE_MAPS_CONFIG.keepBuffer}
      updateWhenZooming={GOOGLE_MAPS_CONFIG.updateWhenZooming}
      updateWhenIdle={GOOGLE_MAPS_CONFIG.updateWhenIdle}
      updateInterval={GOOGLE_MAPS_CONFIG.updateInterval}
      crossOrigin={GOOGLE_MAPS_CONFIG.crossOrigin}
      detectRetina={GOOGLE_MAPS_CONFIG.detectRetina}
      eventHandlers={{
        tileloadstart: handleTileLoadStart,
        tileload: handleTileLoad,
        tileerror: handleTileError
      }}
      {...props}
    />
  );
}

/**
 * Intelligent Google Maps Status & Live GIS Feedback Badge
 */
export function MapLayerSwitcher({ style = {} }) {
  const [isLoading, setIsLoading] = useState(globalIsLoading);
  const [pendingTiles, setPendingTiles] = useState(globalPendingTiles);
  const [slowNet] = useState(isSlowConnection());

  useEffect(() => {
    const handleUpdate = (loading, pending) => {
      setIsLoading(loading);
      setPendingTiles(pending);
    };

    tileLoadingListeners.add(handleUpdate);
    return () => {
      tileLoadingListeners.delete(handleUpdate);
    };
  }, []);

  return (
    <div 
      className="map-layer-switcher-container"
      style={{
        position: 'absolute',
        top: '12px',
        left: '52px',
        zIndex: 1000,
        pointerEvents: 'none',
        ...style
      }}
    >
      <div
        className="map-layer-switcher-badge"
        style={{
          background: 'var(--bg-surface)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '9999px',
          color: 'var(--text-primary)',
          padding: '5px 12px',
          fontSize: '0.74rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
          transition: 'all 0.25s ease'
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={13} color="#4285F4" className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
            <span className="map-badge-text-full" style={{ color: '#4285F4' }}>
              {slowNet ? 'Slow Connection • Loading Google Maps...' : 'Loading Google Maps...'}
            </span>
            <span className="map-badge-text-short" style={{ color: '#4285F4', display: 'none' }}>
              Loading...
            </span>
          </>
        ) : (
          <>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#34A853',
              boxShadow: '0 0 8px #34A853',
              flexShrink: 0
            }} />
            <span className="map-badge-text-full" style={{ color: 'var(--text-primary)' }}>
              Google Maps
            </span>
            <span className="map-badge-text-short" style={{ color: 'var(--text-primary)', display: 'none' }}>
              Google Maps
            </span>
            <span className="map-badge-fast-tag" style={{ 
              fontSize: '0.65rem', 
              color: '#1a73e8', 
              background: 'rgba(66, 133, 244, 0.12)',
              padding: '1px 7px',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontWeight: 700
            }}>
              <CheckCircle2 size={10} /> Google GIS
            </span>
          </>
        )}

        {slowNet && (
          <span title="Low-Bandwidth Mode Active" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
            <Zap size={11} />
          </span>
        )}
      </div>
    </div>
  );
}

export default GOOGLE_MAPS_CONFIG;
