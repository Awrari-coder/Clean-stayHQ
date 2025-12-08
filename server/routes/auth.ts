import { Router } from "express";
import { storage } from "../storage";
import { hashPassword, comparePassword, generateToken, authMiddleware, AuthRequest } from "../auth";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import { sendEmail } from "../services/notificationsService";

const router = Router();

function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function sendVerificationEmail(email: string, name: string, token: string): Promise<boolean> {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';
  
  const verifyUrl = `${baseUrl}/verify?token=${token}`;
  
  return await sendEmail(
    email,
    "Verify your CleanStay account",
    `
    <h2>Welcome to CleanStay!</h2>
    <p>Hi ${name},</p>
    <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
    <p><a href="${verifyUrl}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a></p>
    <p>Or copy this link: ${verifyUrl}</p>
    <p>This link will expire in 24 hours.</p>
    <p>Best,<br>CleanStay Team</p>
    `
  );
}

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["host", "cleaner", "admin", "cleaning_company"]).default("host"),
  phone: z.string().optional(),
  companyId: z.number().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/register", async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    
    // Hash password and create user
    const passwordHash = await hashPassword(data.password);
    const user = await storage.createUser({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      phone: data.phone || null,
      companyId: data.companyId || null,
      avatar: null,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationSentAt: new Date(),
    });
    
    // Send verification email (async, don't block registration)
    sendVerificationEmail(user.email, user.name, verificationToken)
      .catch(err => console.error("[Auth] Failed to send verification email:", err));
    
    // Generate auth token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      emailVerified: user.emailVerified,
    });
    
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    
    // Find user
    const user = await storage.getUserByEmail(data.email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Verify password
    const validPassword = await comparePassword(data.password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Generate token (includes email_verified for frontend use)
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      emailVerified: user.emailVerified,
    });
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify email endpoint
router.get("/verify-email", async (req, res) => {
  try {
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }
    
    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }
    
    // Mark email as verified
    await storage.updateUserVerification(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
    });
    
    res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Resend verification email
router.post("/resend-verification", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }
    
    // Generate new token
    const newToken = generateVerificationToken();
    
    await storage.updateUserVerification(user.id, {
      emailVerificationToken: newToken,
      emailVerificationSentAt: new Date(),
    });
    
    // Send verification email
    await sendVerificationEmail(user.email, user.name, newToken);
    
    res.json({ success: true, message: "Verification email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
