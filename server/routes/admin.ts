import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, requireRole, AuthRequest } from "../auth";
import { getIntegrationStatus } from "../services/airbnbService";

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole("admin"));

// GET /api/admin/users - Get all users
router.get("/users", async (req: AuthRequest, res) => {
  try {
    const users = await storage.getAllUsers();
    // Don't expose password hashes
    const sanitized = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      avatar: u.avatar,
      companyId: u.companyId,
      createdAt: u.createdAt,
    }));
    res.json(sanitized);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/admin/bookings - Get all bookings with property and host info
router.get("/bookings", async (req: AuthRequest, res) => {
  try {
    const bookings = await storage.getAllBookingsWithDetails();
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// GET /api/admin/jobs - Get all cleaner jobs with details
router.get("/jobs", async (req: AuthRequest, res) => {
  try {
    const jobs = await storage.getAllJobsWithDetails();
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// GET /api/admin/integrations - Get integration status
router.get("/integrations", async (req: AuthRequest, res) => {
  try {
    const status = await getIntegrationStatus();
    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch integration status" });
  }
});

// GET /api/admin/stats - Get admin dashboard stats
router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const users = await storage.getAllUsers();
    const jobs = await storage.getAllJobs();
    
    const stats = {
      totalUsers: users.length,
      hostCount: users.filter(u => u.role === "host").length,
      cleanerCount: users.filter(u => u.role === "cleaner").length,
      adminCount: users.filter(u => u.role === "admin").length,
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status !== "completed").length,
      completedJobs: jobs.filter(j => j.status === "completed").length,
    };
    
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;
