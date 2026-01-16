const API_BASE = "http://localhost:8080";

function qs(name){
  return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(s=""){
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

async function fetchMovieDetails(id){
  // Service 3 : chaque film renvoyé doit pointer vers un service détail
  // Exemple endpoint : GET /api/movies/{id}
  const res = await fetch(`${API_BASE}/api/movies/${encodeURIComponent(id)}`);
  if(!res.ok) throw new Error("Erreur API (détail film)");
  return await res.json();
}

function renderMovie(m){
  const actors = (m.mainActors || []).join(", ");
  return `
    <div class="movie__poster"></div>
    <div class="panel">
      <h1 style="margin:0 0 6px;">${escapeHtml(m.title)}</h1>
      <div class="muted" style="display:flex;gap:10px;flex-wrap:wrap;">
        <span>${escapeHtml(String(m.durationMin ?? "—"))} min</span>
        <span>Âge min: ${escapeHtml(String(m.minAge ?? "—"))}+</span>
        <span>Langue: ${escapeHtml(m.language ?? "—")}${m.subtitles ? ` (ST ${escapeHtml(m.subtitles)})` : ""}</span>
      </div>
      <hr class="sep" />
      <p class="muted" style="margin:0 0 10px;">
        <strong>Réalisateur :</strong> ${escapeHtml(m.director ?? "—")}
        <br/>
        <strong>Acteurs :</strong> ${escapeHtml(actors || "—")}
      </p>
    </div>
  `;
}

function renderSessions(sessions){
  if(!sessions || sessions.length === 0){
    return `<div class="empty"><h3>Aucune séance</h3><p>Ce film n’a pas de programmation pour le moment.</p></div>`;
  }

  const grouped = sessions.reduce((acc, s) => {
    const key = `${s.city || ""} • ${s.cinemaName || "Cinéma"} • ${s.address || ""}`.trim();
    acc[key] = acc[key] || [];
    acc[key].push(s);
    return acc;
  }, {});

  return Object.entries(grouped).map(([place, list]) => {
    const times = list.map(x => `<span class="time">${escapeHtml(x.day || "")} ${escapeHtml(x.startTime || "")}</span>`).join("");
    return `
      <div class="panel" style="margin:10px 0;">
        <div style="font-weight:800;margin-bottom:8px;">${escapeHtml(place)}</div>
        <div class="sessions">${times}</div>
      </div>
    `;
  }).join("");
}

(async function main(){
  const id = qs("id");
  const movieEl = document.getElementById("movie");
  const sessionsEl = document.getElementById("sessions");
  const hintEl = document.getElementById("sessionsHint");

  if(!id){
    movieEl.innerHTML = `<div class="empty"><h3>ID manquant</h3><p>Ouvre ce film depuis la liste.</p></div>`;
    return;
  }

  try{
    const m = await fetchMovieDetails(id);
    movieEl.innerHTML = renderMovie(m);

    hintEl.textContent = `${(m.sessions || []).length} séance(s)`;
    sessionsEl.innerHTML = renderSessions(m.sessions || []);
  }catch(e){
    movieEl.innerHTML = `<div class="empty"><h3>Erreur</h3><p class="muted">${escapeHtml(e.message)}</p></div>`;
  }
})();
