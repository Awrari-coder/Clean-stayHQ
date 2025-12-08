import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertCleanerJobSchema, insertSyncLogSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Error handler helper
  const handleError = (res: any, error: unknown) => {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  };

  // ===== USERS =====
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== PROPERTIES =====
  app.get("/api/properties", async (req, res) => {
    try {
      const hostId = req.query.hostId;
      if (hostId) {
        const properties = await storage.getPropertiesByHost(parseInt(hostId as string));
        return res.json(properties);
      }
      res.json([]);
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== BOOKINGS =====
  app.get("/api/bookings", async (req, res) => {
    try {
      const propertyId = req.query.propertyId;
      if (propertyId) {
        const bookings = await storage.getBookingsByProperty(parseInt(propertyId as string));
        return res.json(bookings);
      }
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.getBooking(parseInt(req.params.id));
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      res.status(201).json(booking);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const { status, cleaningStatus } = req.body;
      const booking = await storage.updateBookingStatus(
        parseInt(req.params.id),
        status,
        cleaningStatus
      );
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== CLEANER JOBS =====
  app.get("/api/jobs", async (req, res) => {
    try {
      const cleanerId = req.query.cleanerId;
      if (cleanerId) {
        const jobs = await storage.getJobsByCleaner(parseInt(cleanerId as string));
        return res.json(jobs);
      }
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const job = await storage.getCleanerJob(parseInt(req.params.id));
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      const validatedData = insertCleanerJobSchema.parse(req.body);
      const job = await storage.createCleanerJob(validatedData);
      res.status(201).json(job);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/jobs/:id/complete", async (req, res) => {
    try {
      const job = await storage.completeJob(parseInt(req.params.id));
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      // Create payout payment
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
      handleError(res, error);
    }
  });

  app.patch("/api/jobs/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const job = await storage.updateJobStatus(parseInt(req.params.id), status);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      res.json(job);
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== PAYMENTS =====
  app.get("/api/payments/user/:userId", async (req, res) => {
    try {
      const payments = await storage.getPaymentsByUser(parseInt(req.params.userId));
      res.json(payments);
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== SYNC LOGS =====
  app.post("/api/sync", async (req, res) => {
    try {
      const validatedData = insertSyncLogSchema.parse(req.body);
      const log = await storage.createSyncLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/sync/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getRecentSyncLogs(limit);
      res.json(logs);
    } catch (error) {
      handleError(res, error);
    }
  });

  // ===== DASHBOARD STATS =====
  app.get("/api/stats/host/:hostId", async (req, res) => {
    try {
      const hostId = parseInt(req.params.hostId);
      const properties = await storage.getPropertiesByHost(hostId);
      
      // Get all bookings for host's properties
      const allBookings = await storage.getAllBookings();
      const propertyIds = properties.map(p => p.id);
      const hostBookings = allBookings.filter(b => propertyIds.includes(b.propertyId));
      
      const activeBookings = hostBookings.filter(
        b => b.status === 'confirmed' || b.status === 'checked-in'
      );
      
      const completedCleanings = hostBookings.filter(
        b => b.cleaningStatus === 'completed'
      ).length;
      
      const totalRevenue = hostBookings.reduce(
        (acc, curr) => acc + parseFloat(curr.amount),
        0
      );
      
      res.json({
        totalRevenue,
        activeBookings: activeBookings.length,
        completedCleanings,
        totalProperties: properties.length,
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/stats/cleaner/:cleanerId", async (req, res) => {
    try {
      const cleanerId = parseInt(req.params.cleanerId);
      const jobs = await storage.getJobsByCleaner(cleanerId);
      const payments = await storage.getPaymentsByUser(cleanerId);
      
      const totalEarnings = payments
        .filter(p => p.type === 'payout' && p.status === 'completed')
        .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
      
      const pendingJobs = jobs.filter(j => j.status !== 'completed').length;
      const completedJobs = jobs.filter(j => j.status === 'completed').length;
      
      res.json({
        totalEarnings,
        pendingJobs,
        completedJobs,
        totalJobs: jobs.length,
      });
    } catch (error) {
      handleError(res, error);
    }
  });

  return httpServer;
}
