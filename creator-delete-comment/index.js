const { cosmosContainer } = require("../shared/shared");

module.exports = async function (context, req) {
  const creatorKey = req.headers["x-creator-key"];
  if (!creatorKey || creatorKey !== process.env.CREATOR_KEY) {
    context.res = { status: 401, body: "Unauthorized" };
    return;
  }

  const id = context.bindingData.id;
  const commentId = context.bindingData.commentId;

  const { resource } = await cosmosContainer().item(id, "media").read();
  if (!resource) { context.res = { status: 404, body: "Not found" }; return; }

  resource.comments = Array.isArray(resource.comments) ? resource.comments : [];
  const before = resource.comments.length;
  resource.comments = resource.comments.filter(c => c.commentId !== commentId);

  if (resource.comments.length === before) {
    context.res = { status: 404, body: "Comment not found" };
    return;
  }

  await cosmosContainer().items.upsert(resource);
  context.res = {
    headers: { "Content-Type": "application/json" },
    body: { ok: true, deletedCommentId: commentId }
  };
};
