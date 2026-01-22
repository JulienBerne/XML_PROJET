import { Router } from "express";
import { listMoviesByCity, getMovieDetail } from "../controllers/movies_public.controller.js";

const router = Router();

router.get("/cities/:city/movies", listMoviesByCity);
router.get("/movies/:id", getMovieDetail);

export default router;
