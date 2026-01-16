<template>
  <header class="topbar">
    <div class="container topbar__inner">
      <RouterLink class="brand" to="/">
        <span class="brand__dot"></span>
        <span class="brand__name">CinéParis</span>
      </RouterLink>

      <nav class="nav">
        <RouterLink to="/" class="nav__link" :class="{ 'nav__link--active': $route.name === 'home' }">À l’affiche</RouterLink>
        <RouterLink to="/admin" class="nav__link" :class="{ 'nav__link--active': $route.name === 'admin' }">Espace Pro</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>
