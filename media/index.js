const { cosmosContainer, makeReadUrl } = require("../shared/shared");

module.exports = async function (context, req) {
  const q = (req.query.q || "").toLowerCase();
  const page = Number(req.query.page || 0);
  const limit = Math.min(Number(req.query.limit || 9), 30);
  const offset = page * limit;

  const where = q
    ? `WHERE c.pk="media" AND (
        CONTAINS(LOWER(c.title), @q) OR
        CONTAINS(LOWER(c.caption), @q) OR
        CONTAINS(LOWER(c.location), @q) OR
        ARRAY_CONTAINS(c.people, @qp, true)
      )`
    : `WHERE c.pk="media"`;

  const query = {
    query: `SELECT * FROM c ${where} ORDER BY c.createdAt DESC OFFSET @o LIMIT @l`,
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
    title: m.title,
    location: m.location,
    caption: m.caption,
    people: m.people || [],
    avgRating: m.avgRating ?? 0,
    ratingCount: m.ratingCount ?? 0,
    imageUrl: makeReadUrl(m.blobName)
  }));

  context.res = { headers: { "Content-Type": "application/json" }, body: { items } };
};
