import React, { useEffect, useRef } from "react";

type MapMarker = {
  lat: number;
  lng: number;
  title: string;
  color: string;
  scale: number;
  isDimmed?: boolean;
};

type LegendOption = {
  value: string;
  label: string;
  color: string;
};

type GoogleMapsMap = {
  fitBounds: (bounds: any, padding?: number) => void;
  setCenter: (center: { lat: number; lng: number }) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMapsMarker = {
  setMap: (map: any | null) => void;
};

type Props = {
  apiKey?: string;
  mapUrl?: string | null;
  title?: string;
  markers: MapMarker[];
  legendOptions?: LegendOption[];
  height?: number;
  borderColor?: string;
  borderRadius?: number | string;
};

const BOUNDS_PADDING = 80;
let googleMapsScriptPromise: Promise<void> | null = null;
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  const existing = document.querySelector('script[data-google-maps="true"]');
  if (existing) {
    return Promise.resolve();
  }
  if (!googleMapsScriptPromise) {
    googleMapsScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
      script.dataset.googleMaps = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps script."));
      document.head.appendChild(script);
    });
  }
  return googleMapsScriptPromise;
};

const MARKER_PATH =
  "M12 1C6.9 1 2.75 5.15 2.75 10.25c0 6.4 7.33 14.4 8.6 15.75.35.36.98.36 1.33 0 1.27-1.35 8.6-9.35 8.6-15.75C21.28 5.15 17.1 1 12 1z";

const Legend = ({ options, borderColor }: { options: LegendOption[]; borderColor: string }) => (
  <div
    style={{
      position: "absolute",
      top: 12,
      left: 12,
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      padding: 6,
      background: "rgba(255,255,255,0.9)",
      borderRadius: 12,
      border: `1px solid ${borderColor}`,
    }}
  >
    {options.map(option => (
      <div key={option.value} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <svg width="18" height="24" viewBox="0 0 24 34" aria-hidden="true">
          <path d={MARKER_PATH} fill={option.color} />
          <circle cx="12" cy="10.5" r="3.5" fill="#fff" />
        </svg>
        <span style={{ fontSize: 12 }}>{option.label}</span>
      </div>
    ))}
  </div>
);

export default function GymLocationMap({
  apiKey,
  mapUrl,
  title,
  markers,
  legendOptions,
  height = 420,
  borderColor = "#e4e7eb",
  borderRadius = 12,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<GoogleMapsMap | null>(null);
  const markersRef = useRef<GoogleMapsMarker[]>([]);
  const applyBoundsRef = useRef<(() => void) | null>(null);
  const [mapsReady, setMapsReady] = React.useState(false);
  const [renderMap, setRenderMap] = React.useState(false);
  const [mapInitialized, setMapInitialized] = React.useState(false);

  useEffect(() => {
    if (!apiKey) return;
    let active = true;
    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!active) return;
        setMapsReady(true);
      })
      .catch(error => {
        console.error("Failed to load Google Maps script.", error);
      });
    return () => {
      active = false;
    };
  }, [apiKey]);

  useEffect(() => {
    setRenderMap(false);
    if (!apiKey) return;
    const handle = setTimeout(() => {
      setRenderMap(true);
    }, 220);
    return () => clearTimeout(handle);
  }, [apiKey]);

  useEffect(() => {
    if (!apiKey || !mapsReady || !renderMap) return;
    let active = true;
    let resizeObserver: ResizeObserver | null = null;
    const initMap = () => {
      if (!active) return;
      const maps = (window as any).google?.maps;
      if (!maps || !mapRef.current) return;
      if (!mapInstance.current) {
        mapInstance.current = new maps.Map(mapRef.current, {
          center: { lat: markers[0]?.lat || 0, lng: markers[0]?.lng || 0 },
          zoom: 14,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        });
        setMapInitialized(true);
      }
      if (mapRef.current && typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          applyBoundsRef.current?.();
        });
        resizeObserver.observe(mapRef.current);
      }
    };
    const handle = requestAnimationFrame(initMap);
    return () => {
      active = false;
      cancelAnimationFrame(handle);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [apiKey, mapsReady, renderMap, markers]);

  useEffect(() => {
    if (!apiKey || !mapsReady || !renderMap || !mapInitialized) return;
    const maps = (window as any).google?.maps;
    const map = mapInstance.current;
    if (!maps || !map) return;
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    const bounds = new maps.LatLngBounds();
    markers.forEach(markerData => {
      const marker = new maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map,
        title: markerData.title,
        icon: {
          path: MARKER_PATH,
          fillColor: markerData.color,
          fillOpacity: markerData.isDimmed ? 0.3 : 1,
          strokeColor: "#ffffff",
          strokeWeight: 1.5,
          scale: markerData.scale,
          anchor: new maps.Point(12, 34),
        },
      });
      markersRef.current.push(marker);
      bounds.extend(new maps.LatLng(markerData.lat, markerData.lng));
    });
    const applyBounds = () => {
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, BOUNDS_PADDING);
        if (markers.length === 1) {
          map.setZoom(18);
        }
      } else if (markers.length === 1) {
        map.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
        map.setZoom(18);
      }
    };
    applyBoundsRef.current = applyBounds;
    const triggerResize = () => {
      maps.event.trigger(map, "resize");
      applyBounds();
    };
    triggerResize();
    setTimeout(triggerResize, 120);
    setTimeout(triggerResize, 360);
    setTimeout(triggerResize, 720);
  }, [apiKey, mapsReady, renderMap, mapInitialized, markers]);

  if (!apiKey || markers.length === 0) {
    if (!mapUrl) return null;
    return (
      <div
        style={{
          position: "relative",
          borderRadius,
          overflow: "hidden",
          border: `1px solid ${borderColor}`,
        }}
      >
        <iframe
          title={title || "Map"}
          src={mapUrl}
          width="100%"
          height={height}
          loading="lazy"
          style={{ border: 0, display: "block" }}
        />
        {legendOptions && legendOptions.length > 0 && (
          <Legend options={legendOptions} borderColor={borderColor} />
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius,
        overflow: "hidden",
        border: `1px solid ${borderColor}`,
      }}
    >
      {renderMap && <div ref={mapRef} style={{ width: "100%", height }} />}
      {legendOptions && legendOptions.length > 0 && (
        <Legend options={legendOptions} borderColor={borderColor} />
      )}
    </div>
  );
}
