import type { Express } from "express";
import { createServer, type Server } from "http";
import cors from "cors";

import authRoutes from "./routes/auth";
import hostRoutes from "./routes/host";
import cleanerRoutes from "./routes/cleaner";
import adminRoutes from "./routes/admin";
import activityRoutes from "./routes/activity";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Enable CORS for frontend
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  
  // Mount route modules
  app.use("/api/auth", authRoutes);
  app.use("/api/host", hostRoutes);
  app.use("/api/cleaner", cleanerRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/activity", activityRoutes);
  
  // ===== PUBLIC ROUTES (for backward compatibility) =====
  
  // GET /api/users - Public user list (for login dropdown, etc)
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const sanitized = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
      }));
      res.json(sanitized);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  // GET /api/bookings - Get all bookings (for legacy support)
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookingsWithDetails();
      res.json(bookings);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });
  
  // GET /api/jobs - Get all jobs (for legacy support)
  app.get("/api/jobs", async (req, res) => {
    try {
      const cleanerId = req.query.cleanerId;
      if (cleanerId) {
        const jobs = await storage.getJobsByCleaner(parseInt(cleanerId as string));
        return res.json(jobs);
      }
      const jobs = await storage.getAllJobsWithDetails();
      res.json(jobs);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });
  
  // PATCH /api/jobs/:id/complete - Complete a job (legacy)
  app.patch("/api/jobs/:id/complete", async (req, res) => {
    try {
      const job = await storage.completeJob(parseInt(req.params.id));
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      if (job.assignedCleanerId) {
        await storage.createPayment({
          userId: job.assignedCleanerId,
          jobId: job.id,
          type: "payout",
          amount: job.payoutAmount,
          status: "completed",
          description: `Job #${job.id} completed`,
        });
      }
      
      res.json(job);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to complete job" });
    }
  });
  
  // Legacy stats endpoints
  app.get("/api/stats/host/:hostId", async (req, res) => {
    try {
      const stats = await storage.getHostStats(parseInt(req.params.hostId));
      res.json(stats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  
  app.get("/api/stats/cleaner/:cleanerId", async (req, res) => {
    try {
      const stats = await storage.getCleanerStats(parseInt(req.params.cleanerId));
      res.json(stats);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  
  // Sync endpoint (legacy)
  app.post("/api/sync", async (req, res) => {
    try {
      const log = await storage.createSyncLog(req.body);
      res.status(201).json(log);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create sync log" });
    }
  });

  return httpServer;
}
