
# Project Report: TRACEIN - Intelligent Attendance System

## 1. Introduction

**TRACEIN** is a modern, intelligent attendance management system designed for educational institutions. It moves beyond traditional methods by integrating a multi-modal verification system to ensure accuracy, security, and ease of use.

### 1.1. Technology Stack

The platform is built on a robust and modern technology stack:
- **Frontend**: Next.js, React, TypeScript for a type-safe, performant, and scalable user interface.
- **UI/UX**: Tailwind CSS with ShadCN UI components for a modern, responsive, and customizable design system.
- **Backend & Database**: Firebase, including:
    - **Authentication**: For secure user login (email/password and Google).
    - **Firestore**: As the NoSQL database for storing all application data like user profiles, institution structures, and attendance records.
    - **Cloudinary**: Used for optimized cloud-based image storage (profile pictures, verification photos).
- **Facial Recognition (Client-Side)**: `face-api.js` for executing lightweight ML models directly in the browser, ensuring fast and private face descriptor generation and comparison.
- **Generative AI (Server-Side)**: Google's Genkit for advanced server-side AI tasks, such as analyzing image quality for profile pictures.

### 1.2. Folder Structure

The project follows a standard Next.js App Router structure with some key organizational choices:

```
src/
├── app/                  # Main application routes (App Router)
│   ├── (public)/         # Routes accessible to unauthenticated users (e.g., landing page)
│   ├── [role]-dashboard/ # Dashboard layouts and pages for each user role
│   ├── [role]-profile/   # Profile management pages for each user
│   └── api/              # API routes (if any)
├── components/           # Reusable React components
│   └── ui/               # Unmodified ShadCN UI components
├── services/             # Backend logic (Firebase interactions, data services)
├── hooks/                # Custom React hooks (e.g., useUserProfile)
├── lib/                  # Core utilities, Firebase config, types, and ML model loaders
└── ai/                   # Genkit flows and AI-related logic
```

---

## 2. Role-Based Access Control (RBAC)

The application implements a granular, role-based access system to ensure users only have access to relevant features.

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| **Student** | The end-user who marks attendance. | - View personal dashboard & attendance summary.<br>- Mark attendance using enabled modes.<br>- View detailed personal attendance calendar.<br>- Manage personal profile. |
| **Teacher** | Manages attendance for their assigned departments. | - All Student permissions.<br>- **Configure** attendance modes (GPS, QR, etc.) for departments.<br>- **Generate** temporary QR codes and classroom bypass codes.<br>- **View and modify** attendance records for students in their departments.<br>- Manage department settings like working days and holidays. |
| **Admin** | Manages multiple departments within an institution. | - All Teacher permissions across all their assigned departments.<br>- Can join any department within their institution using the admin secret code. |
| **Server** | A super-admin role for system-wide management. | - Create and manage institutions.<br>- Create and manage departments within any institution.<br>- Manage user accounts (future capability).<br>- Manage the global application theme. |

---

## 3. Core Technology & Verification Logic

TRACEIN's strength lies in its multi-layered verification process. Below are the core technical implementations.

### 3.1. GPS Geofencing Verification

This step ensures the student is within a predefined geographical area.

- **Configuration (`/src/app/gps/page.tsx`)**: An admin/teacher uses a Leaflet map to set a central point and a radius for a department. This data (`location` and `radius`) is saved to the department's document in Firestore.

- **Verification (`/src/app/verify-gps/page.tsx`)**: When a student initiates verification, the app:
    1. Fetches the department's configured `location` and `radius`.
    2. Requests the user's current GPS coordinates using the browser's `navigator.geolocation` API.
    3. Calculates the distance between the student's location and the department's central point.

```javascript
// From /src/app/verify-gps/page.tsx

// Haversine formula to calculate distance in meters
const getDistance = (from, to) => {
    const R = 6371e3; // metres
    const φ1 = from.lat * Math.PI / 180;
    const φ2 = to.lat * Math.PI / 180;
    const Δφ = (to.lat - from.lat) * Math.PI / 180;
    const Δλ = (to.lng - from.lng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

// Verification logic
const distance = getDistance(currentUserLocation, department.location);
if (distance <= (department.radius || 100)) {
    setStatusMessage(`Location verified!`);
    setStatus('success');
    // Proceed to next step
} else {
    setStatusMessage(`You are ${distance.toFixed(0)}m away. Move into the designated zone.`);
    setStatus('failed');
}
```

### 3.2. Classroom & Face Verification (`face-api.js`)

This is the core ML-driven verification, handled entirely on the client side for speed and privacy.

- **Model Loading (`/src/lib/face-api.ts`)**: On app startup, the required `face-api.js` models (`ssdMobilenetv1`, `faceLandmark68Net`, `faceRecognitionNet`, `faceExpressionNet`) are loaded from a CDN and cached.

- **Descriptor Caching (`/src/services/system-cache-service.ts`)**:
    - When a user uploads a profile picture, a face descriptor (a 128-element Float32Array vector representing their face) is generated and stored in the browser's `sessionStorage`.
    - This prevents re-computing the descriptor on every verification attempt. The cache is invalidated if the user uploads a new profile picture.

- **Face Verification Flow (`/src/app/verify-face/page.tsx`)**:
    1.  The student's video stream is captured via `navigator.mediaDevices.getUserMedia`.
    2.  The cached descriptor for the student's profile is retrieved.
    3.  A detection loop runs continuously on the video feed.
    4.  **Similarity Check**: In each frame, a face is detected, and its descriptor is computed. This is compared against the student's cached descriptor using Euclidean distance. If the similarity is above a threshold (e.g., > 55%), the identity is confirmed.
    5.  **Liveness Check**: To prevent spoofing with a photo, the user is then prompted to perform a liveness action (e.g., smile). The `faceExpressionNet` model checks for a high "happy" expression score.
    6.  **Final Capture**: Once both checks pass, a final photo is captured, which includes the student and the classroom background, and is stored as proof.

```javascript
// Simplified logic from /src/app/verify-face/page.tsx

const SIMILARITY_THRESHOLD = 0.55;
const SMILE_THRESHOLD = 0.8;

async function detectFace() {
    // ...
    const faceapi = await getFaceApi();
    
    // Status: 'scanning' for similarity
    const detection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

    if (detection) {
        const distance = faceapi.euclideanDistance(detection.descriptor, userDescriptor);
        const similarity = 1 - distance;

        if (similarity > SIMILARITY_THRESHOLD) {
            setStatus('liveness'); // Move to next check
        }
    }

    // Status: 'liveness' check
    const expressionDetection = await faceapi.detectSingleFace(videoRef.current)
        .withFaceExpressions();

    if (expressionDetection.expressions.happy > SMILE_THRESHOLD) {
        setStatus('positioning'); // Liveness passed, prepare for final photo
        captureFinalImage();
    }
}
```

### 3.3. QR Code & Classroom Code Verification

These modes provide alternatives to camera-based classroom verification.

- **Generation**:
    - **QR Code (`/src/app/qr-generator/page.tsx`)**: A teacher can start a generator that displays a QR code containing a unique, time-stamped token.
    - **Classroom Code (`/src/app/classroom-code-generator/page.tsx`)**: A teacher generates a 6-digit numeric code that is stored in Firestore with a short expiry time (e.g., 2 minutes).

- **Verification**:
    - **QR Scan (`/src/app/verify-qr/page.tsx`)**: The student scans the QR code. The app uses the `jsQR` library to decode the token from the camera feed and validates that it is correctly formatted and intended for their department.
    - **Code Input (`/src/app/verify-classroom/page.tsx`)**: The student enters the 6-digit code. The app calls a Firebase service function (`verifyClassroomCode`) to check if the code matches the one stored for the department and has not expired.

```typescript
// From /src/services/institution-service.ts
export const verifyClassroomCode = async (institutionId: string, departmentId: string, code: string): Promise<{ success: boolean, message: string }> => {
    const departmentDocRef = doc(db, `institutions/${institutionId}/departments`, departmentId);
    const departmentDoc = await getDoc(departmentDocRef);
    // ...
    const storedCodeData = departmentData.classroomCode;

    if (storedCodeData.expiresAt.toMillis() < Date.now()) {
        return { success: false, message: "The code has expired." };
    }
    if (storedCodeData.code !== code) {
        return { success: false, message: "Invalid code." };
    }

    // Clear the code to make it single-use or prevent replay
    await updateDoc(departmentDocRef, { classroomCode: null });
    return { success: true, message: "Code verified successfully." };
};
```

---

## 4. End-to-End User Scenarios

### Scenario 1: Configuration by a Teacher

1.  **Login**: A teacher logs into their account.
2.  **Navigate**: They open the sidebar and navigate to **"MA Modes"**.
3.  **Select Department**: They choose the "Computer Science" department from the dropdown.
4.  **Enable Mode**: They see two modes available. They enable "Mode 1 (GPS + Classroom + Face)" by toggling the switch.
5.  **Save**: They click "Save Changes". The settings are instantly updated in Firestore for that department. Now, students in the "Computer Science" department can only mark attendance using Mode 1.

### Scenario 2: Student Marks Attendance (Mode 1)

1.  **Login**: A student logs into their account.
2.  **Navigate**: They go to the **"Mark Attendance"** page.
3.  **Select Department**: They choose "Computer Science". The UI shows that only Mode 1 is active.
4.  **Start Verification**: They click "Start Verification".
5.  **Step 1: GPS Check (`/verify-gps`)**: The app automatically gets their location. It calculates the distance to the pre-configured geofence.
    - **Success**: If they are within the radius, a success message appears, and they are automatically redirected to the next step.
    - **Failure**: If they are outside, an error message shows their distance from the zone, and they are prompted to move closer.
6.  **Step 2: Classroom Verification (`/verify-classroom`)**: The student is prompted to confirm they are in the classroom using their back-facing camera.
7.  **Step 3: Face & Liveness Check (`/verify-face`)**:
    - The front-facing camera starts. The app verifies their face against their profile picture's cached descriptor.
    - After face verification, it prompts them to smile for the liveness check.
    - Upon success, a final photo is taken, capturing the student and the background.
8.  **Store Record**: The attendance record, including the final photo URL, timestamp, and location, is saved to the `attendance` subcollection under the student's user document in Firestore.

### Scenario 3: Data Visualization and Modification

1.  **Student View**: The student navigates to the **"View Attendance"** page. They see a calendar where today's date is now colored green ("Present"). Clicking the date shows the verification photo and time.
2.  **Teacher/Admin View**: A teacher logs in and navigates to **"MA Records"**.
    - They select the "Computer Science" department and the student's name.
    - They see the same calendar view.
    - They click on the green date. In the details dialog, they see the student's verification photo and all metadata.
3.  **Altering a Record**: The teacher suspects the student left after marking attendance.
    - They click the **"Mark as Absent"** button in the dialog.
    - A new dialog appears, asking for a reason (e.g., "Student was not present during a spot check at 11 AM").
    - After confirming, the record's status in Firestore is updated to **"Conflict"**, and the reason is stored in the `notes` field.
    - On the calendar, the date now appears yellow ("Conflict"), serving as a record of the discrepancy for future auditing.

### 4.1. Calendar Overview & Statistics

Both students and staff have access to a powerful attendance overview that provides at-a-glance statistics for a selected semester. This feature is crucial for tracking progress and identifying issues.

The following metrics are calculated and displayed:
- **Total Working Days**: The total number of working days in the selected semester, excluding weekends and predefined holidays.
- **Working Days Passed**: The number of working days that have occurred from the start of the semester up to the current date.
- **Present**: The total count of days the student was marked "Present."
- **Absent**: The count of working days that have passed where the student has no attendance record.
- **Approved**: The count of days the student was manually marked as "Approved Present" by a teacher or admin, typically for valid reasons like medical leave.
- **Conflict**: The count of days where a student's "Present" record was later overridden and marked as absent by a staff member.
- **Revoked**: The count of days where a previously "Approved" status was revoked by a staff member.
- **Holidays**: The total number of holidays defined for the semester.
- **Remaining Days**: The number of calendar days left until the end of the semester.
- **Attendance %**: The percentage of attendance, calculated as `(Present + Approved) / (Working Days Passed)`.

This combination of automated verification and manual oversight creates a flexible yet powerful attendance system.
