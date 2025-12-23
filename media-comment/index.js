const { cosmosContainer } = require("../shared/shared");

module.exports = async function (context, req) {
  const id = context.bindingData.id;
  const text = (req.body?.text || "").trim();
  if (!text) { context.res = { status: 400, body: "text required" }; return; }

  const { resource } = await cosmosContainer().item(id, "media").read();
  if (!resource) { context.res = { status: 404, body: "Not found" }; return; }

  resource.comments = Array.isArray(resource.comments) ? resource.comments : [];
  resource.comments.unshift({ text, createdAt: new Date().toISOString() });
  resource.comments = resource.comments.slice(0, 50);

  await cosmosContainer().items.upsert(resource);
  context.res = { headers: { "Content-Type": "application/json" }, body: { ok: true } };
};
