
'use server';

import { db } from '@/lib/conf';
import { collection, addDoc } from 'firebase/firestore';
import type { AttendanceLog } from '@/lib/types';

/**
 * Adds a new attendance record to a specific department.
 * @param institutionId - The ID of the institution.
 * @param departmentId - The ID of the department.
 * @param attendanceData - The data for the new attendance record.
 * @returns The ID of the newly created document.
 */
export const addAttendanceRecord = async (
    institutionId: string, 
    departmentId: string, 
    attendanceData: Omit<AttendanceLog, 'id'>
): Promise<string> => {
    try {
        const attendanceCol = collection(db, `institutions/${institutionId}/departments/${departmentId}/attendance`);
        const newDocRef = await addDoc(attendanceCol, attendanceData);
        return newDocRef.id;
    } catch (error) {
        console.error("Error adding attendance record: ", error);
        throw new Error("Could not log attendance. Please try again.");
    }
};

