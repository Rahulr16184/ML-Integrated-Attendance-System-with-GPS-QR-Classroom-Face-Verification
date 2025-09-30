
"use client";

import { useState, useEffect } from 'react';
import { getUserData } from '@/services/user-service';
import type { UserProfile } from '@/services/user-service';
import { cacheDescriptor, getCachedDescriptor } from '@/services/descriptor-cache-service';
import { getFaceApi } from '@/lib/face-api';

export function useUserProfile() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUserData() {
            setLoading(true);
            const userEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
            if (userEmail) {
                const data = await getUserData(userEmail);
                setUserProfile(data);

                // Pre-process and cache the user's profile image descriptor
                if (data?.profileImage) {
                    const cachedDescriptor = getCachedDescriptor('userProfileImage');
                    if (!cachedDescriptor) {
                        try {
                            const faceapi = getFaceApi();
                            const img = await faceapi.fetchImage(data.profileImage);
                            const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                            if (detection) {
                                cacheDescriptor('userProfileImage', detection.descriptor);
                                console.log('User profile descriptor cached.');
                            }
                        } catch (error) {
                            console.error("Failed to process user profile image for caching:", error);
                        }
                    }
                }
            }
            setLoading(false);
        }

        fetchUserData();
    }, []);

    return { userProfile, loading, setUserProfile };
}
