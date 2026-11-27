import React, { useEffect, useState, useRef, useCallback } from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, CheckCircle2, AlertTriangle, RefreshCw, Layers, Zap } from 'lucide-react';

/**
 * Hybrid GIS Map Configuration:
 * - Visual Map Canvas: High-speed Google Maps Quad-CDN Tiles (mt0-mt3: Roadmap, Satellite, Terrain)
 * - Address & Locality Decoding: Live Mappls (MapmyIndia) v3 Search & Reverse-Geocode APIs
 *
 * Root-Cause Fixes Included:
 * 1. Instant Tile Delivery: Google Maps mt0-mt3 CDN eliminates Mappls still_image 2-10s latency & blank areas.
 * 2. Lifecycle & Visibility Invalidation: ResizeObserver + IntersectionObserver + transitionend listeners.
 * 3. Accurate Loading / Error Lifecycle: Bound directly to Leaflet loading, tileload, tileerror, and load events.
 */

function isSlowConnection() {
  if (typeof navigator !== 'undefined' && navigator.connection) {
    const { effectiveType, saveData } = navigator.connection;
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g') {
      return true;
    }
  }
  return false;
}

export const MAPPLS_ACCESS_TOKEN =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_MAPPLS_KEY || import.meta.env.VITE_MAPPLS_ACCESS_TOKEN)) || '';

export const MAP_PROVIDERS = {
  google: {
    id: 'google',
    name: 'Google Maps',
    shortName: 'Google',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Maps | Address Decoding: Mappls (MapmyIndia)',
    maxZoom: 20,
    minZoom: 3,
    maxNativeZoom: 20,
    tileSize: 256
  },
  google_satellite: {
    id: 'google_satellite',
    name: 'Google Satellite',
    shortName: 'Satellite',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Satellite | Address Decoding: Mappls (MapmyIndia)',
    maxZoom: 20,
    minZoom: 3,
    maxNativeZoom: 20,
    tileSize: 256
  },
  google_terrain: {
    id: 'google_terrain',
    name: 'Google Terrain',
    shortName: 'Terrain',
    url: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    attribution: '&copy; Google Terrain | Address Decoding: Mappls (MapmyIndia)',
    maxZoom: 20,
    minZoom: 3,
    maxNativeZoom: 20,
    tileSize: 256
  },
  esri_fallback: {
    id: 'esri_fallback',
    name: 'Esri Street (Backup)',
    shortName: 'Backup',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    subdomains: [],
    attribution: '&copy; Esri | Address Decoding: Mappls (MapmyIndia)',
    maxZoom: 19,
    minZoom: 3,
    maxNativeZoom: 18,
    tileSize: 256
  },
  ...(MAPPLS_ACCESS_TOKEN
    ? {
        mappls_raster: {
          id: 'mappls_raster',
          name: 'Mappls Raster',
          shortName: 'Mappls',
          url: '',
          subdomains: [],
          attribution: '&copy; <a href="https://www.mappls.com" target="_blank" rel="noreferrer">Mappls</a> | MapmyIndia',
          maxZoom: 19,
          minZoom: 4,
          minNativeZoom: 4,
          maxNativeZoom: 18,
          tileSize: 512
        }
      }
    : {})
};

export const DEFAULT_PROVIDER_ID = 'google';
const STORAGE_KEY = 'civicpulse_map_layer_v3';

export function getSavedProviderId() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && MAP_PROVIDERS[saved]) return saved;
  } catch (e) {
    // ignore storage restriction
  }
  return DEFAULT_PROVIDER_ID;
}

export function saveProviderId(id) {
  try {
    if (MAP_PROVIDERS[id]) {
      localStorage.setItem(STORAGE_KEY, id);
    }
  } catch (e) {
    // ignore
  }
}

export function getActiveTileConfig(providerId) {
  return MAP_PROVIDERS[providerId] || MAP_PROVIDERS[DEFAULT_PROVIDER_ID];
}

// Lightweight status emitter for MapLayerSwitcher
const statusListeners = new Set();
let currentTileStatus = {
  isLoading: false,
  hasError: false,
  providerId: DEFAULT_PROVIDER_ID,
  retryTrigger: 0
};

function emitTileStatus(partial) {
  currentTileStatus = { ...currentTileStatus, ...partial };
  statusListeners.forEach(fn => fn(currentTileStatus));
}

export function requestMapTileRetry() {
  emitTileStatus({
    hasError: false,
    isLoading: true,
    retryTrigger: currentTileStatus.retryTrigger + 1
  });
}

/**
 * Ensures Leaflet recalculates exact viewport bounds whenever the container
 * mounts, becomes visible (IntersectionObserver), resizes (ResizeObserver),
 * or completes a CSS / Framer Motion transition (transitionend).
 */
export function MapAutoInvalidate({ extraDep = null }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const invalidate = () => {
      try {
        map.invalidateSize({ animate: false, pan: false });
      } catch (e) {
        // Safe guard if map container detached mid-unmount
      }
    };

    const rafId = requestAnimationFrame(invalidate);
    const t1 = setTimeout(invalidate, 120);
    const t2 = setTimeout(invalidate, 380);
    const t3 = setTimeout(invalidate, 750);

    let resizeObserver = null;
    let intersectionObserver = null;
    let container = null;
    let parentEl = null;

    try {
      container = map.getContainer();
      parentEl = container?.parentElement || null;

      if (container && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          requestAnimationFrame(invalidate);
        });
        resizeObserver.observe(container);
      }

      if (container && typeof IntersectionObserver !== 'undefined') {
        intersectionObserver = new IntersectionObserver(
          (entries) => {
            if (entries.some(entry => entry.isIntersecting)) {
              requestAnimationFrame(invalidate);
            }
          },
          { threshold: 0.05 }
        );
        intersectionObserver.observe(container);
      }
    } catch (e) {
      // ignore observer errors
    }

    const handleTransitionEnd = (e) => {
      if (!e || e.propertyName === 'height' || e.propertyName === 'width' || e.propertyName === 'transform') {
        invalidate();
      }
    };

    const handleWindowResize = () => requestAnimationFrame(invalidate);
    window.addEventListener('resize', handleWindowResize, { passive: true });
    if (parentEl) {
      parentEl.addEventListener('transitionend', handleTransitionEnd, { passive: true });
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) resizeObserver.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
      if (parentEl) {
        parentEl.removeEventListener('transitionend', handleTransitionEnd);
      }
    };
  }, [map, extraDep]);

  return null;
}

/**
 * Optional Mappls Raster 512px GridLayer (when user explicitly selects Mappls Raster layer).
 */
const loadedMapplsUrls = new Set();

function createMapplsGridLayer(map, accessToken, onStatus) {
  const slowNet = isSlowConnection();
  const maxConcurrent = slowNet ? 2 : 3;
  const tileTimeoutMs = 9000;
  let active = 0;
  const queue = [];

  const pump = () => {
    while (active < maxConcurrent && queue.length > 0) {
      let bestIdx = 0;
      for (let i = 1; i < queue.length; i++) {
        if (queue[i].distSq < queue[bestIdx].distSq) bestIdx = i;
      }
      const [job] = queue.splice(bestIdx, 1);
      if (job.cancelled) continue;
      active++;
      job.start(() => {
        active = Math.max(0, active - 1);
        pump();
      });
    }
  };

  const MapplsGrid = L.GridLayer.extend({
    createTile(coords, done) {
      const tile = document.createElement('div');
      tile.style.width = '512px';
      tile.style.height = '512px';
      tile.style.overflow = 'hidden';
      tile.style.position = 'relative';
      tile.style.backgroundColor = '#eef2f6';

      const z = Math.min(Math.max(coords.z, 4), 18);
      const n = Math.pow(2, z - 1);
      const x = ((coords.x % n) + n) % n;
      const y = coords.y;

      if (y < 0 || y >= n) {
        done(null, tile);
        return tile;
      }

      const lng = ((x + 0.5) / n) * 360 - 180;
      const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * (y + 0.5)) / n)));
      const lat = (latRad * 180) / Math.PI;

      const useLite = slowNet && z > 4;
      const reqZoom = useLite ? z - 1 : z;
      const reqSize = useLite ? 320 : 576;
      const src = `https://tile.mappls.com/map/raster_tile/still_image?center=${lat.toFixed(6)},${lng.toFixed(6)}&zoom=${reqZoom}&size=${reqSize}x${reqSize}&access_token=${accessToken}`;

      const img = document.createElement('img');
      img.alt = '';
      img.setAttribute('role', 'presentation');
      img.style.position = 'absolute';
      img.style.top = useLite ? '-64px' : '-32px';
      img.style.left = useLite ? '-64px' : '-32px';
      img.style.width = useLite ? '640px' : '576px';
      img.style.height = useLite ? '640px' : '576px';
      img.style.maxWidth = 'none';
      img.style.pointerEvents = 'none';
      img.style.userSelect = 'none';
      tile.appendChild(img);

      let settled = false;
      let timerId = null;
      let releaseSlot = null;

      const release = () => {
        if (timerId) {
          clearTimeout(timerId);
          timerId = null;
        }
        if (releaseSlot) {
          const fn = releaseSlot;
          releaseSlot = null;
          fn();
        }
      };

      img.onload = () => {
        if (settled) return;
        settled = true;
        release();
        loadedMapplsUrls.add(src);
        onStatus?.tileLoaded();
        done(null, tile);
      };

      img.onerror = () => {
        if (settled) return;
        settled = true;
        release();
        onStatus?.tileFailed();
        done(new Error('Mappls tile failed'), tile);
      };

      const center = map.getCenter();
      const distSq = Math.pow(lat - center.lat, 2) + Math.pow(lng - center.lng, 2);

      const job = {
        distSq,
        cancelled: false,
        start: (doneSlot) => {
          releaseSlot = doneSlot;
          if (job.cancelled || settled) {
            release();
            return;
          }
          timerId = setTimeout(() => {
            if (!settled && !job.cancelled) {
              settled = true;
              release();
              onStatus?.tileFailed();
              done(new Error('Mappls tile timeout'), tile);
            }
          }, tileTimeoutMs);
          img.src = src;
        }
      };

      tile._cancelMappls = () => {
        job.cancelled = true;
        release();
        if (!settled) {
          settled = true;
          img.src = '';
        }
      };

      if (loadedMapplsUrls.has(src)) {
        img.src = src;
      } else {
        queue.push(job);
        pump();
      }

      return tile;
    }
  });

  const layer = new MapplsGrid({
    minZoom: 4,
    maxZoom: 19,
    minNativeZoom: 4,
    maxNativeZoom: 18,
    tileSize: 512,
    keepBuffer: 0,
    updateWhenZooming: false,
    updateWhenIdle: true,
    updateInterval: 260,
    attribution: MAP_PROVIDERS.mappls_raster?.attribution || ''
  });

  layer.on('tileunload', (e) => {
    e?.tile?._cancelMappls?.();
  });

  return layer;
}

/**
 * Reliable FastTileLayer defaulting to Google Maps Quad-CDN tiles with
 * automatic fallback, accurate loading/load lifecycle, and tileerror recovery.
 */
export function FastTileLayer({ providerId = DEFAULT_PROVIDER_ID }) {
  const map = useMap();
  const [effectiveId, setEffectiveId] = useState(() =>
    MAP_PROVIDERS[providerId] ? providerId : DEFAULT_PROVIDER_ID
  );
  const [retryNonce, setRetryNonce] = useState(0);
  const errorCountRef = useRef(0);
  const loadedCountRef = useRef(0);
  const watchdogRef = useRef(null);

  useEffect(() => {
    const nextId = MAP_PROVIDERS[providerId] ? providerId : DEFAULT_PROVIDER_ID;
    setEffectiveId(nextId);
    errorCountRef.current = 0;
    loadedCountRef.current = 0;
    emitTileStatus({ providerId: nextId, hasError: false });
  }, [providerId]);

  useEffect(() => {
    const onStatus = (status) => {
      if (status.retryTrigger > 0) {
        setRetryNonce(status.retryTrigger);
        errorCountRef.current = 0;
        loadedCountRef.current = 0;
      }
    };
    statusListeners.add(onStatus);
    return () => statusListeners.delete(onStatus);
  }, []);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const startWatchdog = useCallback(() => {
    clearWatchdog();
    watchdogRef.current = setTimeout(() => {
      emitTileStatus({
        isLoading: false,
        hasError: loadedCountRef.current === 0 && errorCountRef.current > 0
      });
    }, 10000);
  }, [clearWatchdog]);

  useEffect(() => {
    return () => {
      clearWatchdog();
      emitTileStatus({ isLoading: false, hasError: false });
    };
  }, [clearWatchdog]);

  const handleLoading = useCallback(() => {
    errorCountRef.current = 0;
    emitTileStatus({ isLoading: true, hasError: false, providerId: effectiveId });
    startWatchdog();
  }, [effectiveId, startWatchdog]);

  const handleTileLoad = useCallback(() => {
    loadedCountRef.current += 1;
  }, []);

  const handleLoad = useCallback(() => {
    clearWatchdog();
    const failedAll = loadedCountRef.current === 0 && errorCountRef.current > 0;
    emitTileStatus({ isLoading: false, hasError: failedAll, providerId: effectiveId });
  }, [clearWatchdog, effectiveId]);

  const handleTileError = useCallback(
    (err) => {
      errorCountRef.current += 1;

      const img = err?.tile;
      if (img && !img.dataset.retried) {
        img.dataset.retried = '1';
        const src = img.src || '';
        if (src.includes('//mt0.google.com')) {
          img.src = src.replace('//mt0.google.com', '//mt1.google.com');
          return;
        }
        if (src.includes('//mt1.google.com')) {
          img.src = src.replace('//mt1.google.com', '//mt2.google.com');
          return;
        }
      }

      // If primary Google tile server encounters blocks/failures, fail over seamlessly
      if (effectiveId.startsWith('google') && errorCountRef.current >= 4 && loadedCountRef.current === 0) {
        clearWatchdog();
        errorCountRef.current = 0;
        setEffectiveId('esri_fallback');
        emitTileStatus({ providerId: 'esri_fallback', hasError: false, isLoading: true });
      } else if (loadedCountRef.current === 0 && errorCountRef.current >= 6) {
        clearWatchdog();
        emitTileStatus({ isLoading: false, hasError: true, providerId: effectiveId });
      }
    },
    [clearWatchdog, effectiveId]
  );

  useEffect(() => {
    if (!map || effectiveId !== 'mappls_raster' || !MAPPLS_ACCESS_TOKEN) return;

    handleLoading();
    const gridLayer = createMapplsGridLayer(map, MAPPLS_ACCESS_TOKEN, {
      tileLoaded: handleTileLoad,
      tileFailed: () => {
        errorCountRef.current += 1;
      }
    });

    gridLayer.on('loading', handleLoading);
    gridLayer.on('load', handleLoad);
    gridLayer.addTo(map);

    return () => {
      gridLayer.off('loading', handleLoading);
      gridLayer.off('load', handleLoad);
      if (map.hasLayer(gridLayer)) {
        map.removeLayer(gridLayer);
      }
      clearWatchdog();
    };
  }, [map, effectiveId, retryNonce, handleLoading, handleLoad, handleTileLoad, clearWatchdog]);

  if (effectiveId === 'mappls_raster' && MAPPLS_ACCESS_TOKEN) {
    return null;
  }

  const config = getActiveTileConfig(effectiveId);
  const slowNet = isSlowConnection();

  return (
    <TileLayer
      key={`${config.id}-${retryNonce}`}
      url={config.url}
      subdomains={config.subdomains}
      attribution={config.attribution}
      maxZoom={config.maxZoom}
      minZoom={config.minZoom}
      maxNativeZoom={config.maxNativeZoom}
      tileSize={config.tileSize}
      keepBuffer={slowNet ? 1 : 2}
      updateWhenZooming={false}
      updateWhenIdle={false}
      updateInterval={150}
      detectRetina={false}
      eventHandlers={{
        loading: handleLoading,
        tileload: handleTileLoad,
        tileerror: handleTileError,
        load: handleLoad
      }}
    />
  );
}

/**
 * Interactive Map Layer & Status Switcher Pill
 * Displays visual Google Maps tile status + Mappls address decoding badge,
 * handles tile retry on error, and allows switching Google Roadmap/Satellite/Terrain/Mappls.
 */
export function MapLayerSwitcher({ currentProvider = DEFAULT_PROVIDER_ID, onProviderChange, style = {} }) {
  const [status, setStatus] = useState(currentTileStatus);
  const [menuOpen, setMenuOpen] = useState(false);
  const [slowNet] = useState(isSlowConnection());

  useEffect(() => {
    const listener = (next) => setStatus(next);
    statusListeners.add(listener);
    return () => statusListeners.delete(listener);
  }, []);

  const activeConfig = getActiveTileConfig(status.providerId || currentProvider);
  const providersList = Object.values(MAP_PROVIDERS);

  const handleSelectProvider = (id) => {
    saveProviderId(id);
    setMenuOpen(false);
    if (onProviderChange) {
      onProviderChange(id);
    }
  };

  return (
    <div
      className="map-layer-switcher-container"
      style={{
        position: 'absolute',
        top: '12px',
        left: '52px',
        zIndex: 1000,
        pointerEvents: 'auto',
        ...style
      }}
    >
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setMenuOpen(prev => !prev)}
          className="map-layer-switcher-badge"
          title="Switch map layer (Google Maps / Satellite / Terrain / Mappls)"
          style={{
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            border: status.hasError ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-subtle)',
            borderRadius: '9999px',
            color: 'var(--text-primary)',
            padding: '5px 12px',
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {status.isLoading ? (
            <>
              <Loader2 size={13} color="#4285F4" style={{ animation: 'spin 1s linear infinite' }} />
              <span className="map-badge-text-full" style={{ color: '#4285F4' }}>
                Loading {activeConfig.shortName}...
              </span>
              <span className="map-badge-text-short" style={{ color: '#4285F4', display: 'none' }}>
                Loading...
              </span>
            </>
          ) : status.hasError ? (
            <>
              <AlertTriangle size={13} color="#ef4444" />
              <span style={{ color: '#ef4444' }}>Tiles failed</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  requestMapTileRetry();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    requestMapTileRetry();
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  padding: '1px 7px',
                  borderRadius: '9999px',
                  fontSize: '0.66rem'
                }}
              >
                <RefreshCw size={10} /> Retry
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
                {activeConfig.name}
              </span>
              <span className="map-badge-text-short" style={{ color: 'var(--text-primary)', display: 'none' }}>
                {activeConfig.shortName}
              </span>
              <span className="map-badge-fast-tag" style={{
                fontSize: '0.65rem',
                color: 'var(--color-accent)',
                background: 'var(--color-accent-subtle)',
                padding: '1px 7px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 700
              }}>
                <Layers size={10} /> Mappls GIS
              </span>
            </>
          )}

          {slowNet && (
            <span title="Low-Bandwidth Mode Active" style={{ color: '#f59e0b', display: 'flex', alignItems: 'center' }}>
              <Zap size={11} />
            </span>
          )}
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: '38px',
              left: 0,
              minWidth: '190px',
              background: 'var(--bg-surface)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '6px',
              boxShadow: '0 10px 28px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              zIndex: 1001
            }}
          >
            {providersList.map((p) => {
              const isSelected = p.id === (status.providerId || currentProvider);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProvider(p.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
                    color: isSelected ? 'var(--color-accent)' : 'var(--text-primary)',
                    fontSize: '0.76rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>{p.name}</span>
                  {isSelected && <CheckCircle2 size={12} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MAP_PROVIDERS[DEFAULT_PROVIDER_ID];
