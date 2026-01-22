import { db } from "../db/pool.js";
import { findPosterUrl } from "../services/tmdb.services.js";

export async function getMoviesByCity(req, res) {
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
}

export async function getMovieDetail(req, res) {
  const id = Number(req.params.id);

  const [[movie]] = await db.query("SELECT * FROM movies WHERE id = ?", [id]);
  if (!movie) return res.status(404).json({ error: "Film non trouvé" });

  const [screenings] = await db.query(`
    SELECT
      s.start_at AS startAt,
      s.price_eur AS price,
      s.room,
      s.format,
      c.id AS cinemaId,
      c.name AS cinemaName,
      c.city,
      c.address
    FROM screenings s
    JOIN cinemas c ON c.id = s.cinema_id
    WHERE s.movie_id = ?
    ORDER BY s.start_at
  `, [id]);

  res.json({
    id: movie.id,
    title: movie.title,
    year: movie.year,
    durationMin: movie.duration_min,
    minAge: movie.min_age,
    language: movie.language,
    subtitles: movie.subtitles,
    director: movie.director,
    actors: movie.actors_text,
    posterUrl: movie.poster_url,
    screenings
  });
}

/**
 * Body attendu (exemple):
 * {
 *  "title": "Inception",
 *  "year": 2010,
 *  "durationMin": 148,
 *  "minAge": 12,
 *  "language": "EN",
 *  "director": "Christopher Nolan",
 *  "actors": "Leonardo DiCaprio, ...",
 *  "programming": { "cinemaId": 1, "startAt": "2026-01-25 20:30:00", "price": 12.5 }
 * }
 */
export async function createMovie(req, res) {
  const {
    title, year, durationMin, minAge, language, subtitles, director, actors, programming
  } = req.body || {};

  if (!title) return res.status(400).json({ error: "title required" });
  if (!programming?.cinemaId || !programming?.startAt) {
    return res.status(400).json({ error: "programming.cinemaId and programming.startAt required" });
  }

  // Poster TMDB + fallback local
  const posterUrl =
    (await findPosterUrl(title, year)) ||
    `http://localhost:${process.env.PORT || 8080}/img/no-poster.png`;

  // 1) insert movie
  const [r] = await db.query(`
    INSERT INTO movies
    (title, year, duration_min, min_age, language, subtitles, director, actors_text, poster_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    title,
    year ?? null,
    durationMin ?? null,
    minAge ?? null,
    language ?? null,
    subtitles ?? null,
    director ?? null,
    actors ?? null,
    posterUrl
  ]);

  const movieId = r.insertId;

  // 2) insert screening
  await db.query(`
    INSERT INTO screenings (movie_id, cinema_id, start_at, price_eur, room, format)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    movieId,
    programming.cinemaId,
    programming.startAt,
    programming.price ?? null,
    programming.room ?? null,
    programming.format ?? null
  ]);

  res.status(201).json({ id: movieId, posterUrl });
}
