const msg = document.getElementById("msg");
const out = document.getElementById("out");
const fileEl = document.getElementById("file");
const preview = document.getElementById("preview");

function setMsg(t){ msg.textContent = t || ""; }
function setOut(obj){ out.textContent = obj ? JSON.stringify(obj, null, 2) : ""; }

async function api(path, opts){
  const res = await fetch(window.API_BASE + path, opts);
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

fileEl.onchange = () => {
  const f = fileEl.files[0];
  if(!f){ preview.removeAttribute("src"); return; }
  preview.src = URL.createObjectURL(f);
};

document.getElementById("uploadBtn").onclick = async () => {
  try{
    setMsg("");
    setOut(null);

    const creatorKey = document.getElementById("ckey").value.trim();
    const file = fileEl.files[0];
    if(!creatorKey) throw new Error("Enter Creator Key");
    if(!file) throw new Error("Choose an image file");

    setMsg("1/3 Requesting SAS upload URL...");
    const init = await api("/creator/init", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-creator-key": creatorKey
      },
      body: JSON.stringify({ fileName: file.name })
    });

    setMsg("2/3 Uploading image to Blob Storage...");
    const put = await fetch(init.uploadUrl, {
      method:"PUT",
      headers:{
        "x-ms-blob-type":"BlockBlob",
        "Content-Type": file.type || "application/octet-stream"
      },
      body: file
    });
    if(!put.ok) throw new Error("Blob upload failed (check Blob CORS settings)");

    setMsg("3/3 Saving metadata to Cosmos DB...");
    const people = document.getElementById("people").value
      .split(",").map(s=>s.trim()).filter(Boolean);

    const commit = await api("/creator/commit", {
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "x-creator-key": creatorKey
      },
      body: JSON.stringify({
        mediaId: init.mediaId,
        blobName: init.blobName,
        title: document.getElementById("title").value,
        caption: document.getElementById("caption").value,
        location: document.getElementById("location").value,
        people
      })
    });

    setMsg("✅ Done! Go back Home and refresh to see the new post.");
    setOut({ init, commit });
  }catch(e){
    setMsg("❌ " + e);
  }
};
