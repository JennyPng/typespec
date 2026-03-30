// @ts-check
import { uploadPythonPlaygroundPackages } from "../../../packages/bundle-uploader/dist/src/upload-python-browser-package.js";
import { repoRoot } from "../../common/scripts/helpers.js";

await uploadPythonPlaygroundPackages({ repoRoot });
