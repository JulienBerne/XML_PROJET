<template>
  <main>
    <section class="hero">
      <div class="container hero__inner">
        <div>
          <h1>Films & programmations dans les cinémas</h1>
          <p>Choisis une ville / zone, puis découvre les films disponibles et leurs séances.</p>
        </div>

        <div class="filters">
          <div class="search">
            <input v-model="q" type="search" placeholder="Rechercher un film, un réalisateur..." />
          </div>

          <div>
            <label class="label" for="city">Ville</label>
            <select id="city" class="select" v-model="city">
              <option value="Paris">Paris</option>
              <option value="Boulogne-Billancourt">Boulogne-Billancourt</option>
              <option value="Saint-Denis">Saint-Denis</option>
              <option value="Créteil">Créteil</option>
            </select>
          </div>

          <div>
            <label class="label" for="day">Jour</label>
            <select id="day" class="select" v-model="day">
              <option value="">Tous</option>
              <option value="MON">Lundi</option>
              <option value="TUE">Mardi</option>
              <option value="WED">Mercredi</option>
              <option value="THU">Jeudi</option>
              <option value="FRI">Vendredi</option>
              <option value="SAT">Samedi</option>
              <option value="SUN">Dimanche</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <section class="container section">
      <div class="section__head">
        <h2>{{ resultsTitle }}</h2>
        <div class="pill">{{ countLabel }}</div>
      </div>

      <div v-if="error" class="empty">
        <h3>Impossible de charger</h3>
        <p class="muted">{{ error }}</p>
      </div>

      <div v-else>
        <div class="grid" v-if="filteredMovies.length">
          <RouterLink
            v-for="m in filteredMovies"
            :key="m.id"
            class="card"
            :to="{ name: 'movie', params: { id: m.id } }"
          >
            <div class="poster">
              <span class="poster__tag">{{ firstDayTag(m) }}</span>
            </div>
            <div class="card__body">
              <h3 class="card__title">{{ m.title }}</h3>
              <div class="card__meta">
                <span>{{ m.durationMin ?? "—" }} min</span>
                <span>Âge: {{ m.minAge ?? "—" }}+</span>
                <span>{{ m.language ?? "" }}</span>
              </div>
              <div class="times">
                <span v-for="(t, idx) in firstTimes(m)" :key="idx" class="time">{{ t }}</span>
              </div>
            </div>
          </RouterLink>
        </div>

        <div v-else class="empty">
          <h3>Aucun film trouvé</h3>
          <p>Essaie une autre ville, enlève le filtre de jour, ou change ta recherche.</p>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container footer__inner">
        <span>© {{ year }} CinéParis</span>
        <span class="muted">Projet REST – Films & séances</span>
      </div>
    </footer>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { apiFetch } from "../services/api";

const q = ref("");
const city = ref("Paris");
const day = ref("");
const movies = ref([]);
const error = ref("");
const year = new Date().getFullYear();

const resultsTitle = computed(() => `À l’affiche – ${city.value}`);

function normalize(s = "") {
  return String(s).toLowerCase().trim();
}

function applyFilters(list) {
  const nq = normalize(q.value);
  const d = day.value;

  return list.filter((m) => {
    const hay = normalize([m.title, m.director, (m.mainActors || []).join(",")].filter(Boolean).join(" "));
    const okQ = !nq || hay.includes(nq);
    const okDay = !d || (m.sessions || []).some((s) => s.day === d);
    return okQ && okDay;
  });
}

const filteredMovies = computed(() => applyFilters(movies.value));

const countLabel = computed(() => {
  const n = filteredMovies.value.length;
  return `${n} film${n > 1 ? "s" : ""}`;
});

async function loadMovies() {
  error.value = "";
  try {
    const data = await apiFetch(`/api/cities/${encodeURIComponent(city.value)}/movies`);
    movies.value = Array.isArray(data) ? data : (data?.items || []);
  } catch (e) {
    error.value = e?.message || "Erreur inconnue";
    movies.value = [];
  }
}

function firstTimes(m) {
  return (m.sessions || []).slice(0, 6).map((s) => `${s.startTime || "--:--"}`);
}
function firstDayTag(m) {
  return m.sessions?.[0]?.day ? m.sessions[0].day : "Séances";
}

watch(city, () => loadMovies());
onMounted(loadMovies);
</script>
