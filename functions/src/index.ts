import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import sendGridMail from "@sendgrid/mail";

// Initialize Firebase Admin
admin.initializeApp();

// Use the SendGrid key from the Firebase config
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

// Function for Sending PIN Code Email using SendGrid
export const sendPinCodeEmail = functions
    .region("https://europe-west1-iot-lock-982b9.cloudfunctions.net/sendPinCodeEmail")
    .runWith({ timeoutSeconds: 300, memory: "512MB" })
    .https.onRequest(async (req, res) => {
        console.log("Received request to send PIN email", { query: req.query });

        // Validate query parameters
        const recipientEmail = req.query.to as string;
        if (!recipientEmail) {
            console.error("Missing recipient email");
            res.status(400).send("Missing recipient email.");
            return;
        }

        // Generate a 5-digit PIN
        const pin = Math.floor(10000 + Math.random() * 90000).toString();
        console.log("Generated PIN for email", { recipientEmail, pin });

        // Store the PIN in Firestore with a timestamp
        const userDocRef = admin.firestore().collection("pins").doc(recipientEmail);
        const createdAt = admin.firestore.FieldValue.serverTimestamp();
        try {
            await userDocRef.set({
                pin,
                createdAt,
                requestCount: admin.firestore.FieldValue.increment(1),
            });
            console.log("Stored PIN in Firestore", { recipientEmail, pin });
        } catch (firestoreError) {
            console.error("Error storing PIN in Firestore:", firestoreError);
            res.status(500).send("Failed to store PIN in Firestore.");
            return;
        }

        // Prepare the message to send using the SendGrid template
        const msg = {
            to: recipientEmail,
            from: "Arguslocks@gmail.com", // Ensure this sender email is verified in SendGrid
            templateId: "d-437f3323fad340c192304929c261fc83", // Replace with your actual Template ID
            dynamicTemplateData: {
                pin, // This matches the placeholder name {{pin}} in your template
            },
        };

        console.log("Prepared message object for SendGrid", { msg });

        try {
            // Send the email using SendGrid and log the response
            const response = await sendGridMail.send(msg);
            console.log("SendGrid email response", response[0]);
            console.log("Email sent successfully using template", { recipientEmail });
            res.status(200).send("Email sent successfully.");
        } catch (error) {
            const err = error as SendGridError;
            console.error("Error sending email with template", {
                message: err.message,
                code: err.code,
                response: err.response ? err.response.body : "No response body",
            });
            res.status(500).send("Failed to send email with template.");
        }
    });
