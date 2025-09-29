
"use client";

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon, LatLngExpression, LatLng } from 'leaflet';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Marker as LeafletMarker } from 'leaflet';

const customIcon = new Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

type MapProps = {
    position: LatLngExpression;
    radius?: number;
    onPositionChange?: (position: LatLngExpression) => void;
    draggable?: boolean;
}

const DraggableMarker = ({ initialPosition, onPositionChange }: { initialPosition: LatLng, onPositionChange: (pos: LatLngExpression) => void }) => {
  const [position, setPosition] = useState<LatLng>(initialPosition);
  const markerRef = useRef<LeafletMarker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition(newPos);
          onPositionChange([newPos.lat, newPos.lng]);
        }
      },
    }),
    [onPositionChange],
  );

  useEffect(() => {
    setPosition(new LatLng(initialPosition.lat, initialPosition.lng));
  }, [initialPosition]);

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={customIcon}
      >
      <Popup>Drag to set location</Popup>
    </Marker>
  );
};


const Map = ({ position, radius = 100, onPositionChange, draggable = false }: MapProps) => {

    if (!position) {
        return <div className="flex items-center justify-center h-full bg-muted">Loading map...</div>
    }

    const mapCenter = Array.isArray(position) ? new LatLng(position[0], position[1]) : new LatLng(position.lat, position.lng);
    
    return (
        <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }} key={mapCenter.toString()}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {draggable && onPositionChange ? (
                <DraggableMarker initialPosition={mapCenter} onPositionChange={onPositionChange} />
            ) : (
                <Marker position={mapCenter} icon={customIcon}>
                    <Popup>
                        Configured Location.
                    </Popup>
                </Marker>
            )}
            <Circle center={mapCenter} radius={radius} pathOptions={{ color: 'blue' }} />
        </MapContainer>
    );
};

export default Map;
