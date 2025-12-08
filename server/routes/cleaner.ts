import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, requireRole, AuthRequest } from "../auth";
import type { CleanerJob } from "@shared/schema";
import { createPayoutForJob, getCleanerPayoutSummary } from "../services/paymentsService";
import { notifyJobCompleted } from "../services/notificationsService";

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

export default router;
