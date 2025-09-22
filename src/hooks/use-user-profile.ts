
"use client";

import { useState, useEffect } from 'react';
import { getUserData } from '@/services/user-service';
import type { UserProfile } from '@/services/user-service';

export function useUserProfile() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUserData() {
            const userEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
            if (userEmail) {
                const data = await getUserData(userEmail);
                setUserProfile(data);
            }
            setLoading(false);
        }

        fetchUserData();
    }, []);

    return { userProfile, loading };
}
