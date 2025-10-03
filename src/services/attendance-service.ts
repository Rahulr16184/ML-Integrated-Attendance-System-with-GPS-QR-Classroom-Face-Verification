
'use server';

import { db } from '@/lib/conf';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { AttendanceLog } from '@/lib/types';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * Adds a new attendance record to a specific student's subcollection.
 * @param studentId - The UID of the student.
 * @param attendanceData - The data for the new attendance record.
 * @returns The ID of the newly created document.
 */
export const addAttendanceRecord = async (
    studentId: string,
    attendanceData: Omit<AttendanceLog, 'id'>
): Promise<string> => {
    try {
        const attendanceCol = collection(db, `users/${studentId}/attendance`);
        const newDocRef = await addDoc(attendanceCol, attendanceData);
        return newDocRef.id;
    } catch (error) {
        console.error("Error adding attendance record: ", error);
        throw new Error("Could not log attendance. Please try again.");
    }
};

/**
 * Fetches all attendance records for a specific student within a given semester date range.
 * @param studentId - The UID of the student.
 * @param from - The start date of the range.
 * @param to - The end date of the range.
 * @returns An array of attendance logs.
 */
export const getStudentAttendance = async (
    studentId: string,
    from: Date,
    to: Date
): Promise<AttendanceLog[]> => {
    try {
        const attendanceCol = collection(db, `users/${studentId}/attendance`);
        
        // Firestore queries require ISO strings for date comparisons
        const q = query(
            attendanceCol,
            where('date', '>=', from.toISOString()),
            where('date', '<=', endOfDay(to).toISOString()),
            orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return [];
        }

        const records = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as AttendanceLog));

        return records;

    } catch (error) {
        console.error("Error fetching student attendance: ", error);
        throw new Error("Could not fetch attendance records.");
    }
};
