import { ref } from "vue";
import { getCurrentUser, getUserToken, logoutUser } from "./userAuth";

// état réactif global
export const authState = ref({
    logged: !!getUserToken(),
    user: getCurrentUser(),
});

export function refreshAuth() {
    authState.value = {
    logged: !!getUserToken(),
    user: getCurrentUser(),
    };
}

export function doLogout() {
    logoutUser();
    refreshAuth();
}
