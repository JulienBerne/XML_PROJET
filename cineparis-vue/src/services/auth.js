const TOKEN_KEY = "cineparis_owner_token";

export function getOwnerToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}
export function setOwnerToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearOwnerToken() {
  localStorage.removeItem(TOKEN_KEY);
}
export function isOwnerLoggedIn() {
  return !!getOwnerToken();
}
