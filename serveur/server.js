import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db/pool.js";

import publicMoviesRoutes from "./routes/public_movies.routes.js";
import requestsRoutes from "./routes/requests.routes.js";
import superAdminRoutes from "./routes/superadmin.routes.js";
import adminMoviesRoutes from "./routes/admin_movies.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());

//  Body parser
app.use(express.json());

//  Test API
app.get("/api/health", (req, res) => res.json({ ok: true }));

//  Test DB
app.get("/api/test-db", async (req, res, next) => {
  try {
    await db.query("SELECT 1");
    res.json({ db: "connected", schema: process.env.DB_NAME });
  } catch (e) {
    next(e);
  }
});

//  Exemple: liste des cinémas (pour tester vite)
app.get("/api/cinemas", async (req, res, next) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, city, address FROM cinemas ORDER BY city, name"
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

//  Auth (login/register)
app.use("/api/auth", authRoutes);

//  Routes publiques (films/séances)
app.use("/api", publicMoviesRoutes);

//  Demandes (USER -> ADMIN)
app.use("/api/requests", requestsRoutes);

//  Super admin (validation des demandes)
app.use("/api/superadmin", superAdminRoutes);

//  Admin (propriétaire) : ajout/suppression films
app.use("/api/admin", adminMoviesRoutes);

//  Error handler (TOUJOURS tout à la fin)
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ API: http://localhost:${PORT}`);
});
