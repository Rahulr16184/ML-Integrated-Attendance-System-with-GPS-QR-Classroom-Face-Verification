
import { db } from '@/lib/conf';
import { collection, addDoc } from 'firebase/firestore';

// NOTE: In a real-world application, you should NEVER store passwords in plaintext.
// This is a simplified example. Use Firebase Authentication for secure user management.

type UserRegistrationData = {
    name: string;
    email: string;
    password: string; // Plaintext password, for demonstration only.
    institutionId: string;
    departmentId: string;
    role: string;
};

export const registerUser = async (userData: UserRegistrationData): Promise<void> => {
    try {
        await addDoc(collection(db, 'users'), {
            name: userData.name,
            email: userData.email,
            password: userData.password, // Storing plaintext password - NOT FOR PRODUCTION
            institutionId: userData.institutionId,
            departmentId: userData.departmentId,
            role: userData.role,
            isActivated: false, // Account is not active until email verification
            createdAt: new Date().toISOString(),
        });

        // In a real application, you would trigger an email sending service here
        // to send an activation link to the user's email.
        console.log(`Activation link for ${userData.email} would be sent here.`);

    } catch (error) {
        console.error("Error registering user: ", error);
        throw new Error("Could not register user in the database.");
    }
};

    