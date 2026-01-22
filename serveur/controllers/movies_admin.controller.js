import { db } from "../db/pool.js";

/**
 * Rôles (selon votre convention) :
 * - ADMIN = propriétaire (OWNER)
 * - SUPER_ADMIN = admin système
 *
 * Règle suppression :
 * - ADMIN ne supprime que ses films (movies.created_by = req.user.sub)
 * - SUPER_ADMIN peut supprimer tout
 *
 * TMDb :
 * - Si posterUrl est vide, on tente de récupérer une affiche depuis TMDb.
 * - Config dans serveur/.env :
 *     TMDB_API_KEY=xxxx
 *   ou
 *     TMDB_BEARER=eyJ...
 */

// -----------------------
// TMDb helpers
// -----------------------
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p/w500";

function tmdbHeaders() {
  const bearer = process.env.TMDB_BEARER;
  if (bearer) {
    return {
      Authorization: `Bearer ${bearer}`,
      Accept: "application/json",
    };
  }
  return { Accept: "application/json" };
}

async function tmdbFetch(url) {
  const res = await fetch(url, { headers: tmdbHeaders() });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TMDb ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function findPosterUrlTMDb(title, year) {
  if (!title) return null;

  const params = new URLSearchParams();
  // API Key v3 (optionnel si Bearer présent)
  if (process.env.TMDB_API_KEY) params.set("api_key", process.env.TMDB_API_KEY);

  params.set("query", title);
  params.set("include_adult", "false");
  params.set("language", "fr-FR");
  if (year) params.set("year", String(year));

  const url = `${TMDB_BASE}/search/movie?${params.toString()}`;
  const data = await tmdbFetch(url);

  const first = data?.results?.[0];
  const posterPath = first?.poster_path;
  if (!posterPath) return null;

  return `${TMDB_IMG_BASE}${posterPath}`;
}

// -----------------------
// Helpers (programmation)
// -----------------------
function dayCodeFromDate(d) {
  // JS getDay: 0 Sunday .. 6 Saturday
  const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return map[d.getDay()];
}

function parseDateISO(s) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

// -----------------------
// GET /api/admin/movies
// -----------------------
export async function listAdminMovies(req, res, next) {
  try {
    const userId = req.user.sub;
    const role = req.user.role;

    let sql = `
      SELECT
        id,
        title,
        year,
        duration_min AS durationMin,
        min_age AS minAge,
        language,
        subtitles,
        director,
        actors_text AS actorsText,
        poster_url AS posterUrl,
        created_by AS createdBy,
        created_at AS createdAt
      FROM movies
    `;
    const params = [];

    if (role === "ADMIN") {
      sql += " WHERE created_by = ? ";
      params.push(userId);
    }

    sql += " ORDER BY created_at DESC ";

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// -----------------------
// POST /api/admin/movies
// Ajout film + génération séances
// + Auto poster TMDb si posterUrl vide
// -----------------------
export async function createMovieWithProgramming(req, res, next) {
  try {
    const creatorId = req.user.sub;

    let {
      title,
      year, // optionnel
      durationMin,
      language,
      subtitles,
      director,
      mainActors,
      minAge,
      posterUrl, // optionnel
      programming,
    } = req.body || {};

    if (!title || !programming?.city || !programming?.cinemaName || !programming?.address) {
      return res
        .status(400)
        .json({ message: "Champs requis manquants (title, programming.city/cinemaName/address)" });
    }

    // ✅ Auto TMDb poster si posterUrl non fourni
    if (!posterUrl) {
      try {
        const tmdbPoster = await findPosterUrlTMDb(title, year);
        if (tmdbPoster) posterUrl = tmdbPoster;
      } catch (e) {
        // On n'empêche pas l'ajout si TMDb est HS / rate-limit etc.
        console.warn("TMDb poster lookup failed:", e.message);
      }
    }

    const actorsText = Array.isArray(mainActors) ? mainActors.join(", ") : mainActors || null;

    // INSERT movie
    const [movieRes] = await db.query(
      `INSERT INTO movies (title, year, duration_min, min_age, language, subtitles, director, actors_text, poster_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        year ? Number(year) : null,
        Number(durationMin) || null,
        Number(minAge) || null,
        language || null,
        subtitles || null,
        director || null,
        actorsText,
        posterUrl || null,
        creatorId,
      ]
    );

    const movieId = movieRes.insertId;

    // Cinema: find or create by (name, city, address)
    const {
      cinemaName,
      city,
      address,
      startDate,
      endDate,
      days,
      startTime,
      priceEur,
      room,
      format,
    } = programming;

    const [cinRows] = await db.query(
      "SELECT id FROM cinemas WHERE name=? AND city=? AND address=? LIMIT 1",
      [cinemaName, city, address]
    );

    let cinemaId;
    if (cinRows.length) {
      cinemaId = cinRows[0].id;
    } else {
      const [cinRes] = await db.query("INSERT INTO cinemas (name, city, address) VALUES (?, ?, ?)", [
        cinemaName,
        city,
        address,
      ]);
      cinemaId = cinRes.insertId;
    }

    // Create screenings from date range + chosen day codes
    const d0 = parseDateISO(startDate);
    const d1 = parseDateISO(endDate);
    const daySet = new Set(Array.isArray(days) ? days : []);

    if (!d0 || !d1 || !startTime || !daySet.size) {
      return res.status(400).json({ message: "Programmation invalide (dates/days/startTime)" });
    }

    const start = d0.getTime() <= d1.getTime() ? d0 : d1;
    const end = d0.getTime() <= d1.getTime() ? d1 : d0;

    const [hh, mm] = String(startTime).split(":").map((x) => Number(x));
    const screenings = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const code = dayCodeFromDate(d);
      if (!daySet.has(code)) continue;

      const dt = new Date(d);
      dt.setHours(hh || 0, mm || 0, 0, 0);

      screenings.push([
        movieId,
        cinemaId,
        dt.toISOString().slice(0, 19).replace("T", " "),
        priceEur ?? null,
        room ?? null,
        format ?? null,
      ]);
    }

    if (screenings.length) {
      const values = screenings.map(() => "(?,?,?,?,?,?)").join(",");
      const flat = screenings.flat();
      await db.query(
        `INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format) VALUES ${values}`,
        flat
      );
    }

    res.status(201).json({
      id: movieId,
      screeningsCreated: screenings.length,
      posterUrl: posterUrl || null,
    });
  } catch (err) {
    next(err);
  }
}

// -----------------------
// DELETE /api/admin/movies/:id
// -----------------------
export async function deleteMovie(req, res, next) {
  try {
    const movieId = Number(req.params.id);
    const userId = req.user.sub;
    const role = req.user.role;

    const [rows] = await db.query("SELECT id, created_by AS createdBy FROM movies WHERE id=? LIMIT 1", [movieId]);
    if (!rows.length) return res.status(404).json({ message: "Film introuvable" });

    if (role === "ADMIN" && rows[0].createdBy !== userId) {
      return res.status(403).json({ message: "Tu ne peux supprimer que tes propres films" });
    }

    await db.query("DELETE FROM movies WHERE id=?", [movieId]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
