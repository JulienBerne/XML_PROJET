<template>
  <main class="container section">
    <div class="panel">
      <div class="panel__head">
        <h1>Demandes propriétaires (SUPER_ADMIN)</h1>
        <p class="muted">Valider / refuser les demandes USER → ADMIN.</p>
      </div>

      <div class="filters" style="margin-bottom:12px;">
        <div>
          <label class="label">Filtre status</label>
          <select class="select" v-model="statusFilter" @change="load">
            <option value="PENDING">PENDING</option>
            <option value="">Tous</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>

        <button class="btn" @click="load" :disabled="loading">{{ loading ? "Chargement..." : "Rafraîchir" }}</button>
      </div>

      <div v-if="error" class="empty">
        <h3>Erreur</h3>
        <p class="muted">{{ error }}</p>
      </div>

      <div v-else>
        <div v-if="requests.length === 0" class="muted">Aucune demande.</div>

        <div v-for="r in requests" :key="r.id" class="panel" style="margin:10px 0;">
          <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
            <div>
              <b>#{{ r.id }}</b> — <b>{{ r.status }}</b> —
              {{ r.email }} <span class="muted">({{ r.firstname || "" }} {{ r.lastname || "" }})</span>
            </div>
            <div class="muted">{{ formatDate(r.createdAt) }}</div>
          </div>

          <div class="muted" v-if="r.message" style="margin-top:6px;">{{ r.message }}</div>

          <div style="display:flex;gap:10px;margin-top:10px;" v-if="r.status === 'PENDING'">
            <button class="btn btn--primary" @click="approve(r.id)" :disabled="actionLoading">Approuver</button>
            <button class="btn" @click="reject(r.id)" :disabled="actionLoading">Refuser</button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { apiFetch } from "../services/api";
import { getUserToken } from "../services/userAuth";

const statusFilter = ref("PENDING");
const requests = ref([]);
const loading = ref(false);
const actionLoading = ref(false);
const error = ref("");

function formatDate(s) {
  if (!s) return "";
  try { return new Date(s).toLocaleString(); } catch { return s; }
}

async function load() {
  error.value = "";
  loading.value = true;
  try {
    const qs = statusFilter.value ? `?status=${encodeURIComponent(statusFilter.value)}` : "";
    requests.value = await apiFetch(`/api/superadmin/requests${qs}`, { token: getUserToken() });
  } catch (e) {
    error.value = e?.message || "Erreur";
    requests.value = [];
  } finally {
    loading.value = false;
  }
}

async function approve(id) {
  actionLoading.value = true;
  try {
    await apiFetch(`/api/superadmin/requests/${id}/approve`, { method: "POST", token: getUserToken() });
    await load();
  } finally {
    actionLoading.value = false;
  }
}

async function reject(id) {
  actionLoading.value = true;
  try {
    await apiFetch(`/api/superadmin/requests/${id}/reject`, { method: "POST", token: getUserToken() });
    await load();
  } finally {
    actionLoading.value = false;
  }
}

onMounted(load);
</script>
