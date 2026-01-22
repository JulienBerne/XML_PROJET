<template>
  <header class="topbar">
    <div class="container topbar__inner">
      <RouterLink class="brand" to="/">
        <span class="brand__dot"></span>
        <span class="brand__name">CinéParis</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/" class="nav__link" :class="{ 'nav__link--active': $route.name === 'home' }">
          À l’affiche
        </RouterLink>

        <RouterLink v-if="logged && role === 'USER'" to="/request-admin" class="nav__link">
          Devenir propriétaire
        </RouterLink>

        <RouterLink v-if="logged && (role === 'ADMIN' || role === 'SUPER_ADMIN')" to="/admin" class="nav__link">
          Espace Pro
        </RouterLink>

        <RouterLink v-if="logged && role === 'SUPER_ADMIN'" to="/superadmin/requests" class="nav__link">
          Demandes
        </RouterLink>

        <!-- ✅ PAS CONNECTÉ -->
        <template v-if="!logged">
          <RouterLink to="/login" class="nav__link">Connexion</RouterLink>
          <RouterLink to="/register" class="nav__link">Inscription</RouterLink>
        </template>

        <!-- ✅ CONNECTÉ -->
        <button v-else class="nav__link nav__btn" @click="logout">
          Déconnexion
        </button>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<script setup>
import { computed } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import { authState, doLogout } from "./services/authStore";

const router = useRouter();

const logged = computed(() => authState.value.logged);
const role = computed(() => authState.value.user?.role || "USER");

function logout() {
  doLogout();
  router.push("/");
}
</script>

<style scoped>
.nav__btn {
  background: transparent;
  border: none;
  cursor: pointer;
}
</style>
