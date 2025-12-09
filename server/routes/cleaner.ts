import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, requireRole, AuthRequest } from "../auth";
import type { CleanerJob } from "@shared/schema";
import { createPayoutForJob, getCleanerPayoutSummary } from "../services/paymentsService";
import { notifyJobCompleted } from "../services/notificationsService";
import { logActivity, emitJobCompleted, emitPayoutCreated } from "../services/activityService";

const router = Router();

// All cleaner routes require authentication and cleaner or cleaning_company role
router.use(authMiddleware);
router.use(requireRole("cleaner", "cleaning_company"));

// GET /api/cleaner/jobs - Get jobs for this cleaner or their company
router.get("/jobs", async (req: AuthRequest, res) => {
  try {
    type JobWithDetails = CleanerJob & { propertyName?: string; address?: string };
    let jobs: JobWithDetails[];
    
    if (req.user!.role === "cleaner") {
      jobs = await storage.getJobsByCleaner(req.user!.id);
    } else if (req.user!.role === "cleaning_company") {
      jobs = await storage.getJobsByCompany(req.user!.companyId || req.user!.id);
    } else {
      jobs = [];
    }
    
    // Transform to frontend contract format
    const formatted = jobs.map(j => ({
      id: j.id,
      booking_id: j.bookingId,
      property_name: j.propertyName || `Booking #${j.bookingId}`,
      address: j.address || "Austin, TX",
      scheduled_date: j.scheduledDate,
      status: j.status,
      payout_amount: parseFloat(j.payoutAmount),
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// POST /api/cleaner/jobs/:id/accept - Accept a job
router.post("/jobs/:id/accept", async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const job = await storage.getCleanerJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    // Verify ownership
    const isOwner = 
      (req.user!.role === "cleaner" && job.assignedCleanerId === req.user!.id) ||
      (req.user!.role === "cleaning_company" && job.assignedCompanyId === (req.user!.companyId || req.user!.id));
    
    if (!isOwner) {
      return res.status(403).json({ error: "You don't have permission to accept this job" });
    }
    
    const updatedJob = await storage.updateJobStatus(jobId, "accepted");
    res.json({ ok: true, job: updatedJob });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to accept job" });
  }
});

// POST /api/cleaner/jobs/:id/complete - Complete a job and trigger payout
router.post("/jobs/:id/complete", async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { notes } = req.body;
    const job = await storage.getCleanerJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    // Verify ownership
    const isOwner = 
      (req.user!.role === "cleaner" && job.assignedCleanerId === req.user!.id) ||
      (req.user!.role === "cleaning_company" && job.assignedCompanyId === (req.user!.companyId || req.user!.id));
    
    if (!isOwner) {
      return res.status(403).json({ error: "You don't have permission to complete this job" });
    }
    
    // Complete the job with notes
    const completedJob = await storage.completeJobWithNotes(jobId, notes);
    
    // Update related booking status
    await storage.updateBookingStatus(job.bookingId, "completed", "completed");
    
    // Create payout (pending status for admin approval)
    await createPayoutForJob(jobId, req.user!.id);
    
    // Send notifications to host
    notifyJobCompleted(jobId).catch(err => console.error("[Notifications] Error:", err));
    
    // Get property info for activity message
    const booking = await storage.getBooking(job.bookingId);
    const property = booking ? await storage.getProperty(booking.propertyId) : null;
    
    // Log activity and emit WebSocket events
    logActivity({
      userId: req.user!.id,
      targetUserId: property?.hostId,
      roleScope: "host",
      type: "job.completed",
      message: `Cleaning completed at ${property?.name || 'property'}`,
      metadata: { jobId, bookingId: job.bookingId },
    });
    
    emitJobCompleted(jobId, req.user!.id, property?.hostId || 0);
    
    logActivity({
      userId: req.user!.id,
      targetUserId: req.user!.id,
      roleScope: "cleaner",
      type: "payout.created",
      message: `Payout of $${job.payoutAmount} is pending`,
      metadata: { jobId, amount: job.payoutAmount },
    });
    emitPayoutCreated(jobId, req.user!.id, job.payoutAmount);
    
    res.json({ success: true, job: completedJob });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to complete job" });
  }
});

// GET /api/cleaner/payouts - Get payment history with summary for this cleaner
router.get("/payouts", async (req: AuthRequest, res) => {
  try {
    const summary = await getCleanerPayoutSummary(req.user!.id);
    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch payouts" });
  }
});

// GET /api/cleaner/stats - Get dashboard stats for this cleaner
router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const stats = await storage.getCleanerStats(req.user!.id);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// POST /api/cleaner/jobs/:id/photos - Upload photo for a job
router.post("/jobs/:id/photos", async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { type, url, caption } = req.body;
    
    if (!type || !url) {
      return res.status(400).json({ error: "Photo type and URL are required" });
    }
    
    if (!['before', 'after'].includes(type)) {
      return res.status(400).json({ error: "Photo type must be 'before' or 'after'" });
    }
    
    const job = await storage.getCleanerJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    const isOwner = 
      (req.user!.role === "cleaner" && job.assignedCleanerId === req.user!.id) ||
      (req.user!.role === "cleaning_company" && job.assignedCompanyId === (req.user!.companyId || req.user!.id));
    
    if (!isOwner) {
      return res.status(403).json({ error: "You don't have permission to upload photos for this job" });
    }
    
    const photo = await storage.addJobPhoto({
      jobId,
      cleanerId: req.user!.id,
      type,
      url,
      caption: caption || null,
    });
    
    res.status(201).json(photo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

// GET /api/cleaner/jobs/:id/photos - Get photos for a job
router.get("/jobs/:id/photos", async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.id);
    
    const job = await storage.getCleanerJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    const isOwner = 
      (req.user!.role === "cleaner" && job.assignedCleanerId === req.user!.id) ||
      (req.user!.role === "cleaning_company" && job.assignedCompanyId === (req.user!.companyId || req.user!.id));
    
    if (!isOwner) {
      return res.status(403).json({ error: "You don't have permission to view photos for this job" });
    }
    
    const photos = await storage.getJobPhotos(jobId);
    res.json(photos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});

// GET /api/cleaner/jobs/:id/checklist - Get checklist for a job's property
router.get("/jobs/:id/checklist", async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const job = await storage.getCleanerJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    const isOwner = 
      (req.user!.role === "cleaner" && job.assignedCleanerId === req.user!.id) ||
      (req.user!.role === "cleaning_company" && job.assignedCompanyId === (req.user!.companyId || req.user!.id));
    
    if (!isOwner) {
      return res.status(403).json({ error: "You don't have permission to view the checklist for this job" });
    }
    
    const checklist = await storage.getChecklistForJob(jobId);
    const completion = await storage.getChecklistCompletion(jobId);
    
    res.json({
      checklist,
      completion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch checklist" });
  }
});

// POST /api/cleaner/jobs/:id/checklist/complete - Save checklist completion
router.post("/jobs/:id/checklist/complete", async (req: AuthRequest, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { checklistId, completedItems } = req.body;
    
    const job = await storage.getCleanerJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    const isOwner = 
      (req.user!.role === "cleaner" && job.assignedCleanerId === req.user!.id) ||
      (req.user!.role === "cleaning_company" && job.assignedCompanyId === (req.user!.companyId || req.user!.id));
    
    if (!isOwner) {
      return res.status(403).json({ error: "You don't have permission to complete this checklist" });
    }
    
    const completion = await storage.saveChecklistCompletion({
      jobId,
      checklistId,
      completedItems,
    });
    
    res.json(completion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save checklist completion" });
  }
});

// GET /api/cleaner/earnings-projection - Get earnings projection
router.get("/earnings-projection", async (req: AuthRequest, res) => {
  try {
    const jobs = await storage.getJobsByCleaner(req.user!.id);
    const stats = await storage.getCleanerStats(req.user!.id);
    
    const pendingJobs = jobs.filter(j => j.status !== "completed");
    const projectedEarnings = pendingJobs.reduce((sum, j) => sum + parseFloat(j.payoutAmount || "0"), 0);
    
    const avgJobValue = stats.completedJobs > 0 ? stats.totalEarnings / stats.completedJobs : 0;
    
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const remainingDays = daysInMonth - dayOfMonth;
    
    const avgJobsPerDay = stats.completedJobs > 0 ? stats.completedJobs / dayOfMonth : 0;
    const projectedAdditionalJobs = Math.round(avgJobsPerDay * remainingDays);
    const projectedMonthlyTotal = stats.totalEarnings + (projectedAdditionalJobs * avgJobValue);
    
    res.json({
      currentEarnings: stats.totalEarnings,
      pendingJobsValue: projectedEarnings,
      upcomingJobs: pendingJobs.length,
      avgJobValue: avgJobValue.toFixed(2),
      projectedMonthlyTotal: projectedMonthlyTotal.toFixed(2),
      projectedAdditionalJobs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to calculate earnings projection" });
  }
});

// GET /api/cleaner/availability - Get cleaner's weekly availability
router.get("/availability", async (req: AuthRequest, res) => {
  try {
    const availability = await storage.getCleanerAvailability(req.user!.id);
    res.json(availability);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

// PUT /api/cleaner/availability - Set cleaner's weekly availability
router.put("/availability", async (req: AuthRequest, res) => {
  try {
    const { availability } = req.body;
    
    if (!Array.isArray(availability)) {
      return res.status(400).json({ error: "Availability must be an array" });
    }
    
    // Validate each entry
    for (const entry of availability) {
      if (typeof entry.weekday !== 'number' || entry.weekday < 0 || entry.weekday > 6) {
        return res.status(400).json({ error: "Invalid weekday (must be 0-6)" });
      }
      if (!entry.startTime || !entry.endTime) {
        return res.status(400).json({ error: "startTime and endTime are required" });
      }
    }
    
    const updated = await storage.setCleanerAvailability(req.user!.id, availability);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update availability" });
  }
});

// GET /api/cleaner/timeoff - Get cleaner's time off entries
router.get("/timeoff", async (req: AuthRequest, res) => {
  try {
    const timeOff = await storage.getCleanerTimeOff(req.user!.id);
    res.json(timeOff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch time off" });
  }
});

// POST /api/cleaner/timeoff - Add a time off entry
router.post("/timeoff", async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }
    
    const timeOff = await storage.addCleanerTimeOff({
      cleanerId: req.user!.id,
      startDate,
      endDate,
      reason: reason || null,
    });
    
    res.status(201).json(timeOff);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add time off" });
  }
});

// DELETE /api/cleaner/timeoff/:id - Delete a time off entry
router.delete("/timeoff/:id", async (req: AuthRequest, res) => {
  try {
    const timeOffId = parseInt(req.params.id);
    const success = await storage.deleteCleanerTimeOff(timeOffId, req.user!.id);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Time off entry not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete time off" });
  }
});

export default router;
