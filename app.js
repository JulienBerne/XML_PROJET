const API_BASE = "http://localhost:8080"; // <-- change selon ton back

const els = {
  q: document.getElementById("q"),
  city: document.getElementById("city"),
  day: document.getElementById("day"),
  grid: document.getElementById("grid"),
  empty: document.getElementById("empty"),
  countPill: document.getElementById("countPill"),
  year: document.getElementById("year"),
  resultsTitle: document.getElementById("resultsTitle"),
};

els.year.textContent = new Date().getFullYear();

function escapeHtml(s=""){
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

function normalize(s=""){ return s.toLowerCase().trim(); }

async function fetchMoviesByCity(city){
  // Service 2: "afficher tous les films dans une ville donnée"
  // Exemple endpoint attendu : GET /api/cities/{city}/movies
  const res = await fetch(`${API_BASE}/api/cities/${encodeURIComponent(city)}/movies`);
  if(!res.ok) throw new Error("Erreur API (liste films)");
  return await res.json();
}

function card(movie){
  // movie attendu (exemple): { id, title, durationMin, minAge, language, sessions:[{day,startTime,cinemaName,address}] }
  const times = (movie.sessions || []).slice(0,6).map(s => `<span class="time">${escapeHtml(s.startTime || "--:--")}</span>`).join("");
  const dayTag = (movie.sessions?.[0]?.day) ? movie.sessions[0].day : "Séances";

  return `
    <a class="card" href="movie.html?id=${encodeURIComponent(movie.id)}">
      <div class="poster">
        <span class="poster__tag">${escapeHtml(dayTag)}</span>
      </div>
      <div class="card__body">
        <h3 class="card__title">${escapeHtml(movie.title)}</h3>
        <div class="card__meta">
          <span>${escapeHtml(String(movie.durationMin ?? "—"))} min</span>
          <span>Âge: ${escapeHtml(String(movie.minAge ?? "—"))}+</span>
          <span>${escapeHtml(movie.language ?? "")}</span>
        </div>
        <div class="times">${times}</div>
      </div>
    </a>
  `;
}

function applyFilters(movies){
  const q = normalize(els.q.value);
  const day = els.day.value;

  return movies.filter(m => {
    const hay = normalize([m.title, m.director, (m.mainActors||[]).join(",")].filter(Boolean).join(" "));
    const okQ = !q || hay.includes(q);
    const okDay = !day || (m.sessions || []).some(s => s.day === day);
    return okQ && okDay;
  });
}

async function render(){
  els.grid.innerHTML = "";
  els.empty.classList.add("hidden");

  const city = els.city.value;
  els.resultsTitle.textContent = `À l’affiche – ${city}`;

  try{
    const movies = await fetchMoviesByCity(city);
    const filtered = applyFilters(movies);

    els.countPill.textContent = `${filtered.length} film${filtered.length > 1 ? "s" : ""}`;

    if(filtered.length === 0){
      els.empty.classList.remove("hidden");
      return;
    }
    els.grid.innerHTML = filtered.map(card).join("");
  }catch(e){
    els.countPill.textContent = "Erreur";
    els.empty.classList.remove("hidden");
    els.empty.innerHTML = `<h3>Impossible de charger</h3><p class="muted">${escapeHtml(e.message)}</p>`;
  }
}

["input","change"].forEach(evt => {
  els.q.addEventListener(evt, render);
  els.city.addEventListener(evt, render);
  els.day.addEventListener(evt, render);
});

render();
