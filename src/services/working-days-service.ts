
'use server';

import { db } from '@/lib/conf';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { Semester } from '@/lib/types';

const getSemestersCollection = (institutionId: string, departmentId: string) => {
    return collection(db, `institutions/${institutionId}/departments/${departmentId}/semesters`);
}

// Get all semesters for a specific batch
export const getSemesters = async (institutionId: string, departmentId: string, batch: string): Promise<Semester[]> => {
    const semestersCol = getSemestersCollection(institutionId, departmentId);
    const q = query(semestersCol, where("batch", "==", batch));
    const semesterSnapshot = await getDocs(q);
    
    return semesterSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Semester));
};

// Create or update a semester
export const saveSemester = async (institutionId: string, departmentId: string, semesterData: Omit<Semester, 'id'> & { id?: string }): Promise<string> => {
    const { id, ...data } = semesterData;
    const semestersCol = getSemestersCollection(institutionId, departmentId);
    
    if (id) {
        // Update existing semester
        const semesterDoc = doc(db, semestersCol.path, id);
        await updateDoc(semesterDoc, data);
        return id;
    } else {
        // Create new semester
        const newSemesterDoc = await addDoc(semestersCol, data);
        return newSemesterDoc.id;
    }
};

// Delete a semester
export const deleteSemester = async (institutionId: string, departmentId: string, semesterId: string): Promise<void> => {
    const semesterDoc = doc(db, getSemestersCollection(institutionId, departmentId).path, semesterId);
    await deleteDoc(semesterDoc);
};

    
