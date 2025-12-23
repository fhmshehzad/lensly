const msg = document.getElementById("msg");
const out = document.getElementById("out");
const fileEl = document.getElementById("file");
const preview = document.getElementById("preview");

const imageBox = document.getElementById("imageBox");
const textBox = document.getElementById("textBox");
const btnImage = document.getElementById("btnImage");
const btnText = document.getElementById("btnText");

let mode = "image"; // "image" or "text"

function setMsg(t){ msg.textContent = t || ""; }
function setOut(obj){ out.textContent = obj ? JSON.stringify(obj, null, 2) : ""; }

async function api(path, opts){
  const res = await fetch(window.API_BASE + path, opts);
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

function creatorKey(){
  return document.getElementById("ckey").value.trim();
}

function peopleArray(){
  return document.getElementById("people").value.split(",").map(s=>s.trim()).filter(Boolean);
}

fileEl.onchange = () => {
  const f = fileEl.files[0];
  if(!f){ preview.removeAttribute("src"); return; }
  preview.src = URL.createObjectURL(f);
};

function setMode(m){
  mode = m;
  if (mode === "image") {
    imageBox.style.display = "";
    textBox.style.display = "none";
  } else {
    imageBox.style.display = "none";
    textBox.style.display = "";
  }
  setMsg("");
  setOut(null);
}

btnImage.onclick = () => setMode("image");
btnText.onclick = () => setMode("text");

document.getElementById("uploadBtn").onclick = async () => {
  try{
    setMsg("");
    setOut(null);

    const key = creatorKey();
    if(!key) throw new Error("Enter Creator Key");

    const title = document.getElementById("title").value;
    const caption = document.getElementById("caption").value;
    const location = document.getElementById("location").value;
    const people = peopleArray();

    if (mode === "image") {
      const file = fileEl.files[0];
      if(!file) throw new Error("Choose an image file");

      setMsg("1/3 Requesting SAS upload URL...");
      const init = await api("/creator/init", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-creator-key": key },
        body: JSON.stringify({ fileName: file.name })
      });

      setMsg("2/3 Uploading to Blob Storage...");
      const put = await fetch(init.uploadUrl, {
        method:"PUT",
        headers:{ "x-ms-blob-type":"BlockBlob", "Content-Type": file.type || "application/octet-stream" },
        body: file
      });
      if(!put.ok) throw new Error("Blob upload failed (check Blob CORS)");

      setMsg("3/3 Saving metadata to Cosmos...");
      const commit = await api("/creator/commit", {
        method:"POST",
        headers:{ "Content-Type":"application/json", "x-creator-key": key },
        body: JSON.stringify({
          postType:"image",
          mediaId: init.mediaId,
          blobName: init.blobName,
          title, caption, location, people
        })
      });

      setMsg("✅ Image post published. Go Home and refresh.");
      setOut({ init, commit });
      return;
    }

    // TEXT MODE
    const textBody = document.getElementById("textBody").value.trim();
    if(!textBody) throw new Error("Write text body first");

    // Make a mediaId client-side (simple unique-ish). Backend stores it.
    const mediaId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    setMsg("Publishing text post...");
    const commit = await api("/creator/commit", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "x-creator-key": key },
      body: JSON.stringify({
        postType:"text",
        mediaId,
        textBody,
        title, caption, location, people
      })
    });

    setMsg("✅ Text post published. Go Home and refresh.");
    setOut({ commit });

  }catch(e){
    setMsg("❌ " + e);
  }
};
