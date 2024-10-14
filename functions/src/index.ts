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

// --------------------- v1 function (email sending) -------------------------
export const sendEmail = functions
  .region('europe-west1')  // Set region to Europe for v1
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req: Request, res: Response) => {
    try {
      const msg = {
        to: req.query.to as string,
        from: "Arguslocks@gmail.com", // Sender's email
        subject: "Verification Email",
        text: "Please verify your email.",
        html: "<strong>Please verify your email.</strong>",
      };

      // Send the email using SendGrid
      await sendGridMail.send(msg);
      res.status(200).send("Email sent successfully.");
    } catch (error) {
      logger.error("Error sending email:", error);
      res.status(500).send("Failed to send email.");
    }
  });

// --------------------- v2 function (future functionality) ------------------
export const futureFunction = functions
  .region('us-central1') // Set region to US for v2
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (req: Request, res: Response) => {
    try {
      // Your future v2 function logic
      res.status(200).send("Future function executed successfully.");
    } catch (error) {
      logger.error("Error in future function:", error);
      res.status(500).send("Failed to execute future function.");
    }
  });
