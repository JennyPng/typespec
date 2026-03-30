import { AzureCliCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { createTypeSpecBundle } from "@typespec/bundler";
import { readFile, readdir } from "fs/promises";
import { join, resolve } from "path";
import { join as joinPosix } from "path/posix";
import { parse } from "semver";
import { pkgsContainer, storageAccountName } from "./constants.js";
import { logInfo, logSuccess } from "./index.js";
import { PackageIndex, TypeSpecBundledPackageUploader } from "./upload-browser-package.js";

interface PythonPackageIndex extends PackageIndex {
  assets: Record<string, string>;
}

/**
 * @azure-tools/* peer dependencies to bundle. These are loaded at runtime
 * when user TypeSpec input imports them.
 */
const azureToolsPackages = [
  "@azure-tools/typespec-client-generator-core",
  "@azure-tools/typespec-azure-core",
  "@azure-tools/typespec-azure-resource-manager",
  "@azure-tools/typespec-autorest",
  "@azure-tools/typespec-azure-rulesets",
];

export interface UploadPythonPlaygroundPackagesOptions {
  /**
   * Absolute path to the repository root.
   */
  repoRoot: string;
}

/** Read a package.json version in major.minor.x format. */
function getVersionFromPackageJson(pkgJson: { version: string }): string {
  const version = parse(pkgJson.version);
  if (!version) {
    throw new Error(`Could not parse version: "${pkgJson.version}"`);
  }
  return `${version.major}.${version.minor}.x`;
}

/** Find the pygen wheel file by scanning generator/dist/pygen-*.whl */
async function findPygenWheel(pythonEmitterDir: string) {
  const distDir = join(pythonEmitterDir, "generator/dist");
  const files = await readdir(distDir);
  const whlFile = files.find((f) => f.startsWith("pygen-") && f.endsWith(".whl"));
  if (!whlFile) {
    throw new Error(`No pygen wheel found in ${distDir}`);
  }
  return { filename: whlFile, path: join(distDir, whlFile) };
}

/** Upload the pygen wheel as a binary asset to blob storage. */
async function uploadPygenWheel(
  credential: AzureCliCredential,
  pkgName: string,
  pkgVersion: string,
  wheel: { filename: string; path: string },
): Promise<string> {
  const blobSvc = new BlobServiceClient(
    `https://${storageAccountName}.blob.core.windows.net`,
    credential,
  );
  const container = blobSvc.getContainerClient(pkgsContainer);
  const blobPath = joinPosix(pkgName, pkgVersion, wheel.filename);
  const blob = container.getBlockBlobClient(blobPath);

  const content = await readFile(wheel.path);
  try {
    await blob.uploadData(content, {
      blobHTTPHeaders: {
        blobContentType: "application/octet-stream",
      },
      conditions: {
        ifNoneMatch: "*",
      },
    });
    logSuccess(`Uploaded pygen wheel: ${blobPath}`);
  } catch (e: any) {
    if (e.code === "BlobAlreadyExists") {
      logInfo(`Pygen wheel already exists: ${blobPath}`);
    } else {
      throw e;
    }
  }

  return `${container.url}/${blobPath}`;
}

export async function uploadPythonPlaygroundPackages({
  repoRoot,
}: UploadPythonPlaygroundPackagesOptions) {
  const pythonEmitterDir = resolve(repoRoot, "packages/http-client-python");
  const pkgJson = JSON.parse(await readFile(join(pythonEmitterDir, "package.json"), "utf-8"));
  const indexVersion = getVersionFromPackageJson(pkgJson);
  logInfo("Python playground index version:", indexVersion);

  const credential = new AzureCliCredential();
  const uploader = new TypeSpecBundledPackageUploader(credential);
  await uploader.createIfNotExists();

  // Fetch existing index (if any) to preserve previously-uploaded entries
  const existingIndex = await uploader.getIndex("python", indexVersion);
  const importMap: Record<string, string> = { ...existingIndex?.imports };

  // Bundle and upload the Python emitter itself
  logInfo("\nBundling @typespec/http-client-python...");
  const emitterBundle = await createTypeSpecBundle(pythonEmitterDir);
  const emitterResult = await uploader.upload(emitterBundle);
  if (emitterResult.status === "uploaded") {
    logSuccess(`Uploaded @typespec/http-client-python@${emitterBundle.manifest.version}`);
  } else {
    logInfo(`@typespec/http-client-python@${emitterBundle.manifest.version} already exists`);
  }
  if (!existingIndex || emitterResult.status === "uploaded") {
    for (const [key, value] of Object.entries(emitterResult.imports)) {
      importMap[joinPosix(emitterBundle.manifest.name, key)] = value;
    }
  }

  // 2. Bundle and upload each @azure-tools/* peer dependency
  for (const pkgName of azureToolsPackages) {
    const pkgDir = resolve(pythonEmitterDir, "node_modules", pkgName);
    logInfo(`\nBundling ${pkgName}...`);
    const bundle = await createTypeSpecBundle(pkgDir);
    const result = await uploader.upload(bundle);
    if (result.status === "uploaded") {
      logSuccess(`Uploaded ${pkgName}@${bundle.manifest.version}`);
    } else {
      logInfo(`${pkgName}@${bundle.manifest.version} already exists`);
    }
    if (!existingIndex || result.status === "uploaded") {
      for (const [key, value] of Object.entries(result.imports)) {
        importMap[joinPosix(bundle.manifest.name, key)] = value;
      }
    }
  }

  // 3. Upload the pygen wheel as a static binary asset
  logInfo("\nUploading pygen wheel...");
  const wheel = await findPygenWheel(pythonEmitterDir);
  const wheelUrl = await uploadPygenWheel(
    credential,
    "@typespec/http-client-python",
    pkgJson.version,
    wheel,
  );

  // 4. Write the index with imports + assets
  const index: PythonPackageIndex = {
    version: indexVersion,
    imports: importMap,
    assets: {
      "pygen-wheel": wheelUrl,
    },
  };
  logInfo("\nImport map:", JSON.stringify(index, null, 2));
  await uploader.updateIndex("python", index);
  logSuccess(`Updated index for python@${indexVersion}`);
}
