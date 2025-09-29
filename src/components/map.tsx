
"use client";

import { useEffect, useRef } from 'react';
import type { LatLngExpression } from 'leaflet';

declare var L: any; // Use 'any' to avoid TypeScript errors for the global Leaflet object

type MapProps = {
    position: LatLngExpression;
    radius?: number;
    onPositionChange?: (position: LatLngExpression) => void;
    draggable?: boolean;
}

const Map = ({ position, radius = 100, onPositionChange, draggable = false }: MapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null); // To hold the Leaflet map instance
    const markerInstance = useRef<any>(null); // To hold the marker instance
    const circleInstance = useRef<any>(null); // To hold the circle instance

    useEffect(() => {
        if (typeof window === 'undefined' || !mapRef.current || !position) return;

        const customIcon = L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            shadowSize: [41, 41]
        });

        // Initialize map only once
        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView(position, 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);
        } else {
            mapInstance.current.setView(position, 15);
        }
        
        // Handle marker
        if (markerInstance.current) {
            markerInstance.current.setLatLng(position);
        } else {
            markerInstance.current = L.marker(position, { 
                icon: customIcon, 
                draggable: draggable 
            }).addTo(mapInstance.current);
            
            if (draggable && onPositionChange) {
                markerInstance.current.on('dragend', function(event: any) {
                    const newPos = event.target.getLatLng();
                    onPositionChange([newPos.lat, newPos.lng]);
                });
            }
        }
        
        // Handle circle
        if (circleInstance.current) {
            circleInstance.current.setLatLng(position).setRadius(radius);
        } else {
            circleInstance.current = L.circle(position, {
                radius: radius,
                color: 'blue'
            }).addTo(mapInstance.current);
        }

        // Cleanup on component unmount
        return () => {
            if (mapInstance.current) {
                // Do not destroy the map instance, just remove layers if needed
            }
        };
    }, [position, radius, draggable, onPositionChange]);

    if (!position) {
        return <div className="flex items-center justify-center h-full bg-muted">Loading map...</div>
    }

    return (
        <div ref={mapRef} style={{ height: '100%', width: '100%', zIndex: 0 }}></div>
    );
};

export default Map;
