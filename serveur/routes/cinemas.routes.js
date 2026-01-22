import { Router } from "express";
import { listCinemas, createCinema } from "../controllers/cinemas.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/cinemas", listCinemas);
router.post("/cinemas", requireAuth, requireRole("SUPER_ADMIN"), createCinema);

export default router;
