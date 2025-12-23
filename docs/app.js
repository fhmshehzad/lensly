let page = 0;
const limit = 9;

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const qEl = document.getElementById("q");

async function api(path, opts) {
  const res = await fetch(window.API_BASE + path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function setStatus(msg) {
  statusEl.textContent = msg || "";
}

function cardHTML(m) {
  const title = (m.title || "Untitled").trim() || "Untitled";
  const loc = (m.location || "").trim();
  const caption = (m.caption || "").trim();
  const stars = `⭐ ${Number(m.avgRating || 0).toFixed(1)} (${m.ratingCount || 0})`;

  return `
    <div class="card" data-id="${m.mediaId}">
      <img src="${m.imageUrl}" alt="${title}">
      <div class="meta">
        <div class="titleRow">
          <div class="title">${escapeHtml(title)}</div>
          <div class="badge">${stars}</div>
        </div>
        <div class="small muted">${escapeHtml(loc)}</div>
        <div class="lineClamp2">${escapeHtml(caption)}</div>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wireCardClicks() {
  document.querySelectorAll(".card").forEach(card => {
    card.onclick = () => {
      const id = card.getAttribute("data-id");
      window.location.href = `post.html?id=${encodeURIComponent(id)}`;
    };
  });
}

async function load(reset = false) {
  try {
    if (reset) {
      page = 0;
      grid.innerHTML = "";
    }

    setStatus("Loading...");
    const q = (qEl.value || "").trim();
    const data = await api(`/media?limit=${limit}&page=${page}&q=${encodeURIComponent(q)}`);
    const items = data.items || [];

    if (items.length === 0 && page === 0) {
      grid.innerHTML = `<div class="notice bad">No posts found. Upload one from <a class="link" href="creator.html">Creator Upload</a>.</div>`;
      setStatus("");
      return;
    }

    grid.insertAdjacentHTML("beforeend", items.map(cardHTML).join(""));
    wireCardClicks();
    setStatus(items.length < limit ? "No more posts." : "");
    page++;
  } catch (e) {
    grid.innerHTML = `<div class="notice bad">API error: ${escapeHtml(e)}</div>`;
    setStatus("");
  }
}

document.getElementById("searchBtn").onclick = () => load(true);
document.getElementById("moreBtn").onclick = () => load(false);
qEl.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") load(true);
});

load(true);
