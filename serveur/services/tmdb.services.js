import dotenv from "dotenv";
dotenv.config();

/**
 * Recherche l'affiche d'un film via TMDB
 * @param {string} title - titre du film
 * @param {number} year - année de sortie (optionnelle)
 * @returns {string|null} URL de l'affiche ou null
 */
export async function findPosterUrl(title, year) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      query: title,
      include_adult: "false",
      language: "fr-FR"
    });

    if (year) {
      params.set("year", String(year));
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?${params.toString()}`
    );

    if (!response.ok) {
      console.error("TMDB error:", response.status);
      return null;
    }

    const data = await response.json();
    const movie = data.results?.[0];

    if (!movie || !movie.poster_path) {
      return null;
    }

    // URL officielle TMDB (taille w500 idéale pour affichage)
    return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;

  } catch (err) {
    console.error("TMDB fetch failed:", err);
    return null;
  }
}
