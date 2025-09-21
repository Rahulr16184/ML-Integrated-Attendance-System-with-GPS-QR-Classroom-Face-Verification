
import { auth, db } from '@/lib/conf';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';

// This is a much improved user registration flow.

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
