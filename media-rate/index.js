const { cosmosContainer } = require("../shared/shared");

module.exports = async function (context, req) {
  const id = context.bindingData.id;
  const rating = Number(req.body?.rating);

  if (!(rating >= 1 && rating <= 5)) {
    context.res = { status: 400, body: "rating must be 1..5" };
    return;
  }

  const { resource } = await cosmosContainer().item(id, "media").read();
  if (!resource) { context.res = { status: 404, body: "Not found" }; return; }

  resource.ratings = resource.ratings || {};
  resource.ratings["anon"] = rating;

  const vals = Object.values(resource.ratings).map(Number);
  resource.ratingCount = vals.length;
  resource.avgRating = vals.reduce((a,b)=>a+b,0) / vals.length;

  await cosmosContainer().items.upsert(resource);

  context.res = {
    headers: { "Content-Type": "application/json" },
    body: { ok: true, avgRating: resource.avgRating, ratingCount: resource.ratingCount }
  };
};
