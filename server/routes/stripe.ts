import { Router } from "express";
import { storage } from "../storage";
import { authMiddleware, AuthRequest } from "../auth";
import { getUncachableStripeClient, getStripePublishableKey } from "../stripeClient";
import { sql } from "drizzle-orm";
import { db } from "../db";

const router = Router();

router.get("/publishable-key", async (req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (error) {
    console.error("[Stripe] Failed to get publishable key:", error);
    res.status(500).json({ error: "Failed to get Stripe configuration" });
  }
});

router.get("/products", async (req, res) => {
  try {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = true`
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("[Stripe] Failed to fetch products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/products-with-prices", async (req, res) => {
  try {
    const result = await db.execute(
      sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );

    const productsMap = new Map();
    for (const row of result.rows as any[]) {
      if (!productsMap.has(row.product_id)) {
        productsMap.set(row.product_id, {
          id: row.product_id,
          name: row.product_name,
          description: row.product_description,
          active: row.product_active,
          metadata: row.product_metadata,
          prices: []
        });
      }
      if (row.price_id) {
        productsMap.get(row.product_id).prices.push({
          id: row.price_id,
          unit_amount: row.unit_amount,
          currency: row.currency,
          recurring: row.recurring,
          active: row.price_active,
        });
      }
    }

    res.json({ data: Array.from(productsMap.values()) });
  } catch (error) {
    console.error("[Stripe] Failed to fetch products with prices:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/subscription", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user?.stripeSubscriptionId) {
      return res.json({ subscription: null });
    }

    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${user.stripeSubscriptionId}`
    );
    res.json({ subscription: result.rows[0] || null });
  } catch (error) {
    console.error("[Stripe] Failed to fetch subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

router.post("/create-checkout-session", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { priceId, mode = 'subscription' } = req.body;
    
    if (!priceId) {
      return res.status(400).json({ error: "Price ID is required" });
    }

    const stripe = await getUncachableStripeClient();
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id.toString() },
      });
      await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode as 'subscription' | 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe] Failed to create checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/create-portal-session", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ error: "No Stripe customer found" });
    }

    const stripe = await getUncachableStripeClient();
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : process.env.REPLIT_DOMAINS 
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000';

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/host/settings`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe] Failed to create portal session:", error);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

export default router;
