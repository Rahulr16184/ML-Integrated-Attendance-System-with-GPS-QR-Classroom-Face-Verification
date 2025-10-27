
"use client";

import { useState, useEffect } from 'react';
import { auth } from '@/lib/conf';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getUserData } from '@/services/user-service';
import type { UserProfile } from '@/services/user-service';
import { updateProfileDescriptorCache } from '@/services/system-cache-service';

export function useUserProfile() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
            if (user) {
                const data = await getUserData(user.uid);
                setUserProfile(data);

                if (data?.profileImage) {
                    await updateProfileDescriptorCache(data);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return { userProfile, loading, setUserProfile };
}
