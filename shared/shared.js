const { CosmosClient } = require("@azure/cosmos");
const {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  BlobServiceClient
} = require("@azure/storage-blob");

let cosmosClient;

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

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

function storageCred() {
  return new StorageSharedKeyCredential(
    must("STORAGE_ACCOUNT"),
    must("STORAGE_KEY")
  );
}

function blobServiceClient() {
  const account = must("STORAGE_ACCOUNT");
  return new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    storageCred()
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
  
  return makeSasUrl(blobName, "cw", 10);
}

function makeReadUrl(blobName) {
  
  return makeSasUrl(blobName, "r", 120);
}

async function deleteBlobIfExists(blobName) {
  if (!blobName) return;
  const container = blobServiceClient().getContainerClient(must("STORAGE_CONTAINER"));
  const blob = container.getBlobClient(blobName);
  await blob.deleteIfExists();
}

module.exports = { cosmosContainer, makeUploadUrl, makeReadUrl, deleteBlobIfExists };
