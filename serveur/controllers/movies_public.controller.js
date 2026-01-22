import { db } from "../db/pool.js";

function dayCodeFromDate(d) {
  const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return map[d.getDay()];
}

// GET /api/cities/:city/movies -> liste de films avec sessions[]
export async function listMoviesByCity(req, res, next) {
  try {
    const city = req.params.city;

    const [rows] = await db.query(
      `
      SELECT
        m.id,
        m.title,
        m.poster_url AS posterUrl,
        m.duration_min AS durationMin,
        m.min_age AS minAge,
        m.language,
        m.subtitles,
        m.director,
        m.actors_text AS actorsText,
        s.start_at AS startAt,
        c.name AS cinemaName,
        c.address AS address,
        c.city AS city
      FROM movies m
      JOIN screenings s ON s.movie_id = m.id
      JOIN cinemas c ON c.id = s.cinema_id
      WHERE c.city = ?
      ORDER BY m.id, s.start_at
      `,
      [city]
    );

    // group by movie id
    const byId = new Map();
    for (const r of rows) {
      if (!byId.has(r.id)) {
        byId.set(r.id, {
          id: r.id,
          title: r.title,
          posterUrl: r.posterUrl,
          durationMin: r.durationMin,
          minAge: r.minAge,
          language: r.language,
          subtitles: r.subtitles,
          director: r.director,
          mainActors: r.actorsText ? String(r.actorsText).split(",").map(s=>s.trim()).filter(Boolean) : [],
          sessions: [],
        });
      }
      const m = byId.get(r.id);
      const d = new Date(r.startAt);
      m.sessions.push({
        day: dayCodeFromDate(d),
        startTime: d.toTimeString().slice(0,5),
        city: r.city,
        cinemaName: r.cinemaName,
        address: r.address,
      });
    }

    res.json([...byId.values()]);
  } catch (err) {
    next(err);
  }
}

// GET /api/movies/:id -> détail film + sessions[]
export async function getMovieDetail(req, res, next) {
  try {
    const id = Number(req.params.id);

    const [mrows] = await db.query(
      `SELECT id, title, poster_url AS posterUrl, duration_min AS durationMin, min_age AS minAge,
              language, subtitles, director, actors_text AS actorsText
       FROM movies WHERE id=? LIMIT 1`,
      [id]
    );
    if (!mrows.length) return res.status(404).json({ message: "Film introuvable" });

    const movie = mrows[0];
    movie.mainActors = movie.actorsText ? String(movie.actorsText).split(",").map(s=>s.trim()).filter(Boolean) : [];
    delete movie.actorsText;

    const [srows] = await db.query(
      `SELECT s.start_at AS startAt, c.name AS cinemaName, c.city AS city, c.address AS address
       FROM screenings s
       JOIN cinemas c ON c.id = s.cinema_id
       WHERE s.movie_id = ?
       ORDER BY s.start_at`,
      [id]
    );

    movie.sessions = srows.map((r) => {
      const d = new Date(r.startAt);
      return {
        day: dayCodeFromDate(d),
        startTime: d.toTimeString().slice(0,5),
        city: r.city,
        cinemaName: r.cinemaName,
        address: r.address,
      };
    });

    res.json(movie);
  } catch (err) {
    next(err);
  }
}
