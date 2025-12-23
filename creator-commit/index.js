const { cosmosContainer } = require("../shared/shared");

module.exports = async function (context, req) {
  const creatorKey = req.headers["x-creator-key"];
  if (!creatorKey || creatorKey !== process.env.CREATOR_KEY) {
    context.res = { status: 401, body: "Unauthorized" };
    return;
  }

  const b = req.body || {};
  if (!b.mediaId || !b.blobName) {
    context.res = { status: 400, body: "mediaId and blobName required" };
    return;
  }

  const item = {
    id: b.mediaId,
    pk: "media",
    mediaId: b.mediaId,
    title: b.title || "",
    caption: b.caption || "",
    location: b.location || "",
    people: Array.isArray(b.people) ? b.people : [],
    blobName: b.blobName,
    createdAt: new Date().toISOString(),
    avgRating: 0,
    ratingCount: 0,
    comments: [],
    ratings: {}
  };

  await cosmosContainer().items.upsert(item);

  context.res = {
    headers: { "Content-Type": "application/json" },
    body: { ok: true, mediaId: b.mediaId }
  };
};
