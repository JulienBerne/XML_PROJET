import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import MovieDetail from "../views/MovieDetail.vue";
import Admin from "../views/Admin.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: Home },
    { path: "/movie/:id", name: "movie", component: MovieDetail },
    { path: "/admin", name: "admin", component: Admin },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});
