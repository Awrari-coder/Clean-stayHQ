// Notifications Service - Uses Replit's Twilio and Resend integrations
import twilio from 'twilio';
import { Resend } from 'resend';
import { db } from "../db";
import { cleanerJobs, bookings, properties, users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Twilio credentials helper (from Replit integration)
async function getTwilioCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!hostname || !xReplitToken) {
    return null;
  }

  try {
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );
    const data = await response.json();
    const connectionSettings = data.items?.[0];

    if (!connectionSettings?.settings?.account_sid || !connectionSettings?.settings?.api_key || !connectionSettings?.settings?.api_key_secret) {
      return null;
    }

    return {
      accountSid: connectionSettings.settings.account_sid,
      apiKey: connectionSettings.settings.api_key,
      apiKeySecret: connectionSettings.settings.api_key_secret,
      phoneNumber: connectionSettings.settings.phone_number
    };
  } catch (error) {
    console.log("[Notifications] Twilio credentials not available");
    return null;
  }
}

// Resend credentials helper (from Replit integration)
async function getResendCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!hostname || !xReplitToken) {
    return null;
  }

  try {
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );
    const data = await response.json();
    const connectionSettings = data.items?.[0];

    if (!connectionSettings?.settings?.api_key) {
      return null;
    }

    return {
      apiKey: connectionSettings.settings.api_key,
      fromEmail: connectionSettings.settings.from_email || 'notifications@cleanstay.app'
    };
  } catch (error) {
    console.log("[Notifications] Resend credentials not available");
    return null;
  }
}

// Send SMS via Twilio
export async function sendSms(to: string, message: string): Promise<boolean> {
  try {
    const creds = await getTwilioCredentials();
    if (!creds) {
      console.log("[Notifications] Twilio not configured, skipping SMS");
      return false;
    }

    const client = twilio(creds.apiKey, creds.apiKeySecret, {
      accountSid: creds.accountSid
    });

    await client.messages.create({
      body: message,
      from: creds.phoneNumber,
      to: to
    });

    console.log(`[Notifications] SMS sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[Notifications] SMS failed:", error);
    return false;
  }
}

// Send Email via Resend
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const creds = await getResendCredentials();
    if (!creds) {
      console.log("[Notifications] Resend not configured, skipping email");
      return false;
    }

    const resend = new Resend(creds.apiKey);

    await resend.emails.send({
      from: creds.fromEmail,
      to: to,
      subject: subject,
      html: html
    });

    console.log(`[Notifications] Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("[Notifications] Email failed:", error);
    return false;
  }
}

// Notify cleaner when a new job is assigned
export async function notifyNewJobAssigned(jobId: number): Promise<void> {
  try {
    // Fetch job with related data
    const [job] = await db.select()
      .from(cleanerJobs)
      .where(eq(cleanerJobs.id, jobId));

    if (!job || !job.assignedCleanerId) {
      console.log("[Notifications] Job or cleaner not found");
      return;
    }

    const [cleaner] = await db.select().from(users).where(eq(users.id, job.assignedCleanerId));
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, job.bookingId));
    const [property] = booking ? await db.select().from(properties).where(eq(properties.id, booking.propertyId)) : [null];

    if (!cleaner || !property) {
      console.log("[Notifications] Missing cleaner or property data");
      return;
    }

    const scheduledDate = new Date(job.scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    // Send SMS
    if (cleaner.phone) {
      await sendSms(
        cleaner.phone,
        `CleanStay: New cleaning job at ${property.name} on ${scheduledDate}. Payout: $${job.payoutAmount}`
      );
    }

    // Send Email
    if (cleaner.email) {
      await sendEmail(
        cleaner.email,
        `New Cleaning Job Assigned - ${property.name}`,
        `
        <h2>New Cleaning Job</h2>
        <p>Hi ${cleaner.name},</p>
        <p>You've been assigned a new cleaning job:</p>
        <ul>
          <li><strong>Property:</strong> ${property.name}</li>
          <li><strong>Address:</strong> ${property.address}, ${property.city}, ${property.state}</li>
          <li><strong>Scheduled:</strong> ${scheduledDate}</li>
          <li><strong>Payout:</strong> $${job.payoutAmount}</li>
        </ul>
        <p>Log in to CleanStay to view details and accept the job.</p>
        <p>Best,<br>CleanStay Team</p>
        `
      );
    }
  } catch (error) {
    console.error("[Notifications] Failed to notify job assigned:", error);
  }
}

// Notify host when a job is completed
export async function notifyJobCompleted(jobId: number): Promise<void> {
  try {
    // Fetch job with related data
    const [job] = await db.select()
      .from(cleanerJobs)
      .where(eq(cleanerJobs.id, jobId));

    if (!job) {
      console.log("[Notifications] Job not found");
      return;
    }

    const [cleaner] = job.assignedCleanerId 
      ? await db.select().from(users).where(eq(users.id, job.assignedCleanerId))
      : [null];
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, job.bookingId));
    const [property] = booking 
      ? await db.select().from(properties).where(eq(properties.id, booking.propertyId)) 
      : [null];
    const [host] = property 
      ? await db.select().from(users).where(eq(users.id, property.hostId)) 
      : [null];

    if (!property || !host) {
      console.log("[Notifications] Missing property or host data");
      return;
    }

    const cleanerName = cleaner?.name || "Your cleaner";

    // Notify host via SMS
    if (host.phone) {
      await sendSms(
        host.phone,
        `CleanStay: Cleaning completed for ${property.name} by ${cleanerName}.`
      );
    }

    // Notify host via Email
    if (host.email) {
      await sendEmail(
        host.email,
        `Cleaning Completed - ${property.name}`,
        `
        <h2>Cleaning Completed</h2>
        <p>Hi ${host.name},</p>
        <p>Great news! The cleaning has been completed for your property:</p>
        <ul>
          <li><strong>Property:</strong> ${property.name}</li>
          <li><strong>Cleaner:</strong> ${cleanerName}</li>
          <li><strong>Completed:</strong> ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}</li>
          ${job.notes ? `<li><strong>Notes:</strong> ${job.notes}</li>` : ''}
        </ul>
        <p>Log in to CleanStay to view details.</p>
        <p>Best,<br>CleanStay Team</p>
        `
      );
    }
  } catch (error) {
    console.error("[Notifications] Failed to notify job completed:", error);
  }
}
