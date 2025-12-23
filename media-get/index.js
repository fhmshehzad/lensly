const { cosmosContainer, makeReadUrl } = require("../shared/shared");

module.exports = async function (context, req) {
  const id = context.bindingData.id;

  const { resource } = await cosmosContainer().item(id, "media").read();
  if (!resource) {
    context.res = { status: 404, body: "Not found" };
    return;
  }

  const imageUrl = (resource.postType === "image" && resource.blobName)
    ? makeReadUrl(resource.blobName)
    : null;

  context.res = {
    headers: { "Content-Type": "application/json" },
    body: { ...resource, imageUrl }
  };
};
