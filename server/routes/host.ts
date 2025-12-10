import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, requireRole, AuthRequest } from "../auth";
import { syncHostProperties } from "../services/icalService";
import { assignCleanersToBookings } from "../services/schedulerService";
import { logActivity } from "../services/activityService";
import { calculateCleaningQuote, calculatePayoutAmount, type QuoteInput } from "../services/quoteService";
import { sendEmail } from "../services/notificationsService";

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
      amount: parseFloat(b.amount as string),
      payment_status: (b as any).paymentStatus || 'pending',
      cleaning_type: (b as any).cleaningType || 'post_checkout',
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// POST /api/host/bookings/quote - Get a quote preview without creating a booking
router.post("/bookings/quote", async (req: AuthRequest, res) => {
  try {
    const { propertyId, squareFeet, bedrooms, bathrooms, hasPets, restockRequested, cleaningType } = req.body;
    
    // Validate required fields
    if (!propertyId || squareFeet === undefined || bedrooms === undefined || bathrooms === undefined) {
      return res.status(400).json({ error: "Property ID, square feet, bedrooms, and bathrooms are required" });
    }
    
    // Verify the property belongs to this host
    const property = await storage.getProperty(propertyId);
    if (!property || property.hostId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have access to this property" });
    }
    
    const quoteInput: QuoteInput = {
      squareFeet: Number(squareFeet),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      hasPets: Boolean(hasPets),
      restockRequested: Boolean(restockRequested),
      cleaningType: cleaningType || 'post_checkout',
    };
    
    const quote = calculateCleaningQuote(quoteInput);
    res.json(quote);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to calculate quote" });
  }
});

// POST /api/host/bookings - Create a new booking (with optional quote-based pricing)
router.post("/bookings", async (req: AuthRequest, res) => {
  try {
    const { 
      propertyId, guestName, checkIn, checkOut, 
      squareFeet, bedrooms, bathrooms, hasPets, restockRequested, cleaningType,
      specialInstructions, hostNotes, autoMarkPaid,
      amount // Legacy field - if provided, use it directly instead of calculating quote
    } = req.body;
    
    if (!propertyId || !checkIn || !checkOut) {
      return res.status(400).json({ error: "Property ID and dates are required" });
    }
    
    // Verify the property belongs to this host
    const property = await storage.getProperty(propertyId);
    if (!property || property.hostId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have access to this property" });
    }
    
    // Calculate quote if size fields provided, otherwise use provided amount
    let quoteAmount: number;
    let quoteBreakdown: any = null;
    
    if (squareFeet !== undefined && bedrooms !== undefined && bathrooms !== undefined) {
      const quoteInput: QuoteInput = {
        squareFeet: Number(squareFeet),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        hasPets: Boolean(hasPets),
        restockRequested: Boolean(restockRequested),
        cleaningType: cleaningType || 'post_checkout',
      };
      const quote = calculateCleaningQuote(quoteInput);
      quoteAmount = quote.total;
      quoteBreakdown = quote.breakdown;
    } else if (amount !== undefined) {
      quoteAmount = Number(amount);
    } else {
      return res.status(400).json({ error: "Either size details or amount is required" });
    }
    
    const paymentStatus = autoMarkPaid ? 'paid' : 'pending';
    
    const booking = await storage.createBooking({
      propertyId,
      guestName: guestName || 'Guest',
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      amount: quoteAmount.toString(),
      specialInstructions: specialInstructions || null,
      hostNotes: hostNotes || null,
      cleaningType: cleaningType || 'post_checkout',
      squareFeet: squareFeet ? Number(squareFeet) : null,
      bedrooms: bedrooms ? Number(bedrooms) : null,
      bathrooms: bathrooms ? Number(bathrooms) : null,
      hasPets: Boolean(hasPets),
      restockRequested: Boolean(restockRequested),
      quoteAmount: quoteAmount.toString(),
      quoteBreakdown,
      paymentStatus,
      paymentReference: autoMarkPaid ? 'HOST_MARKED_PAID' : null,
      paymentProvider: autoMarkPaid ? 'manual' : null,
      status: "confirmed",
      cleaningStatus: "pending",
    });
    
    logActivity({
      userId: req.user!.id,
      targetUserId: req.user!.id,
      roleScope: "host",
      type: "booking.created",
      message: `New cleaning booking for ${property.name} - $${quoteAmount}`,
      metadata: { bookingId: booking.id, propertyId, quoteAmount, paymentStatus },
    });
    
    let jobsAssigned = 0;
    let jobCreated = null;
    
    // If payment is marked as paid immediately, create job and trigger notifications
    if (autoMarkPaid) {
      // Create cleaner job
      const scheduledDate = cleaningType === 'pre_checkout' 
        ? new Date(checkOut).setHours(-4) // Day before checkout
        : new Date(checkOut);
      
      jobCreated = await storage.createCleanerJob({
        bookingId: booking.id,
        status: 'unassigned',
        jobType: cleaningType === 'round_trip' ? 'post_checkout' : (cleaningType === 'pre_checkout' ? 'pre_checkout' : 'post_checkout'),
        payoutAmount: calculatePayoutAmount(quoteAmount).toString(),
        scheduledDate: new Date(scheduledDate),
      });
      
      // Create deposit payment record
      await storage.createPayment({
        userId: req.user!.id,
        jobId: jobCreated.id,
        type: 'deposit',
        amount: quoteAmount.toString(),
        status: 'completed',
        description: `Cleaning booking for ${property.name}`,
      });
      
      // Update booking cleaning status
      await storage.updateBookingStatus(booking.id, 'confirmed', 'scheduled');
      
      // Auto-assign cleaners
      jobsAssigned = await assignCleanersToBookings();
      
      // Send email confirmation to host
      try {
        await sendEmail(
          req.user!.email,
          'Your cleaning has been scheduled',
          `
            <h2>Cleaning Scheduled</h2>
            <p>Your cleaning for <strong>${property.name}</strong> has been booked!</p>
            <ul>
              <li><strong>Property:</strong> ${property.name}</li>
              <li><strong>Date:</strong> ${new Date(checkOut).toLocaleDateString()}</li>
              <li><strong>Type:</strong> ${cleaningType || 'Post-Checkout'}</li>
              <li><strong>Amount:</strong> $${quoteAmount.toFixed(2)}</li>
            </ul>
            <p>We'll notify you when a cleaner has been assigned.</p>
          `
        );
      } catch (emailErr) {
        console.error('Failed to send host confirmation email:', emailErr);
      }
      
      // Notify admin
      logActivity({
        roleScope: "admin",
        type: "booking.paid",
        message: `New paid cleaning booking from ${req.user!.email} for ${property.name} - $${quoteAmount}`,
        metadata: { bookingId: booking.id, propertyId, quoteAmount },
      });
    }
    
    res.status(201).json({ 
      booking: {
        ...booking,
        paymentStatus,
        quoteAmount,
        quoteBreakdown,
      },
      jobCreated,
      jobsAssigned,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// POST /api/host/bookings/:id/mark-paid - Mark a booking as paid and create job
router.post("/bookings/:id/mark-paid", async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await storage.getBooking(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Verify the booking belongs to this host's property
    const property = await storage.getProperty(booking.propertyId);
    if (!property || property.hostId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have access to this booking" });
    }
    
    // Check if already paid
    if ((booking as any).paymentStatus === 'paid') {
      return res.status(400).json({ error: "Booking is already paid" });
    }
    
    // Update booking payment status
    const updated = await storage.updateBooking(bookingId, {
      paymentStatus: 'paid',
      paymentProvider: 'manual',
      paymentReference: 'HOST_MARKED_PAID',
    });
    
    // Check if job already exists
    let job = await storage.getJobByBookingId(bookingId);
    
    if (!job) {
      // Create cleaner job
      const quoteAmount = Number(booking.quoteAmount || booking.amount);
      const cleaningType = (booking as any).cleaningType || 'post_checkout';
      
      job = await storage.createCleanerJob({
        bookingId: booking.id,
        status: 'unassigned',
        jobType: cleaningType === 'pre_checkout' ? 'pre_checkout' : 'post_checkout',
        payoutAmount: calculatePayoutAmount(quoteAmount).toString(),
        scheduledDate: booking.checkOut,
      });
      
      // Create deposit payment record
      await storage.createPayment({
        userId: req.user!.id,
        jobId: job.id,
        type: 'deposit',
        amount: quoteAmount.toString(),
        status: 'completed',
        description: `Cleaning booking for ${property.name}`,
      });
      
      // Update booking cleaning status
      await storage.updateBookingStatus(booking.id, 'confirmed', 'scheduled');
    }
    
    // Auto-assign cleaners
    const jobsAssigned = await assignCleanersToBookings();
    
    // Send email confirmation to host
    try {
      const quoteAmount = Number(booking.quoteAmount || booking.amount);
      await sendEmail(
        req.user!.email,
        'Your cleaning has been scheduled',
        `
          <h2>Payment Confirmed</h2>
          <p>Your cleaning for <strong>${property.name}</strong> has been confirmed!</p>
          <ul>
            <li><strong>Property:</strong> ${property.name}</li>
            <li><strong>Date:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</li>
            <li><strong>Amount:</strong> $${quoteAmount.toFixed(2)}</li>
          </ul>
          <p>We'll notify you when a cleaner has been assigned.</p>
        `
      );
    } catch (emailErr) {
      console.error('Failed to send host confirmation email:', emailErr);
    }
    
    // Notify admin
    logActivity({
      roleScope: "admin",
      type: "booking.paid",
      message: `Booking marked as paid by ${req.user!.email} for ${property.name}`,
      metadata: { bookingId: booking.id, propertyId: property.id },
    });
    
    res.json({
      booking: updated,
      job,
      jobsAssigned,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to mark booking as paid" });
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

// GET /api/host/bookings/:id - Get a specific booking with details
router.get("/bookings/:id", async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await storage.getBooking(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Verify the booking belongs to this host's property
    const property = await storage.getProperty(booking.propertyId);
    if (!property || property.hostId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have access to this booking" });
    }
    
    // Get associated cleaning jobs
    const jobs = await storage.getJobsByBookingId(bookingId);
    
    res.json({
      ...booking,
      propertyName: property.name,
      propertyAddress: property.address,
      cleaningJobs: jobs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// PUT /api/host/bookings/:id - Update a booking
router.put("/bookings/:id", async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await storage.getBooking(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Verify the booking belongs to this host's property
    const property = await storage.getProperty(booking.propertyId);
    if (!property || property.hostId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have access to this booking" });
    }
    
    const { guestName, checkIn, checkOut, amount, specialInstructions, hostNotes, cleaningType, checkInChecklist, checkOutChecklist } = req.body;
    
    // Whitelist only editable fields
    const updateData: any = {};
    if (guestName !== undefined) updateData.guestName = guestName;
    if (checkIn !== undefined) updateData.checkIn = new Date(checkIn);
    if (checkOut !== undefined) updateData.checkOut = new Date(checkOut);
    if (amount !== undefined) updateData.amount = amount.toString();
    if (specialInstructions !== undefined) updateData.specialInstructions = specialInstructions;
    if (hostNotes !== undefined) updateData.hostNotes = hostNotes;
    if (cleaningType !== undefined) updateData.cleaningType = cleaningType;
    if (checkInChecklist !== undefined) updateData.checkInChecklist = checkInChecklist;
    if (checkOutChecklist !== undefined) updateData.checkOutChecklist = checkOutChecklist;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    
    const updated = await storage.updateBooking(bookingId, updateData);
    
    logActivity({
      userId: req.user!.id,
      targetUserId: req.user!.id,
      roleScope: "host",
      type: "booking.updated",
      message: `Booking for ${updated?.guestName || guestName} has been updated`,
      metadata: { bookingId },
    });
    
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// POST /api/host/bookings/:id/schedule-cleaning - Schedule cleaning for a booking
router.post("/bookings/:id/schedule-cleaning", async (req: AuthRequest, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await storage.getBooking(bookingId);
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    // Verify the booking belongs to this host's property
    const property = await storage.getProperty(booking.propertyId);
    if (!property || property.hostId !== req.user!.id) {
      return res.status(403).json({ error: "You don't have access to this booking" });
    }
    
    const { cleaningType } = req.body;
    
    if (!cleaningType || !['post_checkout', 'pre_checkout', 'round_trip'].includes(cleaningType)) {
      return res.status(400).json({ error: "Invalid cleaning type. Must be post_checkout, pre_checkout, or round_trip" });
    }
    
    // Update booking with cleaning type
    await storage.updateBooking(bookingId, { cleaningType });
    
    // Get existing jobs for this booking
    const existingJobs = await storage.getJobsByBookingId(bookingId);
    
    // Default payout amount (could be configured per property)
    const defaultPayout = "75.00";
    
    // Create cleaning jobs based on type
    const createdJobs: any[] = [];
    
    if (cleaningType === 'pre_checkout' || cleaningType === 'round_trip') {
      // Check if pre-checkout job already exists
      const hasPreCheckout = existingJobs.some((j: any) => j.jobType === 'pre_checkout');
      if (!hasPreCheckout) {
        const preJob = await storage.createCleanerJob({
          bookingId,
          status: "unassigned",
          jobType: "pre_checkout",
          payoutAmount: defaultPayout,
          scheduledDate: new Date(booking.checkOut.getTime() - 3 * 60 * 60 * 1000), // 3 hours before checkout
        });
        createdJobs.push(preJob);
      }
    }
    
    if (cleaningType === 'post_checkout' || cleaningType === 'round_trip') {
      // Check if post-checkout job already exists
      const hasPostCheckout = existingJobs.some((j: any) => j.jobType === 'post_checkout');
      if (!hasPostCheckout) {
        const postJob = await storage.createCleanerJob({
          bookingId,
          status: "unassigned",
          jobType: "post_checkout",
          payoutAmount: defaultPayout,
          scheduledDate: booking.checkOut,
        });
        createdJobs.push(postJob);
      }
    }
    
    // Update booking cleaning status
    await storage.updateBookingStatus(bookingId, booking.status, "scheduled");
    
    // Auto-assign cleaners to new jobs
    const assignedCount = await assignCleanersToBookings();
    
    logActivity({
      userId: req.user!.id,
      targetUserId: req.user!.id,
      roleScope: "host",
      type: "cleaning.scheduled",
      message: `${cleaningType.replace('_', '-')} cleaning scheduled for ${booking.guestName}`,
      metadata: { bookingId, cleaningType, jobsCreated: createdJobs.length },
    });
    
    res.json({
      success: true,
      cleaningType,
      jobsCreated: createdJobs.length,
      jobsAssigned: assignedCount,
      jobs: createdJobs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to schedule cleaning" });
  }
});

export default router;
