const { cosmosContainer } = require("../shared/shared");

module.exports = async function (context, req) {
  const creatorKey = req.headers["x-creator-key"];
  if (!creatorKey || creatorKey !== process.env.CREATOR_KEY) {
    context.res = { status: 401, body: "Unauthorized" };
    return;
  }

  const b = req.body || {};
  const postType = (b.postType || "image").toLowerCase();

  if (!b.mediaId) {
    context.res = { status: 400, body: "mediaId required" };
    return;
  }

  // For image posts, we require blobName. For text posts, require textBody.
  if (postType === "image" && !b.blobName) {
    context.res = { status: 400, body: "blobName required for image posts" };
    return;
  }
  if (postType === "text" && !String(b.textBody || "").trim()) {
    context.res = { status: 400, body: "textBody required for text posts" };
    return;
  }

  const item = {
    id: b.mediaId,
    pk: "media",
    mediaId: b.mediaId,
    postType, // "image" or "text"
    title: b.title || "",
    caption: b.caption || "",
    location: b.location || "",
    people: Array.isArray(b.people) ? b.people : [],
    blobName: postType === "image" ? b.blobName : null,
    textBody: postType === "text" ? String(b.textBody || "") : null,
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
