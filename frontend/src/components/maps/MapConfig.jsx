import React, { useEffect, useState, useRef } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import { Layers, Loader2, CheckCircle2, Wifi, Zap } from 'lucide-react';

/**
 * Ultra-Optimized OpenStreetMap (OSM) Architecture for Slow / High-Latency Connections
 * 
 * Performance Strategies:
 * 1. Minimal Tile Buffer (keepBuffer: 2): Prioritizes visible tiles first; prevents queue choking.
 * 2. Idle-Only Updates (updateWhenIdle: true): Stops network thrashing during pan/zoom.
 * 3. Drag Throttling (updateInterval: 200ms): Prevents loading intermediate tiles while dragging.
 * 4. Automatic Slow Network Detection: Automatically drops keepBuffer to 1 on 2G/3G connections.
 * 5. Automatic Tile Retry on Timeout: Automatically retries failed/dropped tiles.
 * 6. Live Tile Loading Feedback: Shows user "Loading tiles..." so slow connection doesn't feel stuck.
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

export const OSM_CONFIG = {
  id: 'osm',
  name: 'OpenStreetMap',
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  subdomains: ['a', 'b', 'c'],
  maxZoom: 19,
  minZoom: 3,
  maxNativeZoom: 19,
  tileSize: 256,
  // Low buffer: load visible viewport first without hogging bandwidth
  keepBuffer: isSlowConnection() ? 1 : 2,
  updateWhenZooming: false,     // Don't fetch intermediate tiles during zoom animations
  updateWhenIdle: true,         // Only fetch tiles once user finishes panning or zooming
  updateInterval: 200,          // 200ms debounce prevents queue saturation during continuous drag
  crossOrigin: 'anonymous',     // Allows full browser disk & memory cache utilization
  detectRetina: false           // Prevents 4x tile volume on standard OSM tile servers
};

export const MAP_PROVIDERS = {
  osm: OSM_CONFIG
};

export function getSavedProviderId() {
  return 'osm';
}

export function saveProviderId() {
  // Always locked to OpenStreetMap
}

export function getActiveTileConfig() {
  return OSM_CONFIG;
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
        map.invalidateSize({ animate: false });
      } catch (e) {
        // Container might be detached
      }
    };

    // Staged triggers to catch layout reflows immediately
    invalidate();
    const t1 = setTimeout(invalidate, 60);
    const t2 = setTimeout(invalidate, 200);
    const t3 = setTimeout(invalidate, 500);

    let resizeObserver = null;
    try {
      const container = map.getContainer();
      if (container && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          invalidate();
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
 * High-Performance TileLayer with Automatic Drop Retry & Loading Tracking
 */
export function FastTileLayer(props) {
  const tileLayerRef = useRef(null);
  const pendingCountRef = useRef(0);

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

    // Auto-retry dropped tiles on slow/flaky connections (up to 2 times)
    const img = error?.tile;
    if (img) {
      const retryCount = parseInt(img.dataset.retries || '0', 10);
      if (retryCount < 2) {
        img.dataset.retries = (retryCount + 1).toString();
        setTimeout(() => {
          const currentSrc = img.src;
          // Subdomain rotation retry: a -> b -> c
          if (currentSrc.includes('//a.tile.')) {
            img.src = currentSrc.replace('//a.tile.', '//b.tile.');
          } else if (currentSrc.includes('//b.tile.')) {
            img.src = currentSrc.replace('//b.tile.', '//c.tile.');
          } else if (currentSrc.includes('//c.tile.')) {
            img.src = currentSrc.replace('//c.tile.', '//a.tile.');
          } else {
            img.src = currentSrc;
          }
        }, 1200);
      }
    }
  };

  return (
    <TileLayer
      ref={tileLayerRef}
      key="osm-fast-layer"
      url={OSM_CONFIG.url}
      attribution={OSM_CONFIG.attribution}
      subdomains={OSM_CONFIG.subdomains}
      maxZoom={OSM_CONFIG.maxZoom}
      minZoom={OSM_CONFIG.minZoom}
      maxNativeZoom={OSM_CONFIG.maxNativeZoom}
      tileSize={OSM_CONFIG.tileSize}
      keepBuffer={OSM_CONFIG.keepBuffer}
      updateWhenZooming={OSM_CONFIG.updateWhenZooming}
      updateWhenIdle={OSM_CONFIG.updateWhenIdle}
      updateInterval={OSM_CONFIG.updateInterval}
      crossOrigin={OSM_CONFIG.crossOrigin}
      detectRetina={OSM_CONFIG.detectRetina}
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
 * Intelligent Map Status & Slow Internet Feedback Badge
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
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          padding: '5px 11px',
          fontSize: '0.74rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          boxShadow: 'var(--shadow-md)',
          transition: 'all 0.25s ease'
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={13} color="var(--accent-primary)" className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
            <span className="map-badge-text-full" style={{ color: 'var(--accent-primary)' }}>
              {slowNet ? 'Slow Connection • Loading tiles...' : 'Loading OpenStreetMap...'}
            </span>
            <span className="map-badge-text-short" style={{ color: 'var(--accent-primary)', display: 'none' }}>
              {slowNet ? 'Loading tiles...' : 'Loading...'}
            </span>
          </>
        ) : (
          <>
            <Layers size={13} color="#10b981" />
            <span className="map-badge-text-full" style={{ color: 'var(--text-primary)' }}>OpenStreetMap</span>
            <span className="map-badge-text-short" style={{ color: 'var(--text-primary)', display: 'none' }}>OSM</span>
            <span className="map-badge-fast-tag" style={{ 
              fontSize: '0.65rem', 
              color: '#10b981', 
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '1px 6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <CheckCircle2 size={10} /> Fast Mode
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

export default OSM_CONFIG;
