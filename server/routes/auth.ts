import { Router } from "express";
import { storage } from "../storage";
import { hashPassword, comparePassword, generateToken, authMiddleware, AuthRequest } from "../auth";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

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
    });
    
    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });
    
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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
    
    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    });
    
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
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
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
