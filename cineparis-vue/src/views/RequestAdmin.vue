<template>
  <main class="container section">
    <div class="panel" style="max-width:720px;margin:0 auto;">
      <div class="panel__head">
        <h1>Demande pour devenir propriétaire</h1>
        <p class="muted">
          En tant qu’utilisateur, tu peux demander à passer en rôle <b>ADMIN</b> (propriétaire de cinéma).
          Un <b>SUPER_ADMIN</b> validera ou refusera ta demande.
        </p>
      </div>

      <div v-if="!logged" class="empty">
        <h3>Connexion requise</h3>
        <p>Connecte-toi pour envoyer une demande.</p>
        <RouterLink class="btn btn--primary" to="/login">Se connecter</RouterLink>
      </div>

      <template v-else>
        <div class="field">
          <label class="label">Message (optionnel)</label>
          <textarea class="input" v-model="message" rows="4" placeholder="Explique brièvement ta demande..."></textarea>
        </div>

        <button class="btn btn--primary" @click="send" :disabled="loading">
          {{ loading ? "Envoi..." : "Envoyer la demande" }}
        </button>

        <p class="muted" style="margin-top:10px;">{{ status }}</p>

        <hr class="sep" />

        <h2>Mes demandes</h2>
        <div v-if="myRequests.length === 0" class="muted">Aucune demande.</div>

        <div v-else class="panel" v-for="r in myRequests" :key="r.id" style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div><b>#{{ r.id }}</b> — {{ r.status }}</div>
            <div class="muted">{{ formatDate(r.createdAt) }}</div>
          </div>
          <div class="muted" v-if="r.message" style="margin-top:6px;">{{ r.message }}</div>
        </div>
      </template>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { getUserToken, isUserLoggedIn } from "../services/userAuth";
import { apiFetch } from "../services/api";

const logged = computed(() => isUserLoggedIn());
const message = ref("");
const loading = ref(false);
const status = ref("");
const myRequests = ref([]);

function formatDate(s) {
  if (!s) return "";
  try { return new Date(s).toLocaleString(); } catch { return s; }
}

async function loadMine() {
  if (!logged.value) return;
  try {
    myRequests.value = await apiFetch("/api/requests/me", { token: getUserToken() });
  } catch {}
}

async function send() {
  status.value = "";
  loading.value = true;
  try {
    await apiFetch("/api/requests/admin", {
      method: "POST",
      token: getUserToken(),
      body: { message: message.value || null },
    });
    status.value = "✅ Demande envoyée.";
    message.value = "";
    await loadMine();
  } catch (e) {
    status.value = `❌ ${e?.message || "Erreur"}`;
  } finally {
    loading.value = false;
  }
}

onMounted(loadMine);
</script>
