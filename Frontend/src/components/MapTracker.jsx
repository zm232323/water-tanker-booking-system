import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Custom divIcons utilizing Tailwind CSS for modern style and zero image-path assets bugs in Vite
const customerIcon = L.divIcon({
  html: `
    <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white shadow-md border border-white">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>
  `,
  className: 'custom-marker-customer',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const driverIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white shadow-lg border-2 border-white">
      <span class="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60 animate-ping"></span>
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
    </div>
  `,
  className: 'custom-marker-driver',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// Helper component to handle map flying/recentering dynamically
const RecenterMap = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), { animate: true, duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// Helper component to auto-fit bounds when both markers exist
const FitMapBounds = ({ customerPos, driverPos }) => {
  const map = useMap();
  useEffect(() => {
    if (customerPos && driverPos) {
      const bounds = L.latLngBounds([customerPos, driverPos]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [customerPos, driverPos, map]);
  return null;
};

const MapTracker = ({ customerLocation, driverLocation, height = '450px' }) => {
  // Fallback map center (New York / default location if undefined)
  const defaultCenter = [40.7128, -74.006];
  const customerPos = customerLocation ? [customerLocation.lat, customerLocation.lng] : null;
  const driverPos = driverLocation ? [driverLocation.lat, driverLocation.lng] : null;

  const mapCenter = driverPos || customerPos || defaultCenter;

  return (
    <div style={{ height }} className="relative w-full rounded-xl overflow-hidden shadow-xl border border-white/10">
      <MapContainer
        center={mapCenter}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: '#1e293b' }}
      >
        {/* Premium Dark-Theme Map Tiles using CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Customer Location Marker */}
        {customerPos && (
          <Marker position={customerPos} icon={customerIcon}>
            <Popup>
              <div className="text-gray-900 font-medium">
                <p className="font-bold text-indigo-600">Delivery Destination</p>
                <p className="text-xs text-gray-500">Water tank drop-off point</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Driver Location Marker */}
        {driverPos && (
          <Marker position={driverPos} icon={driverIcon}>
            <Popup>
              <div className="text-gray-900 font-medium">
                <p className="font-bold text-indigo-600">Water Tanker Status</p>
                <p className="text-xs text-gray-500 font-semibold text-indigo-500">Live Geo-Tracking</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Draw tracking line from Driver to Customer if both are online */}
        {customerPos && driverPos && (
          <Polyline
            positions={[driverPos, customerPos]}
            color="#6366f1"
            weight={3}
            opacity={0.6}
            dashArray="10, 10"
          />
        )}

        {/* Dynamic map adjusters */}
        {driverPos && !customerPos && <RecenterMap center={driverPos} />}
        {customerPos && !driverPos && <RecenterMap center={customerPos} />}
        {customerPos && driverPos && <FitMapBounds customerPos={customerPos} driverPos={driverPos} />}
      </MapContainer>
    </div>
  );
};

export default MapTracker;
