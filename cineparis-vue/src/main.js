import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";

import { refreshAuth } from "./services/authStore";

//  Pour que le state auth soit correct au lancement
refreshAuth();

createApp(App).use(router).mount("#app");