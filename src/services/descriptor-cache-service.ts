
"use client";

const CACHE_PREFIX = 'face-descriptor-cache-';

/**
 * Caches a face descriptor in sessionStorage.
 * @param key - A unique key for the data (e.g., image URL or a custom ID like 'userProfileImage').
 * @param descriptor - The Float32Array descriptor to cache.
 */
export function cacheDescriptor(key: string, descriptor: Float32Array): void {
  try {
    const serializedDescriptor = JSON.stringify(Array.from(descriptor));
    sessionStorage.setItem(CACHE_PREFIX + key, serializedDescriptor);
  } catch (error) {
    console.error(`Failed to cache descriptor for key "${key}":`, error);
  }
}

/**
 * Retrieves a cached face descriptor from sessionStorage.
 * @param key - The unique key for the data.
 * @returns The cached Float32Array descriptor or null if not found or on error.
 */
export function getCachedDescriptor(key: string): Float32Array | null {
  try {
    const stored = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!stored) {
      return null;
    }
    const parsedArray = JSON.parse(stored);
    return new Float32Array(parsedArray);
  } catch (error) {
    console.error(`Failed to retrieve cached descriptor for key "${key}":`, error);
    return null;
  }
}

/**
 * Caches an array of face descriptors for a classroom.
 * @param departmentId - The ID of the department.
 * @param descriptors - An array of Float32Array descriptors.
 */
export function cacheClassroomDescriptors(departmentId: string, descriptors: Float32Array[]): void {
    try {
        const serializable = descriptors.map(d => Array.from(d));
        sessionStorage.setItem(CACHE_PREFIX + `classroom_${departmentId}`, JSON.stringify(serializable));
    } catch (error) {
        console.error(`Failed to cache classroom descriptors for dept "${departmentId}":`, error);
    }
}

/**
 * Retrieves cached classroom descriptors.
 * @param departmentId - The ID of the department.
 * @returns An array of Float32Array descriptors or null.
 */
export function getCachedClassroomDescriptors(departmentId: string): Float32Array[] | null {
     try {
        const stored = sessionStorage.getItem(CACHE_PREFIX + `classroom_${departmentId}`);
        if (!stored) return null;

        const parsed: number[][] = JSON.parse(stored);
        return parsed.map(d => new Float32Array(d));
    } catch (error) {
        console.error(`Failed to retrieve cached classroom descriptors for dept "${departmentId}":`, error);
        return null;
    }
}
