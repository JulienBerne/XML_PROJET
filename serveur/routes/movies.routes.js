import { Router } from "express";
import { getMoviesByCity, getMovieDetail, createMovie } from "../controllers/movies.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/cities/:city/movies", getMoviesByCity);
router.get("/movies/:id", getMovieDetail);

// création réservée à ADMIN ou SUPER_ADMIN
router.post("/owner/movies", requireAuth, requireRole("ADMIN", "SUPER_ADMIN"), createMovie);

export default router;
