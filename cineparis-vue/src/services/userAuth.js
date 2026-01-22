import { refreshAuth } from "./authStore";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const TOKEN_KEY = "cineparis_user_token";
const USER_KEY = "cineparis_user";

// --- Token helpers ---
export function getUserToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function setUserToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearUserToken() {
  localStorage.removeItem(TOKEN_KEY);
}
export function isUserLoggedIn() {
  return !!getUserToken();
}

// --- User helpers ---
export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export function setCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
}
export function getRole() {
  return getCurrentUser()?.role || "USER";
}

export function logoutUser() {
  clearUserToken();
  clearCurrentUser();
  refreshAuth(); //  refresh automatique
}

// --- API calls ---
export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let msg = "Identifiants invalides";
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  const token = data.token || data.accessToken || data.jwt;
  if (!token) throw new Error("Token manquant dans la réponse serveur");

  setUserToken(token);
  if (data.user) setCurrentUser(data.user);

  refreshAuth(); //  refresh automatique
  return data;
}

export async function registerUser({ email, password, firstname, lastname }) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, firstname, lastname }),
  });

  if (!res.ok) {
    let msg = "Inscription impossible";
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await res.json().catch(() => ({}));
  const token = data.token || data.accessToken || data.jwt;
  if (token) setUserToken(token);
  if (data.user) setCurrentUser(data.user);

  refreshAuth(); //  refresh automatique
  return data;
}
