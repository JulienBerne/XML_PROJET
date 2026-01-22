<template>
  <main class="container section">
    <div class="panel" v-if="!logged">
      <div class="panel__head">
        <h1>Espace Pro</h1>
        <p class="muted">Connexion requise (rôle ADMIN ou SUPER_ADMIN).</p>
      </div>
      <RouterLink class="btn btn--primary" to="/login">Se connecter</RouterLink>
    </div>

    <div class="panel" v-else-if="!canUseAdmin">
      <div class="panel__head">
        <h1>Accès interdit</h1>
        <p class="muted">Cette page est réservée aux propriétaires (ADMIN) ou au SUPER_ADMIN.</p>
      </div>
      <RouterLink class="btn" to="/">Retour</RouterLink>
    </div>

    <template v-else>
      <!--  LISTE DES FILMS AJOUTÉS -->
      <div class="panel">
        <div class="panel__head" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <div>
            <h1>Mes films ajoutés</h1>
            
          </div>
          <button class="btn" @click="loadMyMovies" :disabled="loadingMovies">
            {{ loadingMovies ? "Chargement..." : "Rafraîchir" }}
          </button>
        </div>

        <div v-if="moviesError" class="muted" style="color:#b00020;">
          {{ moviesError }}
        </div>

        <div v-else-if="myMovies.length === 0" class="muted">
          Aucun film pour le moment.
        </div>

        <div v-else class="movieList">
          <div v-for="m in myMovies" :key="m.id" class="movieRow">
            <div class="movieRow__main">
              <div class="movieRow__title">
                <b>{{ m.title }}</b>
                <span class="muted">#{{ m.id }}</span>
              </div>
              <div class="muted">
                <span v-if="m.year">{{ m.year }} · </span>
                <span v-if="m.durationMin">{{ m.durationMin }} min · </span>
                <span v-if="m.language">{{ m.language }} · </span>
                <span v-if="m.director">{{ m.director }}</span>
              </div>
            </div>

            <!-- bouton ✕ -->
            <button
              class="xBtn"
              title="Supprimer"
              @click="deleteFromList(m.id)"
              :disabled="deletingId === m.id"
            >
              {{ deletingId === m.id ? "..." : "✕" }}
            </button>
          </div>
        </div>
      </div>

      <!-- AJOUT FILM -->
      <div class="panel">
        <div class="panel__head">
          <h2>Publier un film</h2>
          <p class="muted">Ajout d’un film + génération automatique des séances selon la programmation.</p>
        </div>

        <form class="form" @submit.prevent="publish">
          <div class="grid2">
            <div class="field">
              <label class="label">Titre</label>
              <input class="input" v-model="form.title" required />
            </div>
            <div class="field">
              <label class="label">Durée (min)</label>
              <input class="input" v-model.number="form.durationMin" type="number" min="1" required />
            </div>

            <div class="field">
              <label class="label">Langue</label>
              <input class="input" v-model="form.language" placeholder="FR / EN..." />
            </div>
            <div class="field">
              <label class="label">Sous-titres</label>
              <input class="input" v-model="form.subtitles" placeholder="FR, EN..." />
            </div>

            <div class="field">
              <label class="label">Réalisateur</label>
              <input class="input" v-model="form.director" />
            </div>
            <div class="field">
              <label class="label">Âge minimum</label>
              <input class="input" v-model.number="form.minAge" type="number" min="0" />
            </div>

            <div class="field" style="grid-column: 1 / -1">
              <label class="label">Acteurs principaux (virgules)</label>
              <input class="input" v-model="mainActorsRaw" placeholder="Acteur 1, Acteur 2" />
            </div>
          </div>

          <hr class="sep" />
          <h3>Programmation</h3>

          <div class="grid2">
            <div class="field">
              <label class="label">Cinéma (nom)</label>
              <input class="input" v-model="programming.cinemaName" placeholder="UGC Les Halles" required />
            </div>
            <div class="field">
              <label class="label">Ville</label>
              <input class="input" v-model="programming.city" placeholder="Paris" required />
            </div>
            <div class="field" style="grid-column: 1 / -1">
              <label class="label">Adresse</label>
              <input class="input" v-model="programming.address" placeholder="1 Rue ..." required />
            </div>

            <div class="field">
              <label class="label">Date début</label>
              <input class="input" v-model="programming.startDate" type="date" required />
            </div>
            <div class="field">
              <label class="label">Date fin</label>
              <input class="input" v-model="programming.endDate" type="date" required />
            </div>

            <div class="field">
              <label class="label">Jours</label>
              <div class="chips">
                <label class="chip"><input type="checkbox" value="MON" v-model="programming.days" />Lun</label>
                <label class="chip"><input type="checkbox" value="TUE" v-model="programming.days" />Mar</label>
                <label class="chip"><input type="checkbox" value="WED" v-model="programming.days" />Mer</label>
                <label class="chip"><input type="checkbox" value="THU" v-model="programming.days" />Jeu</label>
                <label class="chip"><input type="checkbox" value="FRI" v-model="programming.days" />Ven</label>
                <label class="chip"><input type="checkbox" value="SAT" v-model="programming.days" />Sam</label>
                <label class="chip"><input type="checkbox" value="SUN" v-model="programming.days" />Dim</label>
              </div>
            </div>

            <div class="field">
              <label class="label">Heure</label>
              <input class="input" v-model="programming.startTime" type="time" required />
            </div>
          </div>

          <button class="btn btn--primary" type="submit" :disabled="publishing">
            {{ publishing ? "Publication..." : "Publier" }}
          </button>
          <p class="muted">{{ status }}</p>
        </form>
      </div>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { apiFetch } from "../services/api";
import { getRole, getUserToken, isUserLoggedIn } from "../services/userAuth";

const logged = computed(() => isUserLoggedIn());
const role = computed(() => getRole());
const canUseAdmin = computed(() => ["ADMIN", "SUPER_ADMIN"].includes(role.value));

/**  Liste des films */
const myMovies = ref([]);
const loadingMovies = ref(false);
const moviesError = ref("");
const deletingId = ref(null);

async function loadMyMovies() {
  moviesError.value = "";
  loadingMovies.value = true;
  try {
    myMovies.value = await apiFetch("/api/admin/movies", {
      token: getUserToken(),
    });
  } catch (e) {
    myMovies.value = [];
    moviesError.value = e?.message || "Erreur chargement films";
  } finally {
    loadingMovies.value = false;
  }
}

async function deleteFromList(id) {
  if (!confirm(`Supprimer le film #${id} ?`)) return;

  deletingId.value = id;
  try {
    await apiFetch(`/api/admin/movies/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token: getUserToken(),
    });

    // retire de la liste sans recharger
    myMovies.value = myMovies.value.filter((m) => m.id !== id);
  } catch (e) {
    alert(e?.message || "Erreur suppression");
  } finally {
    deletingId.value = null;
  }
}

/**  Ajout film */
const publishing = ref(false);
const status = ref("");

const form = ref({
  title: "",
  durationMin: 90,
  language: "FR",
  subtitles: "",
  director: "",
  minAge: 0,
});

const programming = ref({
  cinemaName: "",
  city: "Paris",
  address: "",
  startDate: "",
  endDate: "",
  days: [],
  startTime: "18:00",
});

const mainActorsRaw = ref("");

function buildPayload() {
  return {
    ...form.value,
    mainActors: String(mainActorsRaw.value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    programming: { ...programming.value },
  };
}

async function publish() {
  status.value = "";
  publishing.value = true;

  try {
    const created = await apiFetch("/api/admin/movies", {
      method: "POST",
      token: getUserToken(),
      body: buildPayload(),
    });

    status.value = `✅ Publié ! ID film: ${created?.id ?? "?"} (séances: ${created?.screeningsCreated ?? 0})`;

    // reset rapide
    form.value.title = "";
    mainActorsRaw.value = "";

    // ✅ recharge la liste pour voir le nouveau film
    await loadMyMovies();
  } catch (e) {
    status.value = `❌ ${e?.message || "Erreur"}`;
  } finally {
    publishing.value = false;
  }
}

onMounted(() => {
  if (logged.value && canUseAdmin.value) loadMyMovies();
});
</script>

<style scoped>
.movieList {
  display: grid;
  gap: 10px;
}
.movieRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
}
.movieRow__title {
  display: flex;
  gap: 10px;
  align-items: baseline;
  flex-wrap: wrap;
}
.xBtn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.15);
  background: transparent;
  cursor: pointer;
  font-size: 18px;
}
.xBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
