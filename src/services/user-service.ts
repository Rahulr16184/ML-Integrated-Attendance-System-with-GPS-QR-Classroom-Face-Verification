

import { auth, db, CLOUDINARY_UPLOAD_URL, CLOUDINARY_UPLOAD_PRESET } from '@/lib/conf';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, query, where, getDoc, updateDoc } from 'firebase/firestore';

// This is a much improved user registration flow.

export type UserProfile = {
    uid: string;
    name: string;
    email: string;
    institutionId: string;
    departmentId: string;
    role: string;
    isActivated: boolean;
    createdAt: string;
    dob?: string;
    gender?: string;
    altEmail?: string;
    phone?: string;
    rollNo?: string;
    registerNo?: string;
    profileImage?: string;
    institutionName?: string;
    departmentName?: string;
};

type UserRegistrationData = {
    name: string;
    email: string;
    password: string; 
    institutionId: string;
    departmentId: string;
    role: string;
};

export const registerUser = async (userData: UserRegistrationData): Promise<void> => {
    try {
        // 1. Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const user = userCredential.user;

        // 2. Send email verification
        await sendEmailVerification(user);

        // 3. Save user data to Firestore (without the password)
        // We use the user's UID from Auth as the document ID in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: userData.name,
            email: userData.email,
            institutionId: userData.institutionId,
            departmentId: userData.departmentId,
            role: userData.role,
            isActivated: user.emailVerified, // This will be false initially
            createdAt: new Date().toISOString(),
        });

        console.log(`Verification email sent to ${userData.email}.`);

    } catch (error: any) {
        console.error("Error registering user: ", error);
        // Provide more specific error messages
        if (error.code === 'auth/email-already-in-use') {
            throw new Error("This email address is already in use.");
        } else if (error.code === 'auth/weak-password') {
            throw new Error("The password is too weak. Please use a stronger password.");
        }
        throw new Error("Could not register user. Please try again.");
    }
};

export const getUserData = async (email: string): Promise<UserProfile | null> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log('No matching user found.');
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        let institutionName = 'N/A';
        if (userData.institutionId) {
            const instDoc = await getDoc(doc(db, 'institutions', userData.institutionId));
            if (instDoc.exists()) {
                institutionName = instDoc.data().name;
            }
        }

        let departmentName = 'N/A';
        if (userData.institutionId && userData.departmentId) {
            const deptDoc = await getDoc(doc(db, `institutions/${userData.institutionId}/departments`, userData.departmentId));
            if (deptDoc.exists()) {
                departmentName = deptDoc.data().name;
            }
        }
        
        return {
            uid: userDoc.id,
            ...userData,
            institutionName,
            departmentName,
        } as UserProfile;

    } catch (error) {
        console.error("Error fetching user data:", error);
        return null;
    }
}

export const uploadImage = async (file: string): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET!);

  const response = await fetch(CLOUDINARY_UPLOAD_URL!, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Image upload failed');
  }

  const data = await response.json();
  return data.secure_url;
};

export const updateUser = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
};

