const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function apiFetch(path, { token, method = "GET", body, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `Erreur API (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.message || data?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}
