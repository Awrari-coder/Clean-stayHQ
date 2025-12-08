import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, requireRole, AuthRequest } from "../auth";
import { getIntegrationStatus } from "../services/airbnbService";
import { getAllPayoutsWithDetails, markPayoutPaid } from "../services/paymentsService";

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

// GET /api/admin/analytics - Get comprehensive analytics data
router.get("/analytics", async (req: AuthRequest, res) => {
  try {
    const users = await storage.getAllUsers();
    const jobs = await storage.getAllJobs();
    const bookings = await storage.getAllBookingsWithDetails();
    const payouts = await getAllPayoutsWithDetails();
    
    const cleaners = users.filter(u => u.role === "cleaner" || u.role === "cleaning_company");
    
    // Cleaner performance metrics
    const cleanerPerformance = cleaners.map(cleaner => {
      const cleanerJobs = jobs.filter(j => j.assignedCleanerId === cleaner.id);
      const completedJobs = cleanerJobs.filter(j => j.status === "completed");
      const totalEarnings = completedJobs.reduce((sum, j) => sum + parseFloat(j.payoutAmount || "0"), 0);
      const avgJobValue = completedJobs.length > 0 ? totalEarnings / completedJobs.length : 0;
      
      return {
        id: cleaner.id,
        name: cleaner.name,
        email: cleaner.email,
        totalJobs: cleanerJobs.length,
        completedJobs: completedJobs.length,
        pendingJobs: cleanerJobs.filter(j => j.status !== "completed").length,
        completionRate: cleanerJobs.length > 0 ? Math.round((completedJobs.length / cleanerJobs.length) * 100) : 0,
        totalEarnings: totalEarnings.toFixed(2),
        avgJobValue: avgJobValue.toFixed(2),
        performanceScore: calculatePerformanceScore(completedJobs.length, cleanerJobs.length),
      };
    }).sort((a, b) => b.performanceScore - a.performanceScore);
    
    // Revenue analytics
    const totalBookingRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.amount || "0"), 0);
    const totalCleaningCosts = jobs
      .filter(j => j.status === "completed")
      .reduce((sum, j) => sum + parseFloat(j.payoutAmount || "0"), 0);
    const grossProfit = totalBookingRevenue - totalCleaningCosts;
    const profitMargin = totalBookingRevenue > 0 ? (grossProfit / totalBookingRevenue) * 100 : 0;
    
    // Job profit analysis
    const jobProfitAnalysis = jobs
      .filter(j => j.status === "completed")
      .map(job => {
        const booking = bookings.find(b => b.id === job.bookingId);
        const bookingAmount = parseFloat(booking?.amount || "0");
        const cleaningCost = parseFloat(job.payoutAmount || "0");
        const profit = bookingAmount - cleaningCost;
        const margin = bookingAmount > 0 ? (profit / bookingAmount) * 100 : 0;
        
        return {
          jobId: job.id,
          propertyName: booking?.property_name || "Unknown",
          bookingRevenue: bookingAmount.toFixed(2),
          cleaningCost: cleaningCost.toFixed(2),
          profit: profit.toFixed(2),
          margin: margin.toFixed(1),
        };
      });
    
    // Monthly revenue trend (last 6 months)
    const now = new Date();
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });
      
      const monthBookings = bookings.filter(b => {
        const checkIn = new Date(b.check_in);
        return checkIn >= monthStart && checkIn <= monthEnd;
      });
      
      const revenue = monthBookings.reduce((sum, b) => sum + parseFloat(b.amount || "0"), 0);
      monthlyRevenue.push({ month: monthName, revenue: revenue.toFixed(2) });
    }
    
    res.json({
      cleanerPerformance,
      revenueAnalytics: {
        totalBookingRevenue: totalBookingRevenue.toFixed(2),
        totalCleaningCosts: totalCleaningCosts.toFixed(2),
        grossProfit: grossProfit.toFixed(2),
        profitMargin: profitMargin.toFixed(1),
        avgRevenuePerBooking: bookings.length > 0 ? (totalBookingRevenue / bookings.length).toFixed(2) : "0.00",
        avgCleaningCost: jobs.filter(j => j.status === "completed").length > 0 
          ? (totalCleaningCosts / jobs.filter(j => j.status === "completed").length).toFixed(2) 
          : "0.00",
      },
      jobProfitAnalysis: jobProfitAnalysis.slice(0, 10),
      monthlyRevenue,
      pendingPayouts: payouts.filter(p => p.status === "pending").length,
      totalPayoutsPending: payouts
        .filter(p => p.status === "pending")
        .reduce((sum, p) => sum + parseFloat(p.amount), 0)
        .toFixed(2),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

function calculatePerformanceScore(completed: number, total: number): number {
  if (total === 0) return 0;
  const completionRate = completed / total;
  const volumeBonus = Math.min(completed / 10, 1);
  return Math.round((completionRate * 70) + (volumeBonus * 30));
}

// GET /api/admin/payouts - Get all payouts with details
router.get("/payouts", async (req: AuthRequest, res) => {
  try {
    const payouts = await getAllPayoutsWithDetails();
    res.json(payouts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch payouts" });
  }
});

// POST /api/admin/payouts/:id/mark-paid - Mark a payout as paid
router.post("/payouts/:id/mark-paid", async (req: AuthRequest, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    const adminId = req.user!.id;
    const adminEmail = req.user!.email;
    
    const success = await markPayoutPaid(paymentId, adminId, adminEmail);
    
    if (success) {
      res.json({ success: true, message: "Payout marked as paid" });
    } else {
      res.status(404).json({ error: "Payout not found or already paid" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark payout as paid" });
  }
});

export default router;
