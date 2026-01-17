import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db/pool.js";

dotenv.config();

const app = express();
app.use(express.json());

// Vue (Vite) tourne souvent sur 5173
app.use(cors({ origin: "http://localhost:5173" }));

// ✅ Test API
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ✅ Test DB
app.get("/api/test-db", async (req, res) => {
  await db.query("SELECT 1");
  res.json({ db: "connected", schema: process.env.DB_NAME });
});

// ✅ Exemple: liste des cinémas (pour tester vite)
app.get("/api/cinemas", async (req, res) => {
  const [rows] = await db.query("SELECT id, name, city, address FROM cinemas ORDER BY city, name");
  res.json(rows);
});

// ✅ Exemple: films par ville (si tu as déjà des données)
app.get("/api/cities/:city/movies", async (req, res) => {
  const city = req.params.city;

  const [rows] = await db.query(`
    SELECT
      m.id,
      m.title,
      m.poster_url AS posterUrl,
      m.duration_min AS durationMin,
      m.min_age AS minAge,
      m.language,
      s.start_at AS startAt,
      c.name AS cinemaName
    FROM movies m
    JOIN screenings s ON s.movie_id = m.id
    JOIN cinemas c ON c.id = s.cinema_id
    WHERE c.city = ?
    ORDER BY s.start_at
  `, [city]);

  res.json(rows);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ API: http://localhost:${PORT}`);
});
