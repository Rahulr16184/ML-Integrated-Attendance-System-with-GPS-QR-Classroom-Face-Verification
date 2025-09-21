"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

export default function GpsPage() {
    const Map = useMemo(() => dynamic(() => import('@/components/map'), { 
        loading: () => <p>A map is loading</p>,
        ssr: false 
    }), []);
    
    return (
        <div className="p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">GPS Location</h1>
            <div className="h-[600px] w-full">
                <Map />
            </div>
        </div>
    )
}
