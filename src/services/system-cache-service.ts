

"use client";

import { getFaceApi } from "@/lib/face-api";
import type { Department, UserProfile } from "@/lib/types";

// Using a TextEncoder to store as Uint8Array for potential performance benefits,
// although JSON stringify would also work.
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const CACHE_PREFIX = 'system-cache-v1-';

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
function getCachedDescriptorWithMetadata(key: string): { descriptor: any, metadata: CacheMetadata } | null {
    try {
        const stored = sessionStorage.getItem(CACHE_PREFIX + key);
        if (!stored) return null;

        const parsed = JSON.parse(stored);
        if (!parsed.descriptor || !parsed.metadata) return null;
        
        return parsed;
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
    const cached = getCachedDescriptorWithMetadata(userProfile.uid);
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
            setCachedDescriptor(userProfile.uid, detection.descriptor, {
                source: userProfile.profileImage,
                createdAt: Date.now(),
            });
            console.log('User profile descriptor cache updated.');
        } else {
             clearCachedDescriptor(userProfile.uid);
        }
    } catch (error) {
        console.error("Failed to update profile descriptor cache:", error);
    }
}


// --- Classroom Photos Caching ---

const getClassroomSourceId = (photos: ClassroomPhoto[]) => {
    const allEmbeddedUrls = photos.filter(p => p.embedded && p.url).map(p => p.url).sort();
    if (allEmbeddedUrls.length === 0) return 'no-photos';
    
    return allEmbeddedUrls.reduce((hash, url) => {
        for (let i = 0; i < url.length; i++) {
          const char = url.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash |= 0;
        }
        return hash;
    }, 0).toString();
};

export async function getClassroomCacheStatus(department: Department): Promise<{ needsUpdate: boolean }> {
    const envPhotos = department.classroomPhotoUrls || [];
    const studentPhotos = department.studentsInClassroomPhotoUrls || [];
    
    if (envPhotos.filter(p=>p.embedded).length === 0 && studentPhotos.filter(p=>p.embedded).length === 0) {
        return { needsUpdate: false };
    }
    
    const currentEnvSourceId = getClassroomSourceId(envPhotos);
    const cachedEnv = getCachedDescriptorWithMetadata(`classroom-env_${department.id}`);
    if (!cachedEnv || cachedEnv.metadata.source !== currentEnvSourceId) {
        return { needsUpdate: true };
    }

    const currentStudentSourceId = getClassroomSourceId(studentPhotos);
    const cachedStudent = getCachedDescriptorWithMetadata(`classroom-student_${department.id}`);
    if (!cachedStudent || cachedStudent.metadata.source !== currentStudentSourceId) {
        return { needsUpdate: true };
    }

    return { needsUpdate: false };
}


const processAndCachePhotos = async (photos: ClassroomPhoto[], cacheKey: string) => {
    if (photos.length === 0) {
        clearCachedDescriptor(cacheKey);
        return;
    }
    
    const faceapi = await getFaceApi();
    const descriptorsPromises = photos.map(async (photo) => {
        try {
            const img = await faceapi.fetchImage(photo.url);
            const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
            return detections.map(d => d.descriptor);
        } catch (e) {
            console.error(`Skipping photo due to error: ${photo.url}`, e);
            return [];
        }
    });

    const descriptorsArrays = await Promise.all(descriptorsPromises);
    const flatDescriptors = descriptorsArrays.flat();
    
    if (flatDescriptors.length > 0) {
        setCachedDescriptor(cacheKey, flatDescriptors, {
            source: getClassroomSourceId(photos),
            createdAt: Date.now(),
        });
        console.log(`Cache updated for ${cacheKey}.`);
    } else {
        clearCachedDescriptor(cacheKey);
    }
};

export async function updateClassroomDescriptorsCache(department: Department): Promise<void> {
    const envPhotos = department.classroomPhotoUrls?.filter(p => p.embedded && p.url) || [];
    const studentPhotos = department.studentsInClassroomPhotoUrls?.filter(p => p.embedded && p.url) || [];
    
    await processAndCachePhotos(envPhotos, `classroom-env_${department.id}`);
    await processAndCachePhotos(studentPhotos, `classroom-student_${department.id}`);
}


// Generic getter for use in verification page, simplified from the metadata version
export function getCachedDescriptor(key: string): Uint8Array | null {
  try {
    const item = getCachedDescriptorWithMetadata(key);
    if (!item) return null;
    return encoder.encode(JSON.stringify(item));
  } catch (e) {
    return null;
  }
}

    