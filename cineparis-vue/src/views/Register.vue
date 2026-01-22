<template>
  <main class="container section">
    <div class="panel" style="max-width:520px;margin:0 auto;">
      <div class="panel__head">
        <h1>Inscription</h1>
        <p class="muted">Crée ton compte pour réserver.</p>
      </div>

      <form class="form" @submit.prevent="submit">
        <div class="grid2">
          <div class="field">
            <label class="label">Prénom</label>
            <input class="input" v-model="firstname" required />
          </div>
          <div class="field">
            <label class="label">Nom</label>
            <input class="input" v-model="lastname" required />
          </div>
        </div>

        <div class="field">
          <label class="label">Email</label>
          <input class="input" v-model="email" type="email" required placeholder="ex: user@mail.com" />
        </div>

        <div class="field">
          <label class="label">Mot de passe</label>
          <input class="input" v-model="password" type="password" required minlength="6" />
          <p class="muted" style="margin-top:6px;">Min 6 caractères.</p>
        </div>

        <div class="field">
          <label class="label">Confirmer le mot de passe</label>
          <input class="input" v-model="password2" type="password" required minlength="6" />
        </div>

        <p v-if="error" class="muted" style="color:#b00020;">{{ error }}</p>
        <p v-if="success" class="muted" style="color:#0a7a2f;">{{ success }}</p>

        <button class="btn btn--primary" type="submit" :disabled="loading">
          {{ loading ? "Inscription..." : "S'inscrire" }}
        </button>

        <p class="muted" style="margin-top:10px;">
          Déjà un compte ?
          <RouterLink to="/login">Se connecter</RouterLink>
        </p>
      </form>
    </div>
  </main>
</template>

<script setup>
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { registerUser } from "../services/userAuth";

const router = useRouter();

const firstname = ref("");
const lastname = ref("");
const email = ref("");
const password = ref("");
const password2 = ref("");

const loading = ref(false);
const error = ref("");
const success = ref("");

async function submit() {
  error.value = "";
  success.value = "";

  if (password.value !== password2.value) {
    error.value = "Les mots de passe ne correspondent pas.";
    return;
  }

  loading.value = true;
  try {
    await registerUser({
      email: email.value,
      password: password.value,
      firstname: firstname.value,
      lastname: lastname.value,
    });

    success.value = "Compte créé ✅ Redirection vers la connexion...";
    setTimeout(() => router.push("/login"), 600);
  } catch (e) {
    error.value = e?.message || "Erreur";
  } finally {
    loading.value = false;
  }
}
</script>
