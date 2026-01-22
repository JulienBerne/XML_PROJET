const TMDB_BASE = "https://api.themoviedb.org/3";

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

function tmdbAuthQuery() {
    const apiKey = process.env.TMDB_API_KEY;
    return apiKey ? `api_key=${encodeURIComponent(apiKey)}` : "";
}

async function tmdbFetch(url) {
    const res = await fetch(url, { headers: tmdbHeaders() });
    if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TMDb error ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
}

/**
 * Cherche un film par titre (+ année optionnelle)
 * Retourne une URL d'affiche (w500) ou null
 */
export async function findPosterUrl(title, year) {
    if (!title) return null;

    const params = new URLSearchParams();
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

  // TMDb image basics: base + size + poster_path :contentReference[oaicite:3]{index=3}
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
}
