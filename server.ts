import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection, getDocs, getDoc, setDoc, query, where } from 'firebase/firestore';

const PORT = 3000;

// Read firebase configuration from file
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8')
);

// Initialize Firebase App for the server
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// 4-Hour Live Reminder Automated Check function
async function checkAndTrigger4HourNotifications() {
  try {
    const coursesRef = collection(db, 'courses');
    let coursesSnap;
    try {
      coursesSnap = await getDocs(coursesRef);
    } catch (err: any) {
      console.error("[SERVER SERVICE] Error fetching courses collection:", err);
      throw new Error("fetching courses: " + err.message);
    }
    
    for (const courseDoc of coursesSnap.docs) {
      const courseId = courseDoc.id;
      const courseData = courseDoc.data();
      const courseTitle = courseData.title || "Selected Course";

      // Fetch the live state document
      const liveStateRef = doc(db, 'courses', courseId, 'live_state', 'state');
      let liveStateSnap;
      try {
        liveStateSnap = await getDoc(liveStateRef);
      } catch (err: any) {
        console.error(`[SERVER SERVICE] Error fetching live_state for course ${courseId}:`, err);
        throw new Error(`fetching live_state for course ${courseId}: ` + err.message);
      }

      if (!liveStateSnap.exists()) continue;

      const liveState = liveStateSnap.data();

      // Check if scheduled, scheduledTime is set, and 4h trigger was not yet sent
      if (
        liveState.status === 'scheduled' && 
        liveState.scheduledTime && 
        liveState.notified_4h !== true
      ) {
        const scheduledTimeStr = liveState.scheduledTime; // format: "2026-06-22T14:45"
        const scheduledDate = new Date(scheduledTimeStr);
        const now = new Date();
        
        const timeDiffMs = scheduledDate.getTime() - now.getTime();
        const fourHoursInMs = 4 * 60 * 60 * 1000;
        
        // If time is within the 4 hour window (e.g. <= 4 hours, and up to 30 mins in the past for robust delivery)
        if (timeDiffMs <= fourHoursInMs && timeDiffMs >= -1800000) {
          const hoursLeftFormatted = (timeDiffMs / (60 * 60 * 1000)).toFixed(2);
          console.log(`[SERVER SERVICE] ALERT: Course "${courseTitle}" starts in ${hoursLeftFormatted} hours. Triggering alerts!`);
          
          // Mark as notified in DB immediately to prevent duplicate runs
          try {
            await setDoc(liveStateRef, { notified_4h: true }, { merge: true });
            console.log(`[SERVER SERVICE] Marked Course "${courseTitle}" as notified_4h.`);
          } catch (err: any) {
            console.error(`[SERVER SERVICE] Error updating live_state notified_4h for course ${courseId}:`, err);
            throw new Error(`updating live_state notified_4h for course ${courseId}: ` + err.message);
          }

          // Fetch all approved students enrolled in this course
          const enrollRef = collection(db, 'enrollments');
          const enrollQuery = query(
            enrollRef,
            where('courseId', '==', courseId),
            where('status', '==', 'approved')
          );
          let enrollSnap;
          try {
            enrollSnap = await getDocs(enrollQuery);
            console.log(`[SERVER SERVICE] Course "${courseTitle}" has ${enrollSnap.size} approved subscribers.`);
          } catch (err: any) {
            console.error(`[SERVER SERVICE] Error fetching enrollments for course ${courseId}:`, err);
            throw new Error(`fetching enrollments for course ${courseId}: ` + err.message);
          }

          for (const enrollDoc of enrollSnap.docs) {
            const enroll = enrollDoc.data();
            const userId = enroll.userId;
            const userEmail = enroll.userEmail || '';
            const userName = enroll.userName || 'Student';

            // 1. Write the Dashboard Notification document for real-time client consumption
            const notificationId = `notif_${Date.now()}_${userId.substring(0, 5)}`;
            const notificationRef = doc(db, 'notifications', notificationId);
            try {
              await setDoc(notificationRef, {
                id: notificationId,
                userId: userId,
                courseId: courseId,
                courseTitle: courseTitle,
                title: `Live Masterclass Starting in 4 Hours!`,
                message: `Hi ${userName}, get ready! The live session "${liveState.scheduledTitle || 'Special Mentorship Masterclass'}" for your enrolled course "${courseTitle}" starts in 4 hours (at ${scheduledTimeStr.replace('T', ' ')}). See you inside the classroom!`,
                type: 'live_reminder',
                isRead: false,
                createdAt: new Date().toISOString()
              });
            } catch (err: any) {
              console.error(`[SERVER SERVICE] Error creating notifications for user ${userId}:`, err);
              throw new Error(`creating notifications for user ${userId}: ` + err.message);
            }

            // 2. Perform a beautiful formatted console dispatch simulation for Mail Service
            console.log(`
[MAIL SERVICE] ========================================
[MAIL SERVICE] TRIGGER: 4-Hour Prior Automated Event Notification
[MAIL SERVICE] User Identifier: ${userId}
[MAIL SERVICE] Enrolled Student Email: ${userEmail}
[MAIL SERVICE] Recipient Student Name: ${userName}
[MAIL SERVICE] Subject: Live Classroom Alert: 4 Hours until "${liveState.scheduledTitle || 'Live Masterclass'}"
[MAIL SERVICE] Message Body:
[MAIL SERVICE]   Dear ${userName},
[MAIL SERVICE]   
[MAIL SERVICE]   This is an automated notification reminder that your registered course "${courseTitle}"
[MAIL SERVICE]   is going live in exactly 4 hours!
[MAIL SERVICE]   
[MAIL SERVICE]   Lecture Theme: ${liveState.scheduledTitle || 'Mentorship session'}
[MAIL SERVICE]   Scheduled Start Time: ${scheduledTimeStr.replace('T', ' ')} (UTC/Local)
[MAIL SERVICE]   
[MAIL SERVICE]   Kindly verify your hardware configurations, check your internet connectivity,
[MAIL SERVICE]   and click the direct participation link below when the session starts:
[MAIL SERVICE]   https://ais-dev-l6n2f3fprughctutclud2q-678510107779.asia-southeast1.run.app/live/${courseId}
[MAIL SERVICE]   
[MAIL SERVICE]   See you in class!
[MAIL SERVICE]   
[MAIL SERVICE]   Cordially,
[MAIL SERVICE]   Stricth Toppers Mentorship Team
[MAIL SERVICE] ========================================
            `);

            // 3. Write an email trace audit log in Firestore
            const emailLogId = `email_${Date.now()}_${userId.substring(0, 5)}`;
            const emailLogRef = doc(db, 'email_logs', emailLogId);
            try {
              await setDoc(emailLogRef, {
                id: emailLogId,
                recipientEmail: userEmail,
                recipientName: userName,
                userId: userId,
                courseId: courseId,
                subject: `Live Classroom Alert: 4 Hours until "${liveState.scheduledTitle || 'Live Masterclass'}"`,
                body: `Dear ${userName}, your class is going live in 4 hours! Topic: ${liveState.scheduledTitle}`,
                sentAt: new Date().toISOString()
              });
            } catch (err: any) {
              console.error(`[SERVER SERVICE] Error logging email for user ${userId}:`, err);
              throw new Error(`logging email for user ${userId}: ` + err.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("[SERVER SERVICE] Error checking 4-hour live reminder configurations:", error);
    throw error;
  }
}

async function startServer() {
  const app = express();

  // Parse application JSON
  app.use(express.json());

  // Server API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Stricth Toppers Notification Server" });
  });

  // Explicit API trigger endpoint for test and instant validation of the 4-hour notification cron process
  app.post("/api/admin/trigger-live-check", async (req, res) => {
    try {
      await checkAndTrigger4HourNotifications();
      res.json({ success: true, message: "Server-side check executed successfully. See standard logs." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.stack || err.message || err });
    }
  });

  // Start backround scheduler loop processing every 30 seconds for real-time reaction
  console.log("[SERVER SERVICE] Booking automated background check interval loop (every 30 seconds)...");
  setInterval(async () => {
    try {
      await checkAndTrigger4HourNotifications();
    } catch (err) {
      // Background loop logs and swallows to stay safe
      console.error("[SERVER SERVICE] Background scheduler execution failed:", err);
    }
  }, 30000);

  // Mount Vite development middleware or serve compiled client build
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER SERVICE] Mounting Vite development middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER SERVICE] Serving production static files...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started. Running on http://localhost:${PORT}`);
  });
}

startServer();
