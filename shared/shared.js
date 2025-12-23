const { CosmosClient } = require("@azure/cosmos");
const {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions
} = require("@azure/storage-blob");

let cosmosClient;

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

// --- Cosmos ---
function cosmosContainer() {
  if (!cosmosClient) {
    cosmosClient = new CosmosClient({
      endpoint: must("COSMOS_ENDPOINT"),
      key: must("COSMOS_KEY")
    });
  }
  return cosmosClient
    .database(must("COSMOS_DB"))
    .container(must("COSMOS_CONTAINER"));
}

// --- Blob SAS (secure temp URLs) ---
function storageCred() {
  return new StorageSharedKeyCredential(
    must("STORAGE_ACCOUNT"),
    must("STORAGE_KEY")
  );
}

function makeSasUrl(blobName, permissions, minutes) {
  const containerName = must("STORAGE_CONTAINER");
  const expiresOn = new Date(Date.now() + minutes * 60 * 1000);

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse(permissions),
      expiresOn
    },
    storageCred()
  ).toString();

  return `https://${must("STORAGE_ACCOUNT")}.blob.core.windows.net/${containerName}/${blobName}?${sas}`;
}

function makeUploadUrl(blobName) {
  // create + write (client uploads directly to Blob)
  return makeSasUrl(blobName, "cw", 10);
}

function makeReadUrl(blobName) {
  // read-only SAS (so public users can view private blobs)
  return makeSasUrl(blobName, "r", 120);
}

module.exports = { cosmosContainer, makeUploadUrl, makeReadUrl };
