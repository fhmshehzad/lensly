const { v4: uuid } = require("uuid");
const { makeUploadUrl } = require("../shared/shared");

module.exports = async function (context, req) {
  const creatorKey = req.headers["x-creator-key"];
  if (!creatorKey || creatorKey !== process.env.CREATOR_KEY) {
    context.res = { status: 401, body: "Unauthorized" };
    return;
  }

  const fileName = (req.body?.fileName || "").toString();
  const ext = fileName.includes(".") ? "." + fileName.split(".").pop() : "";

  const mediaId = uuid();
  const blobName = `${mediaId}${ext}`;

  const uploadUrl = makeUploadUrl(blobName);

  context.res = {
    headers: { "Content-Type": "application/json" },
    body: { mediaId, blobName, uploadUrl }
  };
};
