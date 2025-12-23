const { cosmosContainer, makeReadUrl } = require("../shared/shared");

module.exports = async function (context, req) {
  const q = (req.query.q || "").toLowerCase();
  const type = (req.query.type || "all").toLowerCase();   // all | image | text
  const sort = (req.query.sort || "new").toLowerCase();   // new | top

  const page = Number(req.query.page || 0);
  const limit = Math.min(Number(req.query.limit || 9), 30);
  const offset = page * limit;

  const filters = [`c.pk="media"`];

  if (type === "image") filters.push(`c.postType="image"`);
  if (type === "text")  filters.push(`c.postType="text"`);

  if (q) {
    filters.push(`(
      CONTAINS(LOWER(c.title), @q) OR
      CONTAINS(LOWER(c.caption), @q) OR
      CONTAINS(LOWER(c.location), @q) OR
      CONTAINS(LOWER(c.textBody), @q) OR
      ARRAY_CONTAINS(c.people, @qp, true)
    )`);
  }

  const orderBy = sort === "top"
    ? `ORDER BY c.avgRating DESC, c.ratingCount DESC, c.createdAt DESC`
    : `ORDER BY c.createdAt DESC`;

  const query = {
    query: `SELECT * FROM c WHERE ${filters.join(" AND ")} ${orderBy} OFFSET @o LIMIT @l`,
    parameters: [
      { name: "@q", value: q },
      { name: "@qp", value: q },
      { name: "@o", value: offset },
      { name: "@l", value: limit }
    ]
  };

  const { resources } = await cosmosContainer().items.query(query).fetchAll();

  const items = resources.map(m => ({
    mediaId: m.mediaId,
    postType: m.postType || "image",
    title: m.title,
    location: m.location,
    caption: m.caption,
    textBody: m.textBody,
    avgRating: m.avgRating ?? 0,
    ratingCount: m.ratingCount ?? 0,
    imageUrl: (m.postType === "image" && m.blobName) ? makeReadUrl(m.blobName) : null
  }));

  context.res = { headers: { "Content-Type": "application/json" }, body: { items } };
};
