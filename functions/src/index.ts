import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import sendGridMail from "@sendgrid/mail";
import * as crypto from "crypto"; // Node's crypto library for hashing

// Initialize Firebase Admin
admin.initializeApp();

// Retrieve SendGrid API Key from Firebase config
const SENDGRID_API_KEY = functions.config().sendgrid.key;

// Check if the API key exists
if (!SENDGRID_API_KEY) {
    console.error("SendGrid API key is missing in Firebase config.");
} else {
    sendGridMail.setApiKey(SENDGRID_API_KEY);
    console.log("SendGrid API key successfully set.");
}

// Define a custom error type for SendGrid errors
interface SendGridError extends Error {
    code?: string;
    response?: {
        body: any;
    };
}

// Callable Function for Sending PIN Code Email using SendGrid
export const sendPinCodeEmail = functions
    .region("europe-west1")
    .runWith({ timeoutSeconds: 300, memory: "512MB" })
    .https.onCall(async (data, context) => {
        console.log("Function 'sendPinCodeEmail' invoked.");

        // Ensure the user is authenticated
        if (!context.auth) {
            console.error("Authentication required to call this function.");
            throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
        }

        const userId = context.auth.uid;
        const recipientEmail = data.email;

        if (!recipientEmail) {
            console.error("The function must be called with a recipient email.");
            throw new functions.https.HttpsError("invalid-argument", "The function must be called with a recipient email.");
        }

        console.log("Recipient email validated:", recipientEmail);

        // Generate a 5-digit PIN
        const pin = Math.floor(10000 + Math.random() * 90000).toString();
        console.log("Generated PIN:", pin);

        // Hash the PIN (using SHA-256)
        const hashedPin = crypto.createHash("sha256").update(pin).digest("hex");

        // Set expiration time (5 minutes)
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 5);

        const userDocRef = admin.firestore().collection("pins").doc(userId);
        try {
            console.log("Attempting to store hashed PIN in Firestore for userId:", userId);
            await userDocRef.set({
                hashedPin,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: expirationTime,
            });
            console.log("Hashed PIN stored in Firestore successfully for userId:", userId);
        } catch (firestoreError) {
            console.error("Error storing hashed PIN in Firestore:", firestoreError);
            throw new functions.https.HttpsError("internal", "Failed to store hashed PIN in Firestore.");
        }

        // Prepare the message to send using the SendGrid template
        const msg = {
            to: recipientEmail,
            from: "Arguslocks@gmail.com",
            subject: "Your Verification PIN",
            templateId: "d-437f3323fad340c192304929c261fc83", // Replace with your actual Template ID
            dynamicTemplateData: {
                pin, // Unhashed PIN for sending
            },
        };

        console.log("Prepared SendGrid message object:", msg);

        try {
            console.log("Attempting to send email via SendGrid...");
            const response = await sendGridMail.send(msg);
            console.log("SendGrid response:", response[0]);
            console.log("Email sent successfully to", recipientEmail);
            return { status: "success", message: "Email sent successfully." };
        } catch (error) {
            const err = error as SendGridError;
            console.error("Error sending email with SendGrid:", {
                message: err.message,
                code: err.code,
                response: err.response ? err.response.body : "No response body",
            });
            throw new functions.https.HttpsError("internal", "Failed to send email with template.");
        }
    });
