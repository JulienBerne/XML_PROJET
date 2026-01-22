import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { listAllRequests, approveRequest, rejectRequest } from "../controllers/requests.controller.js";

const router = Router();

// SUPER_ADMIN gère les demandes
router.get("/requests", requireAuth, requireRole("SUPER_ADMIN"), listAllRequests);
router.post("/requests/:id/approve", requireAuth, requireRole("SUPER_ADMIN"), approveRequest);
router.post("/requests/:id/reject", requireAuth, requireRole("SUPER_ADMIN"), rejectRequest);

export default router;
