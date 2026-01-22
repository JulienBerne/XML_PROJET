import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import MovieDetail from "../views/MovieDetail.vue";
import Admin from "../views/Admin.vue";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import RequestAdmin from "../views/RequestAdmin.vue";
import SuperAdminRequests from "../views/SuperAdminRequests.vue";
import { getRole, isUserLoggedIn } from "../services/userAuth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: Home },
    { path: "/movie/:id", name: "movie", component: MovieDetail },

    { path: "/login", name: "login", component: Login },
    { path: "/register", name: "register", component: Register },

    { path: "/request-admin", name: "request-admin", component: RequestAdmin, meta: { requiresAuth: true } },

    { path: "/admin", name: "admin", component: Admin, meta: { requiresAuth: true, roles: ["ADMIN", "SUPER_ADMIN"] } },
    { path: "/superadmin/requests", name: "superadmin-requests", component: SuperAdminRequests, meta: { requiresAuth: true, roles: ["SUPER_ADMIN"] } },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  if (to.meta?.requiresAuth && !isUserLoggedIn()) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.meta?.roles) {
    const role = getRole();
    if (!to.meta.roles.includes(role)) {
      return { name: "home" };
    }
  }
});

export default router;
