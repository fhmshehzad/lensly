module.exports = async function (context, req) {
  // For now return a placeholder to prove the API works.
  // Next we will connect Cosmos + Blob.
  context.res = {
    headers: { "Content-Type": "application/json" },
    body: { items: [] }
  };
};
