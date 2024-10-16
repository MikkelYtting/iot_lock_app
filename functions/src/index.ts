import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import sendGridMail from "@sendgrid/mail";
import * as logger from "firebase-functions/logger";
import { Request, Response } from "express";

// Initialize Firebase Admin
admin.initializeApp();

// Use the SendGrid key from the Firebase config
const SENDGRID_API_KEY = functions.config().sendgrid.key;

// Properly configure SendGrid
sendGridMail.setApiKey(SENDGRID_API_KEY);

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

    // Send the email with the PIN
    const msg = {
      to: recipientEmail,
      from: "Arguslocks@gmail.com",
      subject: "Your Verification PIN",
      text: `Your verification PIN is: ${pin}. Please use this code to complete your verification.`,
      html: `<p>Your verification PIN is: <strong>${pin}</strong>. Please use this code to complete your verification.</p>`,
    };

    try {
      logger.info('Sending email', { msg });
      await sendGridMail.send(msg);
      logger.info('Email sent successfully', { recipientEmail });
      res.status(200).send("Email sent successfully.");
    } catch (error) {
      logger.error("Error sending email:", error);
      res.status(500).send("Failed to send email.");
    }
  });
