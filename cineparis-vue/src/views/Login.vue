<template>
    <main class="container section">
    <div class="panel" style="max-width:520px;margin:0 auto;">
        <div class="panel__head">
        <h1>Connexion</h1>
        <p class="muted">Connecte-toi pour réserver et accéder à ton compte.</p>
        </div>

        <form class="form" @submit.prevent="submit">
        <div class="field">
            <label class="label">Email</label>
            <input class="input" v-model="email" type="email" required placeholder="ex: user@mail.com" />
        </div>

        <div class="field">
            <label class="label">Mot de passe</label>
            <input class="input" v-model="password" type="password" required placeholder="••••••••" />
        </div>

        <p v-if="error" class="muted" style="color:#b00020;">{{ error }}</p>

        <button class="btn btn--primary" type="submit" :disabled="loading">
            {{ loading ? "Connexion..." : "Se connecter" }}
        </button>

        <p class="muted" style="margin-top:10px;">
            Pas de compte ?
            <RouterLink to="/register">Créer un compte</RouterLink>
        </p>
        </form>
    </div>
    </main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, useRoute, RouterLink } from "vue-router";
import { loginUser } from "../services/userAuth";

const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function submit() {
    loading.value = true;
    error.value = "";
    try {
    await loginUser(email.value, password.value);
    const redirect = route.query.redirect?.toString() || "/";
    router.push(redirect);
    } catch (e) {
    error.value = e?.message || "Erreur";
    } finally {
    loading.value = false;
    }
}
</script>
