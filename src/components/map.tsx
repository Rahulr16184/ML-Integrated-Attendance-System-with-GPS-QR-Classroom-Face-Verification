
"use client";

import { useEffect, useRef } from 'react';
import type { LatLngExpression } from 'leaflet';

declare var L: any; // Use 'any' to avoid TypeScript errors for the global Leaflet object

type MapProps = {
    position: LatLngExpression;
    userPosition?: LatLngExpression | null;
    radius?: number;
    onPositionChange?: (position: LatLngExpression) => void;
    draggable?: boolean;
}

const Map = ({ position, userPosition = null, radius = 100, onPositionChange, draggable = false }: MapProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const centerMarkerInstance = useRef<any>(null); // For the draggable center
    const userMarkerInstance = useRef<any>(null); // For the user's live location
    const circleInstance = useRef<any>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !mapRef.current || !position) return;

        const centerIcon = L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            shadowSize: [41, 41]
        });

        const userIcon = L.icon({
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
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
        
        // Handle center marker
        if (centerMarkerInstance.current) {
            centerMarkerInstance.current.setLatLng(position);
        } else {
            centerMarkerInstance.current = L.marker(position, { 
                icon: centerIcon, 
                draggable: draggable,
                opacity: draggable ? 1.0 : 0.6, // Make center less prominent if not draggable
            }).addTo(mapInstance.current);
            
            if (draggable && onPositionChange) {
                centerMarkerInstance.current.on('dragend', function(event: any) {
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

        // Handle separate user position marker
        if (userPosition) {
             if (userMarkerInstance.current) {
                userMarkerInstance.current.setLatLng(userPosition);
            } else {
                userMarkerInstance.current = L.marker(userPosition, { icon: userIcon }).addTo(mapInstance.current).bindPopup("Your Location");
            }
            // Fit map to both markers
            const bounds = L.latLngBounds([position, userPosition]);
            mapInstance.current.fitBounds(bounds.pad(0.2)); // pad adds some margin
        } else {
            if (userMarkerInstance.current) {
                userMarkerInstance.current.remove();
                userMarkerInstance.current = null;
            }
            mapInstance.current.setView(position, 15);
        }


    }, [position, userPosition, radius, draggable, onPositionChange]);

    if (!position) {
        return <div className="flex items-center justify-center h-full bg-muted">Loading map...</div>
    }

    return (
        <div ref={mapRef} style={{ height: '100%', width: '100%', zIndex: 0 }}></div>
    );
};

export default Map;
