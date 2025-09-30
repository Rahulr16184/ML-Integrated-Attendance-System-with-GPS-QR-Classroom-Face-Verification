

import { db } from '@/lib/conf';
import { collection, getDocs, addDoc, doc, updateDoc, getDoc, writeBatch, deleteDoc, arrayUnion, arrayRemove, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Department, Institution, ClassroomPhoto } from '@/lib/types';

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
        const departmentList: Department[] = departmentSnapshot.docs.map(deptDoc => {
             const data = deptDoc.data();
            // Convert Firestore Timestamps to numbers if they exist
            if (data.classroomCode && data.classroomCode.expiresAt instanceof Timestamp) {
                data.classroomCode.expiresAt = data.classroomCode.expiresAt.toMillis();
            }
            return {
                id: deptDoc.id,
                ...data,
            } as Department;
        });

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

export const updateDepartmentGps = async (institutionId: string, departmentId: string, location: { lat: number; lng: number }, radius: number): Promise<void> => {
    const departmentDoc = doc(db, `institutions/${institutionId}/departments`, departmentId);
    await updateDoc(departmentDoc, { location, radius });
};
    
export const addClassroomPhoto = async (
    institutionId: string,
    departmentId: string,
    photoType: 'classroomPhotoUrls' | 'studentsInClassroomPhotoUrls',
    imageUrl: string
): Promise<void> => {
    const departmentDocRef = doc(db, `institutions/${institutionId}/departments`, departmentId);
    const newPhoto: ClassroomPhoto = { url: imageUrl, embedded: false };
    await updateDoc(departmentDocRef, { [photoType]: arrayUnion(newPhoto) });
};


export const deleteClassroomPhoto = async (
    institutionId: string,
    departmentId: string,
    photoType: 'classroomPhotoUrls' | 'studentsInClassroomPhotoUrls',
    photoToDelete: ClassroomPhoto
): Promise<void> => {
    const departmentDocRef = doc(db, `institutions/${institutionId}/departments`, departmentId);
    await updateDoc(departmentDocRef, { [photoType]: arrayRemove(photoToDelete) });
};

export const embedPhotos = async (
    institutionId: string,
    departmentId: string,
    photoType: 'classroomPhotoUrls' | 'studentsInClassroomPhotoUrls'
): Promise<ClassroomPhoto[]> => {
    const departmentDocRef = doc(db, `institutions/${institutionId}/departments`, departmentId);
    const departmentDoc = await getDoc(departmentDocRef);
    if (!departmentDoc.exists()) {
        throw new Error("Department not found");
    }

    const departmentData = departmentDoc.data() as Department;
    const existingPhotos: ClassroomPhoto[] = departmentData[photoType] || [];

    const updatedPhotos = existingPhotos.map(photo => 
        !photo.embedded ? { ...photo, embedded: true } : photo
    );

    // The actual ML processing is now triggered on the client-side.
    // This server function just updates the flags in the database.
    await updateDoc(departmentDocRef, { [photoType]: updatedPhotos });

    return updatedPhotos;
};
    
export const updateDepartmentModes = async (institutionId: string, departmentId: string, modes: Department['modes']): Promise<void> => {
    const departmentDoc = doc(db, `institutions/${institutionId}/departments`, departmentId);
    await updateDoc(departmentDoc, { modes });
};


export const generateClassroomCode = async (institutionId: string, departmentId: string): Promise<string> => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes from now

    const departmentDoc = doc(db, `institutions/${institutionId}/departments`, departmentId);
    await updateDoc(departmentDoc, {
        classroomCode: {
            code,
            expiresAt
        }
    });
    return code;
};


export const verifyClassroomCode = async (institutionId: string, departmentId: string, code: string): Promise<{ success: boolean, message: string }> => {
    const departmentDocRef = doc(db, `institutions/${institutionId}/departments`, departmentId);
    const departmentDoc = await getDoc(departmentDocRef);

    if (!departmentDoc.exists()) {
        return { success: false, message: "Department not found." };
    }

    const departmentData = departmentDoc.data() as Department;
    const storedCode = departmentData.classroomCode;

    if (!storedCode || !storedCode.code) {
        return { success: false, message: "No active code for this department." };
    }

    if (storedCode.expiresAt < Date.now()) {
        return { success: false, message: "The code has expired." };
    }

    if (storedCode.code !== code) {
        return { success: false, message: "Invalid code." };
    }

    // Optional: Clear code after successful verification to make it single-use
    await updateDoc(departmentDocRef, { classroomCode: null });

    return { success: true, message: "Code verified successfully." };
};

export const clearClassroomCode = async (institutionId: string, departmentId: string): Promise<void> => {
    const departmentDoc = doc(db, `institutions/${institutionId}/departments`, departmentId);
    await updateDoc(departmentDoc, { classroomCode: null });
}
