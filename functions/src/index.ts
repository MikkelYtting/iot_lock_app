import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import sendGridMail from "@sendgrid/mail";
import * as logger from "firebase-functions/logger";
import { Request, Response } from "express";

// Initialize Firebase Admin
admin.initializeApp();

// Use the SendGrid key from the Firebase config
const SENDGRID_API_KEY = functions.config().sendgrid.key;

// Ensure the API key exists and is non-empty
if (!SENDGRID_API_KEY) {
  logger.error("SendGrid API key is missing in Firebase config.");
} else {
  sendGridMail.setApiKey(SENDGRID_API_KEY);
}

// Define a custom error type for SendGrid errors
interface SendGridError extends Error {
  code?: string;
  response?: {
    body: any;
  };
}

// --------------------- v1 function (email sending with PIN generation) -------------------------
export const sendEmail = functions
  .region('europe-west1')
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req: Request, res: Response) => {
    logger.info('Received request to send email', { query: req.query });

    // Validate query parameters
    const recipientEmail = req.query.to as string;
    if (!recipientEmail) {
      logger.error('Missing recipient email');
      res.status(400).send('Missing recipient email.');
      return;
    }

    // Generate a 5-digit PIN
    const pin = Math.floor(10000 + Math.random() * 90000).toString();
    logger.info(`Generated PIN: ${pin}`, { recipientEmail });

    // Store the PIN in Firestore with a timestamp
    const userDocRef = admin.firestore().collection('pins').doc(recipientEmail);
    const createdAt = admin.firestore.FieldValue.serverTimestamp();
    try {
      await userDocRef.set({
        pin,
        createdAt,
        requestCount: admin.firestore.FieldValue.increment(1), // Increment request count
      });
      logger.info(`Stored PIN for ${recipientEmail} in Firestore`);
    } catch (firestoreError) {
      logger.error("Error storing PIN in Firestore:", firestoreError);
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

    // Log the message object to inspect its content
    logger.info('Prepared message object for SendGrid:', { msg });

    try {
      // Send the email using SendGrid and log the response
      const response = await sendGridMail.send(msg);
      logger.info('SendGrid response:', { response });
      logger.info('Email sent successfully using template', { recipientEmail });
      res.status(200).send("Email sent successfully.");
    } catch (error) {
      // Cast the error as SendGridError to access its properties
      const err = error as SendGridError;
      logger.error("Error sending email with template:", {
        message: err.message,
        code: err.code,
        response: err.response ? err.response.body : 'No response body',
      });
      res.status(500).send("Failed to send email with template.");
    }
  });
