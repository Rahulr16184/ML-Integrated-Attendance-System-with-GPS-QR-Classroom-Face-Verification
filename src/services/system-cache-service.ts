
"use client";

import { getFaceApi } from "@/lib/face-api";
import type { Department, UserProfile } from "@/lib/types";

// Using a TextEncoder to store as Uint8Array for potential performance benefits,
// although JSON stringify would also work.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const CACHE_PREFIX = 'system-cache-v1-';
const PROFILE_KEY = 'userProfileImage';

type CacheMetadata = {
    source: string; // e.g., URL of the image or a unique ID for a set of images
    createdAt: number; // ISO timestamp
}

/**
 * Caches a descriptor with metadata.
 * @param key - A unique key for the data.
 * @param descriptor - The descriptor to cache.
 * @param metadata - Metadata about the source of the descriptor.
 */
function setCachedDescriptor(key: string, descriptor: Float32Array | Float32Array[], metadata: CacheMetadata): void {
  try {
    const dataToCache = {
        descriptor: Array.isArray(descriptor) ? descriptor.map(d => Array.from(d)) : Array.from(descriptor),
        metadata,
    };
    const serialized = JSON.stringify(dataToCache);
    sessionStorage.setItem(CACHE_PREFIX + key, serialized);
  } catch (error) {
    console.error(`Failed to cache descriptor for key "${key}":`, error);
  }
}


/**
 * Retrieves a cached descriptor and its metadata.
 * @param key - The unique key for the data.
 * @returns An object with the descriptor and metadata, or null if not found.
 */
function getCachedDescriptorWithMetadata(key: string): { descriptor: Float32Array | Float32Array[], metadata: CacheMetadata } | null {
    try {
        const stored = sessionStorage.getItem(CACHE_PREFIX + key);
        if (!stored) return null;

        const parsed = JSON.parse(stored);
        if (!parsed.descriptor || !parsed.metadata) return null;
        
        const descriptor = Array.isArray(parsed.descriptor[0])
            ? parsed.descriptor.map((d: number[]) => new Float32Array(d))
            : new Float32Array(parsed.descriptor);

        return { descriptor, metadata: parsed.metadata };
    } catch (error) {
        console.error(`Failed to retrieve cached descriptor for key "${key}":`, error);
        return null;
    }
}

/**
 * Clears a specific cached item.
 * @param key The key of the cache item to clear.
 */
export function clearCachedDescriptor(key: string): void {
    try {
        sessionStorage.removeItem(CACHE_PREFIX + key);
    } catch (error) {
        console.error(`Failed to clear cache for key "${key}":`, error);
    }
}

// --- Profile Image Caching ---

/**
 * Checks if the cached profile descriptor is up-to-date.
 * @param userProfile - The current user's profile.
 * @returns An object indicating if an update is needed.
 */
export async function getProfileCacheStatus(userProfile: UserProfile): Promise<{ needsUpdate: boolean }> {
    if (!userProfile.profileImage) {
        return { needsUpdate: false }; // No image to cache.
    }
    const cached = getCachedDescriptorWithMetadata(PROFILE_KEY);
    if (!cached || cached.metadata.source !== userProfile.profileImage) {
        return { needsUpdate: true };
    }
    return { needsUpdate: false };
}

/**
 * Updates the cached descriptor for the user's profile image if it's outdated.
 * @param userProfile - The user's profile.
 */
export async function updateProfileDescriptorCache(userProfile: UserProfile): Promise<void> {
    const status = await getProfileCacheStatus(userProfile);
    if (!status.needsUpdate || !userProfile.profileImage) {
        return;
    }
    try {
        const faceapi = await getFaceApi();
        const img = await faceapi.fetchImage(userProfile.profileImage);
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        if (detection) {
            setCachedDescriptor(PROFILE_KEY, detection.descriptor, {
                source: userProfile.profileImage,
                createdAt: Date.now(),
            });
            console.log('User profile descriptor cache updated.');
        } else {
             clearCachedDescriptor(PROFILE_KEY);
        }
    } catch (error) {
        console.error("Failed to update profile descriptor cache:", error);
    }
}


// --- Classroom Photos Caching ---

/**
 * Gets a unique source identifier for a department's classroom photos.
 * This is a simple hash of all embedded photo URLs.
 */
const getClassroomSourceId = (department: Department) => {
    const allEmbeddedUrls = [
        ...(department.classroomPhotoUrls?.filter(p => p.embedded).map(p => p.url) || []),
        ...(department.studentsInClassroomPhotoUrls?.filter(p => p.embedded).map(p => p.url) || []),
    ].sort();

    // Simple hash function
    return allEmbeddedUrls.reduce((hash, url) => {
        for (let i = 0; i < url.length; i++) {
          const char = url.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }, 0).toString();
};

/**
 * Checks if the cached classroom descriptors for a department are up-to-date.
 * @param department - The department to check.
 * @returns An object indicating if an update is needed.
 */
export async function getClassroomCacheStatus(department: Department): Promise<{ needsUpdate: boolean }> {
    const allPhotos = [...(department.classroomPhotoUrls || []), ...(department.studentsInClassroomPhotoUrls || [])];
    if (allPhotos.filter(p => p.embedded).length === 0) {
        return { needsUpdate: false }; // No photos to cache.
    }
    const currentSourceId = getClassroomSourceId(department);
    const cached = getCachedDescriptorWithMetadata(`classroom_${department.id}`);

    if (!cached || cached.metadata.source !== currentSourceId) {
        return { needsUpdate: true };
    }
    return { needsUpdate: false };
}

/**
 * Updates the cached descriptors for a department's classroom photos if outdated.
 * @param department - The department whose cache needs updating.
 */
export async function updateClassroomDescriptorsCache(department: Department): Promise<void> {
    const status = await getClassroomCacheStatus(department);
    if (!status.needsUpdate) return;
    
    const faceapi = await getFaceApi();
    const allEmbeddedPhotos = [
        ...(department.classroomPhotoUrls || []),
        ...(department.studentsInClassroomPhotoUrls || [])
    ].filter(p => p.embedded && p.url);

    if (allEmbeddedPhotos.length === 0) {
        clearCachedDescriptor(`classroom_${department.id}`);
        return;
    }

    console.log(`Processing ${allEmbeddedPhotos.length} photos for ${department.name}...`);

    try {
        const descriptorsPromises = allEmbeddedPhotos.map(async (photo) => {
            try {
                const img = await faceapi.fetchImage(photo.url);
                const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
                return detections.map(d => d.descriptor);
            } catch (e) {
                console.error(`Skipping photo due to error: ${photo.url}`, e);
                return []; // Return empty array for failed photos
            }
        });
        
        const descriptorsArrays = await Promise.all(descriptorsPromises);
        const flatDescriptors = descriptorsArrays.flat();
        
        if (flatDescriptors.length > 0) {
            setCachedDescriptor(`classroom_${department.id}`, flatDescriptors, {
                source: getClassroomSourceId(department),
                createdAt: Date.now(),
            });
            console.log(`Classroom descriptor cache updated for ${department.name}.`);
        } else {
            clearCachedDescriptor(`classroom_${department.id}`);
        }
    } catch (error) {
        console.error(`Failed to update classroom descriptor cache for ${department.name}:`, error);
    }
}

// Generic getter for use in verification page, simplified from the metadata version
export function getCachedDescriptor(key: string): Uint8Array | null {
  try {
    const item = getCachedDescriptorWithMetadata(key);
    if (!item) return null;
    return encoder.encode(JSON.stringify(item.descriptor));
  } catch (e) {
    return null;
  }
}
