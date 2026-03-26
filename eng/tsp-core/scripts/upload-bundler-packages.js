// @ts-check
import { resolve } from "path";
import {
  bundleAndUploadPackages,
  getPackageVersion,
} from "../../../packages/bundle-uploader/dist/src/index.js";
import { repoRoot } from "../../common/scripts/helpers.js";

const pythonEmitterRoot = resolve(repoRoot, "packages/http-client-python");

await bundleAndUploadPackages({
  repoRoot: repoRoot,
  indexName: "typespec",
  indexVersion: await getPackageVersion(repoRoot, "@typespec/compiler"),
  packages: [
    "@typespec/compiler",
    "@typespec/http",
    "@typespec/rest",
    "@typespec/openapi",
    "@typespec/versioning",
    "@typespec/openapi3",
    "@typespec/json-schema",
    "@typespec/protobuf",
    "@typespec/streams",
    "@typespec/events",
    "@typespec/sse",
    "@typespec/xml",
  ],
  extraPackages: [
    {
      name: "@azure-tools/typespec-client-generator-core",
      rootDir: resolve(
        pythonEmitterRoot,
        "node_modules/@azure-tools/typespec-client-generator-core",
      ),
    },
    {
      name: "@azure-tools/typespec-azure-core",
      rootDir: resolve(pythonEmitterRoot, "node_modules/@azure-tools/typespec-azure-core"),
    },
    {
      name: "@azure-tools/typespec-autorest",
      rootDir: resolve(pythonEmitterRoot, "node_modules/@azure-tools/typespec-autorest"),
    },
    {
      name: "@azure-tools/typespec-azure-resource-manager",
      rootDir: resolve(
        pythonEmitterRoot,
        "node_modules/@azure-tools/typespec-azure-resource-manager",
      ),
    },
    {
      name: "@azure-tools/typespec-azure-rulesets",
      rootDir: resolve(pythonEmitterRoot, "node_modules/@azure-tools/typespec-azure-rulesets"),
    },
    {
      name: "@typespec/http-client-python",
      rootDir: pythonEmitterRoot,
    },
  ],
});
