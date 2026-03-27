// @ts-check
import { uploadPythonPlaygroundPackages } from "../../../packages/bundle-uploader/dist/src/upload-python-packages.js";
import { repoRoot } from "../../common/scripts/helpers.js";

await uploadPythonPlaygroundPackages({ repoRoot });
