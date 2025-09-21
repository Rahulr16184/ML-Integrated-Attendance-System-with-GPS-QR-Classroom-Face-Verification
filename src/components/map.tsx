"use client";

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { useEffect, useState } from 'react';

const customIcon = new Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41]
});

const Map = () => {
    const [position, setPosition] = useState<LatLngExpression | null>(null);

    useEffect(() => {
        // Default to a central location if geolocation is not available
        let initialPosition: LatLngExpression = [51.505, -0.09]; 

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setPosition([latitude, longitude]);
                },
                (err) => {
                    console.warn(`ERROR(${err.code}): ${err.message}`);
                    setPosition(initialPosition);
                }
            );
        } else {
             console.log("Geolocation is not supported by this browser.");
             setPosition(initialPosition);
        }
    }, []);

    if (!position) {
        return <div className="flex items-center justify-center h-full">Loading map...</div>
    }

    return (
        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={position} icon={customIcon}>
                <Popup>
                    You are here.
                </Popup>
            </Marker>
        </MapContainer>
    );
};

export default Map;
