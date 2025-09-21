import { db } from '@/lib/conf';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, collectionGroup, query, where, writeBatch, documentId } from 'firebase/firestore';
import type { Institution, Department } from '@/lib/types';

const generateSecretCodes = (institution: string, department: string) => {
    const instUpper = institution.replace(/[^A-Z]/g, '');
    const deptUpper = department.replace(/[^A-Z]/g, '');
    return {
        student: `${instUpper}-${deptUpper}-STU-2024`,
        teacher: `${instUpper}-${deptUpper}-TEA-2024`,
        admin: `${instUpper}-${deptUpper}-ADM-2024`,
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
    await addDoc(collection(db, 'institutions'), { name });
};

export const updateInstitutionName = async (id: string, name: string): Promise<void> => {
    const institutionDoc = doc(db, 'institutions', id);
    await updateDoc(institutionDoc, { name });
};

export const createDepartment = async (institutionId: string, departmentName: string): Promise<void> => {
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
    const departmentDoc = doc(db, `institutions/${institutionId}/departments`, departmentId);
    await updateDoc(departmentDoc, { name });
};

export const updateDepartmentSecretCodes = async (institutionId: string, departmentId: string, secretCodes: Department['secretCodes']): Promise<void> => {
    const departmentDoc = doc(db, `institutions/${institutionId}/departments`, departmentId);
    await updateDoc(departmentDoc, { secretCodes });
};
