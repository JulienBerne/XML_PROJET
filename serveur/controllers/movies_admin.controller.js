import { db } from "../db/pool.js";

/**
 * Ajout / suppression de films par un propriétaire (role ADMIN) ou SUPER_ADMIN.
 * Règle :
 * - ADMIN ne peut supprimer que les films qu'il a créés (movies.created_by = req.user.sub)
 * - SUPER_ADMIN peut supprimer tout.
 */

// helper: day code from JS to MON..SUN
function dayCodeFromDate(d) {
  // JS getDay: 0 Sunday .. 6 Saturday
  const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return map[d.getDay()];
}

function parseDateISO(s) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  // normalize to midnight
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function createMovieWithProgramming(req, res, next) {
  try {
    const creatorId = req.user.sub;

    const {
      title,
      durationMin,
      language,
      subtitles,
      director,
      mainActors,
      minAge,
      posterUrl,
      programming,
    } = req.body || {};

    if (!title || !programming?.city || !programming?.cinemaName || !programming?.address) {
      return res.status(400).json({ message: "Champs requis manquants (title, programming.city/cinemaName/address)" });
    }

    const actorsText = Array.isArray(mainActors) ? mainActors.join(", ") : (mainActors || null);

    const [movieRes] = await db.query(
      `INSERT INTO movies (title, duration_min, min_age, language, subtitles, director, actors_text, poster_url, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
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
    const { cinemaName, city, address, startDate, endDate, days, startTime, priceEur, room, format } = programming;

    const [cinRows] = await db.query(
      "SELECT id FROM cinemas WHERE name=? AND city=? AND address=? LIMIT 1",
      [cinemaName, city, address]
    );

    let cinemaId;
    if (cinRows.length) {
      cinemaId = cinRows[0].id;
    } else {
      const [cinRes] = await db.query(
        "INSERT INTO cinemas (name, city, address) VALUES (?, ?, ?)",
        [cinemaName, city, address]
      );
      cinemaId = cinRes.insertId;
    }

    // Create screenings from date range + chosen day codes
    const d0 = parseDateISO(startDate);
    const d1 = parseDateISO(endDate);
    const daySet = new Set(Array.isArray(days) ? days : []);

    if (!d0 || !d1 || !startTime || !daySet.size) {
      return res.status(400).json({ message: "Programmation invalide (dates/days/startTime)" });
    }

    // ensure d0 <= d1
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
      // bulk insert
      const values = screenings.map(() => "(?,?,?,?,?,?)").join(",");
      const flat = screenings.flat();
      await db.query(
        `INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format) VALUES ${values}`,
        flat
      );
    }

    res.status(201).json({ id: movieId, screeningsCreated: screenings.length });
  } catch (err) {
    next(err);
  }
}

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
