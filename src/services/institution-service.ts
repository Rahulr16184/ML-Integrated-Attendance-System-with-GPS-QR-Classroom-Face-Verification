import { db } from '@/lib/conf';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import type { Institution, Department } from '@/lib/types';

// Helper to generate a set of codes for a new department
const generateSecretCodes = (institutionAcronym: string, departmentAcronym: string) => {
    const year = new Date().getFullYear();
    const instCode = institutionAcronym.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    const deptCode = departmentAcronym.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    return {
        student: `${instCode}-${deptCode}-STU-${year}`,
        teacher: `${instCode}-${deptCode}-TEA-${year}`,
        admin: `${instCode}-${deptCode}-ADM-${year}`,
    };
};


export const getInstitutions = async (): Promise<Institution[]> => {
    const institutionsCol = collection(db, 'institutions');
    const institutionSnapshot = await getDocs(institutionsCol);
    const institutionList = await Promise.all(institutionSnapshot.docs.map(async (institutionDoc) => {
        const institutionData = institutionDoc.data();
        const departmentsCol = collection(db, `institutions/${institutionDoc.id}/departments`);
        const departmentSnapshot = await getDocs(departmentsCol);
        const departmentList: Department[] = departmentSnapshot.docs.map(deptDoc => ({
            id: deptDoc.id,
            ...deptDoc.data(),
        } as Department));
        return {
            id: institutionDoc.id,
            name: institutionData.name,
            departments: departmentList,
        } as Institution;
    }));
    return institutionList;
};

export const createInstitution = async (name: string): Promise<void> => {
    if (!name.trim()) throw new Error("Institution name cannot be empty.");
    await addDoc(collection(db, 'institutions'), { name });
};

export const updateInstitutionName = async (id: string, name: string): Promise<void> => {
    if (!name.trim()) throw new Error("Institution name cannot be empty.");
    const institutionDoc = doc(db, 'institutions', id);
    await updateDoc(institutionDoc, { name });
};

export const deleteInstitution = async (institutionId: string): Promise<void> => {
    // This is a more complex operation, ideally handled by a backend function
    // to ensure atomicity and delete all subcollections (departments, semesters, users, etc.)
    // For client-side, we'll delete the main doc.
    const institutionDoc = doc(db, 'institutions', institutionId);
    await deleteDoc(institutionDoc);
}


export const createDepartment = async (institutionId: string, departmentName: string): Promise<void> => {
    if (!departmentName.trim()) throw new Error("Department name cannot be empty.");
    const institutionDoc = await getDoc(doc(db, 'institutions', institutionId));
    if (!institutionDoc.exists()) {
        throw new Error("Institution not found");
    }
    const institutionName = institutionDoc.data().name;
    const departmentsCol = collection(db, `institutions/${institutionId}/departments`);
    const secretCodes = generateSecretCodes(institutionName, departmentName);
    await addDoc(departmentsCol, { 
        name: departmentName,
        secretCodes: secretCodes
    });
};

export const updateDepartmentName = async (institutionId: string, departmentId: string, name: string): Promise<void> => {
     if (!name.trim()) throw new Error("Department name cannot be empty.");
    const departmentDoc = doc(db, `institutions/${institutionId}/departments`, departmentId);
    await updateDoc(departmentDoc, { name });
};

export const updateDepartmentSecretCodes = async (institutionId: string, departmentId: string, secretCodes: Department['secretCodes']): Promise<void> => {
    const departmentDoc = doc(db, `institutions/${institutionId}/departments`, departmentId);
    await updateDoc(departmentDoc, { secretCodes });
};

export const deleteDepartment = async (institutionId: string, departmentId: string): Promise<void> => {
    const departmentDoc = doc(db, `institutions/${institutionId}/departments`, departmentId);
    await deleteDoc(departmentDoc);
}

    