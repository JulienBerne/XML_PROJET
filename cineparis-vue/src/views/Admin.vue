<template>
  <main class="container section">
    <div class="panel">
      <div class="panel__head">
        <h1>Publier un film</h1>
        <p class="muted">Réservé aux propriétaires (auth simplifiée via token).</p>
      </div>

      <form class="form form--inline" @submit.prevent="saveToken">
        <div class="field">
          <label class="label" for="token">Identifiant / Token</label>
          <input class="input" id="token" v-model="tokenInput" placeholder="ex: abcd-1234" />
        </div>
        <button class="btn" type="submit">Se connecter</button>
        <span class="muted">{{ loginState }}</span>
        <button v-if="ownerToken" class="btn" type="button" @click="logoutOwner">Déconnexion</button>
      </form>
    </div>

    <div class="panel">
      <div class="panel__head">
        <h2>Nouveau film</h2>
        <p class="muted">Formulaire identique à la version HTML/JS (admin.js).</p>
      </div>

      <form class="form" @submit.prevent="publish">
        <div class="grid2">
          <div class="field">
            <label class="label">Titre</label>
            <input class="input" v-model="form.title" name="title" required />
          </div>

          <div class="field">
            <label class="label">Durée (min)</label>
            <input class="input" v-model.number="form.durationMin" name="durationMin" type="number" min="1" required />
          </div>

          <div class="field">
            <label class="label">Langue</label>
            <input class="input" v-model="form.language" name="language" placeholder="FR / EN..." required />
          </div>

          <div class="field">
            <label class="label">Sous-titres (optionnel)</label>
            <input class="input" v-model="form.subtitles" name="subtitles" placeholder="FR, EN..." />
          </div>

          <div class="field">
            <label class="label">Réalisateur</label>
            <input class="input" v-model="form.director" name="director" required />
          </div>

          <div class="field">
            <label class="label">Âge minimum</label>
            <input class="input" v-model.number="form.minAge" name="minAge" type="number" min="0" required />
          </div>

          <div class="field" style="grid-column: 1 / -1">
            <label class="label">Acteurs principaux (séparés par des virgules)</label>
            <input
              class="input"
              v-model="mainActorsRaw"
              name="mainActors"
              placeholder="Acteur 1, Acteur 2, Acteur 3"
              required
            />
          </div>
        </div>

        <hr class="sep" />

        <h3>Programmation</h3>

        <div class="grid2">
          <div class="field">
            <label class="label">Ville</label>
            <input class="input" v-model="form.city" name="city" placeholder="Paris" required />
          </div>

          <div class="field">
            <label class="label">Adresse cinéma</label>
            <input class="input" v-model="form.address" name="address" placeholder="12 Rue ..." required />
          </div>

          <div class="field">
            <label class="label">Date début</label>
            <input class="input" v-model="form.startDate" name="startDate" type="date" required />
          </div>

          <div class="field">
            <label class="label">Date fin</label>
            <input class="input" v-model="form.endDate" name="endDate" type="date" required />
          </div>

          <div class="field">
            <label class="label">Jours (3 jours / semaine attendu côté back)</label>
            <div class="chips">
              <label class="chip"><input type="checkbox" value="MON" v-model="form.days" />Lun</label>
              <label class="chip"><input type="checkbox" value="TUE" v-model="form.days" />Mar</label>
              <label class="chip"><input type="checkbox" value="WED" v-model="form.days" />Mer</label>
              <label class="chip"><input type="checkbox" value="THU" v-model="form.days" />Jeu</label>
              <label class="chip"><input type="checkbox" value="FRI" v-model="form.days" />Ven</label>
              <label class="chip"><input type="checkbox" value="SAT" v-model="form.days" />Sam</label>
              <label class="chip"><input type="checkbox" value="SUN" v-model="form.days" />Dim</label>
            </div>
          </div>

          <div class="field">
            <label class="label">Heure début (par séance)</label>
            <input class="input" v-model="form.startTime" name="startTime" type="time" required />
          </div>
        </div>

        <button class="btn btn--primary" type="submit" :disabled="publishing">
          {{ publishing ? "Publication..." : "Publier" }}
        </button>

        <p class="muted">{{ status }}</p>
      </form>
    </div>
  </main>
</template>

<script setup>
import { computed, ref } from "vue";
import { apiFetch } from "../services/api";
import { clearOwnerToken, getOwnerToken, setOwnerToken } from "../services/auth";

/**
 * Conversion fidèle du fichier admin.js fourni :
 * - endpoint: POST /api/owner/movies
 * - payload: { title, durationMin, language, subtitles, director, mainActors[], minAge, programming: {...} }
 * - auth: Authorization: Bearer <token>
 */

const ownerToken = ref(getOwnerToken());
const tokenInput = ref(ownerToken.value);

const loginState = computed(() => (ownerToken.value ? "Connecté ✅" : "Non connecté"));

function saveToken() {
  ownerToken.value = tokenInput.value.trim();
  setOwnerToken(ownerToken.value);
}

function logoutOwner() {
  clearOwnerToken();
  ownerToken.value = "";
  tokenInput.value = "";
}

const publishing = ref(false);
const status = ref("");

const form = ref({
  title: "",
  durationMin: 90,
  language: "FR",
  subtitles: "",
  director: "",
  minAge: 0,
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
    title: form.value.title,
    durationMin: Number(form.value.durationMin),
    language: form.value.language,
    subtitles: form.value.subtitles || null,
    director: form.value.director,
    mainActors: String(mainActorsRaw.value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    minAge: Number(form.value.minAge),
    programming: {
      city: form.value.city,
      address: form.value.address,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      days: form.value.days, // côté back : 3 jours / semaine attendu
      startTime: form.value.startTime,
    },
  };
}

async function publish() {
  status.value = "";

  if (!ownerToken.value) {
    status.value = "⚠️ Connecte-toi avec un token d’abord.";
    return;
  }

  const payload = buildPayload();

  if (!payload.programming.days.length) {
    status.value = "⚠️ Choisis au moins 1 jour (idéalement 3 jours / semaine).";
    return;
  }

  publishing.value = true;
  try {
    const created = await apiFetch("/api/owner/movies", {
      method: "POST",
      token: ownerToken.value,
      body: payload,
    });

    const id = created?.id ?? "(retour API sans id)";
    status.value = `Publié ! ID film: ${id}`;

    // reset form (comme movieForm.reset())
    form.value = {
      title: "",
      durationMin: 90,
      language: "FR",
      subtitles: "",
      director: "",
      minAge: 0,
      city: "Paris",
      address: "",
      startDate: "",
      endDate: "",
      days: [],
      startTime: "18:00",
    };
    mainActorsRaw.value = "";
  } catch (e) {
    status.value = `Erreur: ${e?.message || "Erreur"}`;
  } finally {
    publishing.value = false;
  }
}
</script>
