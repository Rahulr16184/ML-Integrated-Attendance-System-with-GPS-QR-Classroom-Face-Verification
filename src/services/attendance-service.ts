

'use server';

import { db } from '@/lib/conf';
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { AttendanceLog } from '@/lib/types';
import { startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';

/**
 * Adds a new attendance record to the top-level attendance collection.
 * @param attendanceData - The data for the new attendance record, must include studentId.
 * @returns The ID of the newly created document.
 */
export const addAttendanceRecord = async (
    attendanceData: Omit<AttendanceLog, 'id'>
): Promise<string> => {
    if (!attendanceData.studentId) {
        throw new Error("studentId is required to add an attendance record.");
    }
    try {
        const attendanceCol = collection(db, `attendance`);
        const newDocRef = await addDoc(attendanceCol, attendanceData);
        return newDocRef.id;
    } catch (error) {
        console.error("Error adding attendance record: ", error);
        throw new Error("Could not log attendance. Please try again.");
    }
};

/**
 * Updates an existing attendance record in the top-level collection.
 * @param recordId - The ID of the attendance document to update.
 * @param updateData - The data to update.
 */
export const updateAttendanceRecord = async (
    recordId: string,
    updateData: Partial<AttendanceLog>
): Promise<void> => {
    try {
        const recordDocRef = doc(db, `attendance`, recordId);
        await updateDoc(recordDocRef, updateData);
    } catch (error) {
        console.error("Error updating attendance record: ", error);
        throw new Error("Could not update the attendance record.");
    }
};


/**
 * Fetches all attendance records for a specific student within a given semester date range.
 * This function now fetches all records for a student and filters by date in-memory
 * to avoid complex Firestore queries that require a composite index.
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
        const attendanceCol = collection(db, 'attendance');
        
        // Query only by studentId to keep the query simple and avoid index errors.
        const q = query(
            attendanceCol,
            where('studentId', '==', studentId)
        );

        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            return [];
        }

        const allRecords = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as AttendanceLog));

        // Filter the records by date in the application code.
        const filteredRecords = allRecords.filter(record => {
            const recordDate = parseISO(record.date);
            return isWithinInterval(recordDate, { start: startOfDay(from), end: endOfDay(to) });
        });
        
        // Sort in-memory.
        filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return filteredRecords;

    } catch (error) {
        console.error("Error fetching student attendance: ", error);
        throw new Error("Could not fetch attendance records.");
    }
};


/**
 * Fetches a student's attendance record for today in a specific department.
 * @param studentId - The UID of the student.
 * @param departmentId - The ID of the department to check.
 * @returns The attendance log if found, otherwise null.
 */
export const getStudentAttendanceForToday = async (
    studentId: string,
    departmentId: string
): Promise<AttendanceLog | null> => {
    try {
        const todayStart = startOfDay(new Date()).toISOString();
        const todayEnd = endOfDay(new Date()).toISOString();
        
        const attendanceCol = collection(db, 'attendance');
        const q = query(
            attendanceCol,
            where('studentId', '==', studentId),
            where('departmentId', '==', departmentId),
            where('date', '>=', todayStart),
            where('date', '<=', todayEnd)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as AttendanceLog;

    } catch (error) {
        console.error("Error fetching today's attendance record: ", error);
        throw new Error("Could not fetch today's attendance status.");
    }
};

/**
 * Fetches all attendance records for a given department on a specific date.
 * This function is refactored to avoid Firestore indexing errors by fetching
 * all records for a day and then filtering by department on the server.
 * @param institutionId - The ID of the institution (currently unused but kept for API consistency).
 * @param departmentId - The ID of the department to filter by.
 * @param date - The date to fetch records for.
 * @returns An array of attendance logs for the specified department and date.
 */
export const getDepartmentAttendanceByDate = async (institutionId: string, departmentId: string, date: Date): Promise<AttendanceLog[]> => {
    try {
        const dateStart = startOfDay(date).toISOString();
        const dateEnd = endOfDay(date).toISOString();

        const attendanceCol = collection(db, 'attendance');
        
        // Query only by date to avoid needing a composite index.
        const attendanceQuery = query(
            attendanceCol,
            where('date', '>=', dateStart),
            where('date', '<=', dateEnd)
        );

        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        if (attendanceSnapshot.empty) {
            return [];
        }

        // Map and then filter the results in code.
        const allRecordsForDay = attendanceSnapshot.docs.map(recordDoc => ({ id: recordDoc.id, ...recordDoc.data() } as AttendanceLog));
        
        const departmentRecords = allRecordsForDay.filter(record => record.departmentId === departmentId);

        return departmentRecords;

    } catch (error) {
        console.error("Error fetching department attendance by date:", error);
        throw new Error("Could not fetch department attendance records.");
    }
};
