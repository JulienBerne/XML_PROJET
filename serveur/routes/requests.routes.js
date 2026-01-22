import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { createAdminRequest, listMyRequests } from "../controllers/requests.controller.js";

const router = Router();

// USER demande à devenir ADMIN (propriétaire)
router.post("/admin", requireAuth, createAdminRequest);

// USER consulte ses demandes
router.get("/me", requireAuth, listMyRequests);

export default router;
