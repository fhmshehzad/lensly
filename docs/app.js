let page = 0;
const limit = 9;

let currentType = "all";
let currentSort = "new";

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const qEl = document.getElementById("q");

async function api(path, opts) {
  const res = await fetch(window.API_BASE + path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function esc(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(msg) { statusEl.textContent = msg || ""; }

function imageCard(m) {
  const title = (m.title || "Untitled").trim() || "Untitled";
  const stars = ` ${Number(m.avgRating || 0).toFixed(1)} (${m.ratingCount || 0})`;
  return `
    <div class="card" data-id="${m.mediaId}">
      <img src="${m.imageUrl}" alt="${esc(title)}">
      <div class="meta">
        <div class="titleRow">
          <div class="title">${esc(title)}</div>
          <div class="badge">${stars}</div>
        </div>
        <div class="small muted">${esc(m.location || "")}</div>
        <div class="lineClamp2">${esc(m.caption || "")}</div>
      </div>
    </div>
  `;
}

function textCard(m) {
  const title = (m.title || "Text Post").trim() || "Text Post";
  const stars = ` ${Number(m.avgRating || 0).toFixed(1)} (${m.ratingCount || 0})`;
  return `
    <div class="card" data-id="${m.mediaId}">
      <div class="textCard">
        <div>
          <div class="titleRow">
            <div class="title">${esc(title)}</div>
            <div class="badge">${stars}</div>
          </div>
          <div class="small muted">${esc(m.location || "")}</div>
          <div class="textBody">${esc(m.textBody || m.caption || "")}</div>
        </div>
        <div class="small muted">Tap to open</div>
      </div>
    </div>
  `;
}

function wireCardClicks() {
  document.querySelectorAll(".card").forEach(card => {
    card.onclick = () => {
      const id = card.getAttribute("data-id");
      location.href = `post.html?id=${encodeURIComponent(id)}`;
    };
  });
}

function setActiveChip(type, sort) {
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  const match = [...document.querySelectorAll(".chip")]
    .find(c => c.dataset.type === type && c.dataset.sort === sort);
  if (match) match.classList.add("active");
}

async function load(reset=false) {
  try {
    if (reset) {
      page = 0;
      grid.innerHTML = "";
    }

    setStatus("Loading...");
    const q = (qEl.value || "").trim();

    const data = await api(`/media?limit=${limit}&page=${page}&q=${encodeURIComponent(q)}&type=${encodeURIComponent(currentType)}&sort=${encodeURIComponent(currentSort)}`);
    const items = data.items || [];

    if (items.length === 0 && page === 0) {
      grid.innerHTML = `<div class="notice bad">No posts yet. Go to <a href="creator.html">Creator</a> and add an image or text post.</div>`;
      setStatus("");
      return;
    }

    const html = items.map(m => (m.postType === "text" ? textCard(m) : imageCard(m))).join("");
    grid.insertAdjacentHTML("beforeend", html);
    wireCardClicks();

    setStatus(items.length < limit ? "No more posts." : "");
    page++;
  } catch (e) {
    grid.innerHTML = `<div class="notice bad">API error: ${esc(e)}</div>`;
    setStatus("");
  }
}

document.getElementById("searchBtn").onclick = () => load(true);
document.getElementById("moreBtn").onclick = () => load(false);

qEl.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") load(true);
});

document.getElementById("chips").onclick = (ev) => {
  const chip = ev.target.closest(".chip");
  if (!chip) return;
  currentType = chip.dataset.type;
  currentSort = chip.dataset.sort;
  setActiveChip(currentType, currentSort);
  load(true);
};

load(true);
