import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { createMovieWithProgramming, deleteMovie } from "../controllers/movies_admin.controller.js";

const router = Router();

// ADMIN (propriétaire) ou SUPER_ADMIN
router.post("/movies", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), createMovieWithProgramming);
router.delete("/movies/:id", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), deleteMovie);

export default router;
