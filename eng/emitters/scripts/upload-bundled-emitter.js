// @ts-check
import { resolve } from "path";
import { bundleAndUploadStandalonePackage } from "../../../packages/bundle-uploader/dist/src/index.js";
import { repoRoot } from "../../common/scripts/helpers.js";

const packageRelativePath = process.argv[2];
if (!packageRelativePath) {
  console.error("Usage: node upload-bundled-emitter.js <package-path>");
  console.error("  e.g. node upload-bundled-emitter.js packages/http-client-csharp");
  process.exit(1);
}

const packagePath = resolve(repoRoot, packageRelativePath);

await bundleAndUploadStandalonePackage({ packagePath });
