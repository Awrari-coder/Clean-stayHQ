import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, requireRole, AuthRequest } from "../auth";
import { syncHostProperties } from "../services/icalService";
import { assignCleanersToBookings } from "../services/schedulerService";
import { logActivity } from "../services/activityService";

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

// POST /api/host/properties - Create a new property
router.post("/properties", async (req: AuthRequest, res) => {
  try {
    const { name, address, city, state, zip, latitude, longitude, airbnbPropertyId, icalUrl } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ error: "Name and address are required" });
    }
    
    const property = await storage.createProperty({
      hostId: req.user!.id,
      name,
      address,
      city: city || "Austin",
      state: state || "TX",
      zip: zip || "",
      latitude: latitude || null,
      longitude: longitude || null,
      airbnbPropertyId: airbnbPropertyId || null,
      icalUrl: icalUrl || null,
    });
    
    logActivity({
      userId: req.user!.id,
      targetUserId: req.user!.id,
      roleScope: "host",
      type: "property.created",
      message: `Property "${name}" has been added`,
      metadata: { propertyId: property.id },
    });
    
    res.status(201).json(property);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create property" });
  }
});

// PUT /api/host/properties/:id - Update a property
router.put("/properties/:id", async (req: AuthRequest, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    
    // Verify the property belongs to this host
    const property = await storage.getProperty(propertyId);
    if (!property || property.hostId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have access to this property" });
    }
    
    const { name, address, city, state, zip, latitude, longitude, airbnbPropertyId, icalUrl } = req.body;
    
    // Whitelist only editable fields - NEVER allow hostId or createdAt to be modified
    const updateData: {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      zip?: string;
      latitude?: string | null;
      longitude?: string | null;
      airbnbPropertyId?: string | null;
      icalUrl?: string | null;
    } = {};
    
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zip !== undefined) updateData.zip = zip;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (airbnbPropertyId !== undefined) updateData.airbnbPropertyId = airbnbPropertyId;
    if (icalUrl !== undefined) updateData.icalUrl = icalUrl;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    
    const updated = await storage.updateProperty(propertyId, updateData);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update property" });
  }
});

// DELETE /api/host/properties/:id - Delete a property
router.delete("/properties/:id", async (req: AuthRequest, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    
    // Verify the property belongs to this host
    const property = await storage.getProperty(propertyId);
    if (!property || property.hostId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have access to this property" });
    }
    
    // Check if property has bookings
    const hasBookings = await storage.hasBookingsForProperty(propertyId);
    if (hasBookings) {
      return res.status(400).json({ error: "Cannot delete property with existing bookings" });
    }
    
    await storage.deleteProperty(propertyId);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

// POST /api/host/properties/:id/ical - Save iCal URL for a property (legacy)
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

// PUT /api/host/properties/:id/calendar - Update iCal URL for a property
router.put("/properties/:id/calendar", async (req: AuthRequest, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { icalUrl } = req.body;

    // Verify the property belongs to this host
    const property = await storage.getProperty(propertyId);
    if (!property || property.hostId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have access to this property" });
    }

    // Update the property with the iCal URL (also clears sync status)
    const updated = await storage.updatePropertyIcalUrl(propertyId, icalUrl || "");
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save calendar URL" });
  }
});

// POST /api/host/properties/:id/sync - Trigger sync for a specific property
router.post("/properties/:id/sync", async (req: AuthRequest, res) => {
  try {
    const propertyId = parseInt(req.params.id);

    // Verify the property belongs to this host
    const property = await storage.getProperty(propertyId);
    if (!property || property.hostId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have access to this property" });
    }

    if (!property.icalUrl) {
      return res.status(400).json({ error: "No iCal URL configured for this property" });
    }

    // Import the syncProperty function
    const { syncProperty } = await import("../services/icalService");
    await syncProperty(property);

    // Refetch property with updated sync status
    const updatedProperty = await storage.getProperty(propertyId);
    res.json(updatedProperty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sync failed" });
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

// GET /api/host/sync-logs - Get sync logs for this host's properties
router.get("/sync-logs", async (req: AuthRequest, res) => {
  try {
    const properties = await storage.getPropertiesByHost(req.user!.id);
    const propertyIds = properties.map(p => p.id);
    
    const logs = await storage.getSyncLogsByPropertyIds(propertyIds, 20);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch sync logs" });
  }
});

export default router;
