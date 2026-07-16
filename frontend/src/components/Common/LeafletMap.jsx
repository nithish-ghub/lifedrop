import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon paths in production/build environments
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom markers using open-source leaflet color icons
export const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Helper component to auto-pan the map when coordinates change
const ChangeMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const LeafletMap = ({ center, zoom = 13, markers = [], routeCoords }) => {
  const mapCenter = center || [12.9716, 77.5946]; // Default to Bangalore center if empty

  return (
    <div className="h-full w-full overflow-hidden rounded-xl border border-gray-200 shadow-inner">
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeMapView center={mapCenter} />

        {markers.map((marker, index) => {
          let icon = blueIcon;
          if (marker.type === 'hospital') icon = greenIcon;
          if (marker.type === 'request' || marker.type === 'emergency') icon = redIcon;

          return (
            <Marker key={index} position={marker.position} icon={icon}>
              {marker.popup && (
                <Popup>
                  <div className="text-xs font-semibold">
                    <p className="border-b pb-1 text-sm font-bold text-gray-800">{marker.popup.title}</p>
                    <p className="mt-1 text-gray-600">{marker.popup.description}</p>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}

        {routeCoords && routeCoords.length === 2 && (
          <Polyline positions={routeCoords} color="#e53e3e" weight={4} dashArray="5, 10" />
        )}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
