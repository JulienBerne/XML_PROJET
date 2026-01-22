<template>
  <main class="container section">
    <RouterLink class="back" to="/">← Retour</RouterLink>

    <div v-if="error" class="empty">
      <h3>Erreur</h3>
      <p class="muted">{{ error }}</p>
    </div>

    <template v-else>
      <div v-if="movie" class="movie">
        <!-- ✅ Affiche du film -->
        <div class="movie__poster">
          <img
            v-if="poster"
            :src="poster"
            :alt="movie.title"
            class="movie__posterImg"
            loading="lazy"
          />
          <div v-else class="movie__posterFallback">
            {{ movie.title }}
          </div>
        </div>

        <div class="panel">
          <h1 style="margin: 0 0 6px">{{ movie.title }}</h1>
          <div class="muted" style="display:flex;gap:10px;flex-wrap:wrap;">
            <span>{{ movie.durationMin ?? "—" }} min</span>
            <span>Âge min: {{ movie.minAge ?? "—" }}+</span>
            <span>
              Langue: {{ movie.language ?? "—" }}
              <template v-if="movie.subtitles"> (ST {{ movie.subtitles }})</template>
            </span>
          </div>
          <hr class="sep" />
          <p class="muted" style="margin:0 0 10px;">
            <strong>Réalisateur :</strong> {{ movie.director ?? "—" }}
            <br />
            <strong>Acteurs :</strong> {{ actorsLabel }}
          </p>
        </div>
      </div>

      <div class="panel">
        <div class="panel__head">
          <h2>Séances</h2>
          <div class="muted">{{ sessionsCount }} séance(s)</div>
        </div>

        <div v-if="!sessionsCount" class="empty">
          <h3>Aucune séance</h3>
          <p>Ce film n’a pas de programmation pour le moment.</p>
        </div>

        <div v-else>
          <div
            v-for="(list, place) in groupedSessions"
            :key="place"
            class="panel"
            style="margin:10px 0;"
          >
            <div style="font-weight:800;margin-bottom:8px;">{{ place }}</div>
            <div class="sessions">
              <span v-for="(s, idx) in list" :key="idx" class="time">
                {{ s.day }} {{ s.startTime }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { apiFetch } from "../services/api";

const route = useRoute();
const id = computed(() => route.params.id);

const movie = ref(null);
const error = ref("");

// ✅ Affiche (supporte posterUrl ou poster_url)
const poster = computed(() => movie.value?.posterUrl || movie.value?.poster_url || "");

const actorsLabel = computed(() => (movie.value?.mainActors || []).join(", ") || "—");
const sessionsCount = computed(() => (movie.value?.sessions || []).length);

const groupedSessions = computed(() => {
  const sessions = movie.value?.sessions || [];
  const grouped = {};
  for (const s of sessions) {
    const key = `${s.city || ""} • ${s.cinemaName || "Cinéma"} • ${s.address || ""}`.trim();
    grouped[key] = grouped[key] || [];
    grouped[key].push(s);
  }
  return grouped;
});

async function load() {
  error.value = "";
  movie.value = null;

  if (!id.value) {
    error.value = "ID manquant";
    return;
  }

  try {
    movie.value = await apiFetch(`/api/movies/${encodeURIComponent(id.value)}`);
  } catch (e) {
    error.value = e?.message || "Erreur inconnue";
  }
}

onMounted(load);
</script>

<style scoped>
.movie__poster {
  height: 340px;
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.movie__posterImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.movie__posterFallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding: 14px;
  font-weight: 800;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1), rgba(0, 0, 0, 0.65));
}
</style>
