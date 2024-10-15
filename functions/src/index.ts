import * as functions from "firebase-functions/v1"; // Import v1 functions
import * as admin from "firebase-admin";
import sendGridMail from "@sendgrid/mail"; // Use default import for SendGrid
import * as logger from "firebase-functions/logger";
import { Request, Response } from "express"; // Import the types for req and res

// Initialize Firebase Admin
admin.initializeApp();

// Use the SendGrid key from the Firebase config
const SENDGRID_API_KEY = functions.config().sendgrid.key;

// Properly configure SendGrid
sendGridMail.setApiKey(SENDGRID_API_KEY); // Correct method call

// --------------------- v1 function (email sending with PIN generation) -------------------------
export const sendEmail = functions
  .region('europe-west1')  // Set region to Europe for v1
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req: Request, res: Response) => {
    logger.info('Received request to send email', { query: req.query }); // Log the incoming request

    // Validate query parameters
    const recipientEmail = req.query.to as string;
    if (!recipientEmail) {
      logger.error('Missing recipient email'); // Log missing parameters
      res.status(400).send('Missing recipient email.'); // Respond with 400 status
      return; // Ensure we exit the function here
    }

    // Generate a 5-digit PIN
    const pin = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit PIN
    logger.info(`Generated PIN: ${pin}`, { recipientEmail }); // Log the generated PIN

    // Store the PIN in Firestore with a timestamp
    const userDocRef = admin.firestore().collection('pins').doc(recipientEmail);
    const createdAt = admin.firestore.FieldValue.serverTimestamp();
    try {
      await userDocRef.set({
        pin,
        createdAt,
        requestCount: admin.firestore.FieldValue.increment(1), // Increment request count
      });
      logger.info(`Stored PIN for ${recipientEmail} in Firestore`); // Log Firestore action
    } catch (firestoreError) {
      logger.error("Error storing PIN in Firestore:", firestoreError); // Log Firestore error
      res.status(500).send("Failed to store PIN in Firestore."); // Respond with error
      return; // Exit on error
    }

    // Send the email with the PIN
    const msg = {
      to: recipientEmail,
      from: "Arguslocks@gmail.com", // Sender's email
      subject: "Your Verification PIN",
      text: `Your verification PIN is: ${pin}`,
      html: `<strong>Your verification PIN is: ${pin}</strong>`,
    };

    try {
      logger.info('Sending email', { msg }); // Log email details
      await sendGridMail.send(msg); // Send the email using SendGrid
      logger.info('Email sent successfully', { recipientEmail }); // Log success
      res.status(200).send("Email sent successfully."); // Send success response
    } catch (error) {
      logger.error("Error sending email:", error); // Log SendGrid error
      res.status(500).send("Failed to send email."); // Send failure response
    }
  });

