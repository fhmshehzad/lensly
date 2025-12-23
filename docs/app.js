let page = 0;
const limit = 9;

async function api(path) {
  const res = await fetch("/api" + path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function render(items) {
  const grid = document.getElementById("grid");
  for (const m of items) {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <img src="${m.imageUrl}">
      <div class="meta">
        <b>${m.title || "Untitled"}</b>
        <div class="small">${m.location || ""}</div>
        <div class="small">⭐ ${Number(m.avgRating||0).toFixed(1)} (${m.ratingCount||0})</div>
      </div>`;
    grid.appendChild(div);
  }
}

async function load(reset=false) {
  if (reset) { page = 0; document.getElementById("grid").innerHTML = ""; }
  const q = document.getElementById("q").value.trim();
  const data = await api(`/media?limit=${limit}&page=${page}&q=${encodeURIComponent(q)}`);
  render(data.items);
  page++;
}

document.getElementById("search").onclick = () => load(true);
document.getElementById("more").onclick = () => load(false);
load(true);
