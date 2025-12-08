import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, requireRole, AuthRequest } from "../auth";
import { syncHostProperties } from "../services/icalService";
import { assignCleanersToBookings } from "../services/schedulerService";

const router = Router();

// All host routes require authentication and host role
router.use(authMiddleware);
router.use(requireRole("host"));

// GET /api/host/properties - Get all properties for this host
router.get("/properties", async (req: AuthRequest, res) => {
  try {
    const properties = await storage.getPropertiesByHost(req.user!.id);
    res.json(properties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// POST /api/host/properties/:id/ical - Save iCal URL for a property
router.post("/properties/:id/ical", async (req: AuthRequest, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { icalUrl } = req.body;

    if (!icalUrl) {
      return res.status(400).json({ error: "iCal URL is required" });
    }

    // Verify the property belongs to this host
    const property = await storage.getProperty(propertyId);
    if (!property || property.hostId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have access to this property" });
    }

    // Update the property with the iCal URL
    const updated = await storage.updatePropertyIcalUrl(propertyId, icalUrl);
    res.json({ success: true, property: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save iCal URL" });
  }
});

// GET /api/host/bookings - Get all bookings for this host's properties
router.get("/bookings", async (req: AuthRequest, res) => {
  try {
    const bookings = await storage.getBookingsForHost(req.user!.id);
    
    // Transform to frontend contract format
    const formatted = bookings.map(b => ({
      id: b.id,
      guest_name: b.guestName,
      property_name: b.propertyName || `Property #${b.propertyId}`,
      property_id: b.propertyId,
      check_in: b.checkIn,
      check_out: b.checkOut,
      status: b.status,
      cleaning_status: b.cleaningStatus,
      amount: parseFloat(b.amount),
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// GET /api/host/payments - Get payments for this host
router.get("/payments", async (req: AuthRequest, res) => {
  try {
    const payments = await storage.getPaymentsByUser(req.user!.id);
    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// GET /api/host/stats - Get dashboard stats for this host
router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const stats = await storage.getHostStats(req.user!.id);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// POST /api/host/sync - Trigger iCal sync for all host properties
router.post("/sync", async (req: AuthRequest, res) => {
  try {
    const result = await syncHostProperties(req.user!.id);
    
    // Auto-assign cleaners to any new pending bookings
    const assignedCount = await assignCleanersToBookings();
    
    await storage.createSyncLog({
      source: "airbnb_ical",
      status: "success",
      message: `Manual sync by host ${req.user!.id}: ${result.synced} synced, ${result.failed} failed, ${assignedCount} jobs assigned`,
    });
    res.json({ 
      ok: true, 
      message: "Sync completed", 
      synced: result.synced,
      failed: result.failed,
      jobsAssigned: assignedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sync failed" });
  }
});

export default router;
