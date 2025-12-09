import { Router } from "express";
import { authMiddleware, AuthRequest } from "../auth";
import { getActivityFeed } from "../services/activityService";

const router = Router();

router.get("/feed", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const limit = parseInt(req.query.limit as string) || 30;
    
    const feed = await getActivityFeed(user.role, user.id, limit);
    res.json(feed);
  } catch (error) {
    console.error("Error fetching activity feed:", error);
    res.status(500).json({ error: "Failed to fetch activity feed" });
  }
});

export default router;
