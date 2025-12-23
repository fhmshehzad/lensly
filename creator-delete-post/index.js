const { cosmosContainer, deleteBlobIfExists } = require("../shared/shared");

module.exports = async function (context, req) {
  const creatorKey = req.headers["x-creator-key"];
  if (!creatorKey || creatorKey !== process.env.CREATOR_KEY) {
    context.res = { status: 401, body: "Unauthorized" };
    return;
  }

  const id = context.bindingData.id;

  const { resource } = await cosmosContainer().item(id, "media").read();
  if (!resource) {
    context.res = { status: 404, body: "Not found" };
    return;
  }

  // Delete blob if image post
  if ((resource.postType || "image") === "image" && resource.blobName) {
    await deleteBlobIfExists(resource.blobName);
  }

  // Delete cosmos item
  await cosmosContainer().item(id, "media").delete();

  context.res = {
    headers: { "Content-Type": "application/json" },
    body: { ok: true, deleted: id }
  };
};
