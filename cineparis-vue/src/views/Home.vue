<template>
  <main class="container section">
    <header class="pageHead">
      <div>
        <h1>À l’affiche</h1>
        <p class="muted">Tape une ville (ex: Créteil) ou un film (ex: Inception).</p>
      </div>

      <div class="controls">
        <input
          class="input search"
          v-model="query"
          list="cities"
          placeholder="Rechercher une ville ou un film..."
          @keydown.enter.prevent="applySearch"
        />

        <datalist id="cities">
          <option v-for="c in cities" :key="c" :value="c" />
        </datalist>

        <select class="select" v-model="dayFilter">
          <option value="">Tous</option>
          <option value="MON">Lundi</option>
          <option value="TUE">Mardi</option>
          <option value="WED">Mercredi</option>
          <option value="THU">Jeudi</option>
          <option value="FRI">Vendredi</option>
          <option value="SAT">Samedi</option>
          <option value="SUN">Dimanche</option>
        </select>

        <button class="btn" @click="applySearch" :disabled="loading">
          {{ loading ? "..." : "Rechercher" }}
        </button>

        <button class="btn btn--ghost" @click="clearSearch" :disabled="loading">
          ✕ Effacer
        </button>
      </div>

      <div class="muted" v-if="currentCity">
        Ville courante : <b>{{ currentCity }}</b>
      </div>
      <div class="muted" v-else>
        Affichage : <b>Toutes les villes</b>
      </div>
    </header>

    <div v-if="error" class="panel" style="color:#ff6b6b;">
      {{ error }}
    </div>

    <div v-else-if="loading" class="muted">Chargement...</div>

    <section v-else class="grid">
      <article v-for="movie in filteredMovies" :key="movie.id" class="card">
        <div class="poster">
          <img
            v-if="movie.posterUrl"
            :src="movie.posterUrl"
            :alt="movie.title"
            class="poster__img"
            loading="lazy"
          />
          <div v-else class="poster__fallback">{{ movie.title }}</div>

          <span class="badge">{{ firstDay(movie) }}</span>
        </div>

        <div class="card__body">
          <h3 class="title">{{ movie.title }}</h3>

          <div class="meta muted">
            <span v-if="movie.durationMin">{{ movie.durationMin }} min</span>
            <span v-if="movie.minAge"> · Âge: {{ movie.minAge }}+</span>
            <span v-if="movie.language"> · {{ movie.language }}</span>
          </div>

          <div class="chips">
            <button
              v-for="(s, idx) in visibleSessions(movie)"
              :key="idx"
              class="chipTime"
              @click="goMovie(movie.id)"
            >
              {{ s.startTime }}
            </button>
          </div>

          <button class="btn btn--primary" @click="goMovie(movie.id)">Détails</button>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { apiFetch } from "../services/api";

const router = useRouter();

const loading = ref(false);
const error = ref("");

const query = ref("");
const dayFilter = ref("");

const cities = ref([]);
const currentCity = ref(""); // "" = toutes les villes

const movies = ref([]);        // dataset actuellement affiché
const allMoviesCache = ref([]); // cache "toutes les villes" pour filtrer rapidement

function norm(s) {
  return String(s || "").trim().toLowerCase();
}

function detectCityFromQuery(q) {
  const nq = norm(q);
  if (!nq) return null;

  return (
    cities.value.find((c) => norm(c) === nq) ||
    cities.value.find((c) => norm(c).includes(nq)) ||
    cities.value.find((c) => nq.includes(norm(c))) ||
    null
  );
}

/**
 * Fusionne plusieurs listes /api/cities/:city/movies
 * Même film id -> concat sessions
 */
function mergeMovieLists(lists) {
  const map = new Map();

  for (const list of lists) {
    for (const m of list || []) {
      const id = m.id;
      const sessions = Array.isArray(m.sessions) ? m.sessions : [];

      if (!map.has(id)) {
        map.set(id, { ...m, sessions: [...sessions] });
      } else {
        map.get(id).sessions.push(...sessions);
      }
    }
  }

  // tri sessions (optionnel)
  for (const m of map.values()) {
    m.sessions = (m.sessions || []).slice().sort((a, b) => {
      const aa = `${a.date || ""} ${a.startTime || ""}`.trim();
      const bb = `${b.date || ""} ${b.startTime || ""}`.trim();
      return aa.localeCompare(bb);
    });
  }

  return Array.from(map.values());
}

async function loadCities() {
  const rows = await apiFetch("/api/cinemas");
  const set = new Set(rows.map((r) => String(r.city || "").trim()).filter(Boolean));
  cities.value = Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
}

async function loadMoviesByCity(city) {
  loading.value = true;
  error.value = "";
  try {
    currentCity.value = city;
    const list = await apiFetch(`/api/cities/${encodeURIComponent(city)}/movies`);
    movies.value = list;
  } catch (e) {
    movies.value = [];
    error.value = e?.message || "Erreur de chargement";
  } finally {
    loading.value = false;
  }
}

async function loadAllMovies(force = false) {
  // si déjà en cache et pas "force", on réutilise
  if (!force && allMoviesCache.value.length) {
    currentCity.value = "";
    movies.value = allMoviesCache.value;
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    currentCity.value = "";

    const lists = await Promise.all(
      cities.value.map((c) =>
        apiFetch(`/api/cities/${encodeURIComponent(c)}/movies`).catch(() => [])
      )
    );

    const merged = mergeMovieLists(lists);
    allMoviesCache.value = merged;
    movies.value = merged;
  } catch (e) {
    movies.value = [];
    allMoviesCache.value = [];
    error.value = e?.message || "Erreur de chargement (toutes villes)";
  } finally {
    loading.value = false;
  }
}

async function applySearch() {
  const q = query.value.trim();

  if (!q) {
    await loadAllMovies(false);
    return;
  }

  const city = detectCityFromQuery(q);
  if (city) {
    await loadMoviesByCity(city);
  } else {
    // ✅ recherche film : on veut filtrer sur "tout"
    await loadAllMovies(false);
    // le filtrage se fait par computed (filteredMovies)
  }
}

async function clearSearch() {
  query.value = "";
  dayFilter.value = "";
  await loadAllMovies(false);
}

/**
 * ✅ Filtrage local :
 * - si query = ville => pas de filtre titre (on a déjà chargé la ville)
 * - sinon => filtre titre sur movies (qui est "tout")
 */
const filteredMovies = computed(() => {
  const q = norm(query.value);
  const cityDetected = detectCityFromQuery(query.value);
  const filterByTitle = q && !cityDetected;

  return (movies.value || [])
    .map((m) => ({ ...m, sessions: Array.isArray(m.sessions) ? m.sessions : [] }))
    .filter((m) => {
      if (filterByTitle && !norm(m.title).includes(q)) return false;

      if (dayFilter.value) {
        return m.sessions.some((s) => s.day === dayFilter.value);
      }
      return true;
    });
});

function visibleSessions(movie) {
  const sessions = movie.sessions || [];
  const filtered = dayFilter.value ? sessions.filter((s) => s.day === dayFilter.value) : sessions;
  return filtered.slice(0, 6);
}

function firstDay(movie) {
  return (movie.sessions || [])[0]?.day || "—";
}

function goMovie(id) {
  router.push(`/movie/${id}`);
}

// ✅ démarrage : TOUT
onMounted(async () => {
  await loadCities();
  await loadAllMovies(true);
});

/**
 * ✅ UX : si l'utilisateur tape une ville exacte, on charge la ville
 * ✅ Si l'utilisateur tape autre chose (film), on ne recharge pas à chaque lettre
 *    -> il clique Rechercher ou Enter pour basculer sur "tout" et filtrer.
 */
let t = null;
watch(query, (v) => {
  clearTimeout(t);
  t = setTimeout(async () => {
    const trimmed = v.trim();

    if (!trimmed) {
      await loadAllMovies(false);
      return;
    }

    const city = detectCityFromQuery(trimmed);

    // si c'est une ville => reload automatique
    if (city && city !== currentCity.value) {
      await loadMoviesByCity(city);
    }
    // sinon: rien (film) -> filtre local après clic Rechercher/Enter
  }, 300);
});
</script>

<style scoped>
.pageHead { display:flex; justify-content:space-between; align-items:flex-end; gap:16px; margin-bottom:16px; flex-wrap:wrap; }
.controls { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
.search { min-width: 280px; }

.btn--ghost { background: transparent; border: 1px solid rgba(255,255,255,0.15); }
.btn--ghost:hover { border-color: rgba(255,165,0,0.9); }

.grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:16px; }
.card { border-radius:18px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); }

.poster { position:relative; height:280px; border-bottom:1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.06); }
.poster__img { width:100%; height:100%; object-fit:cover; display:block; }
.poster__fallback { width:100%; height:100%; display:flex; align-items:flex-end; padding:14px; font-weight:800;
  background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.65)); }
.badge { position:absolute; left:12px; top:12px; background:#f9c74f; color:#111; font-weight:800; font-size:12px; padding:5px 10px; border-radius:999px; }

.card__body { padding:14px; }
.title { margin:0 0 6px 0; }
.meta { margin-bottom:10px; }

.chips { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
.chipTime { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:white; padding:6px 10px; border-radius:999px; cursor:pointer; }
</style>
