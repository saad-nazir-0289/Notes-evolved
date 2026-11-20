import path from "node:path";
import { fileURLToPath } from "node:url";

export const resolveFrontendDistPath = (serverModuleUrl) => {
  if (typeof serverModuleUrl !== "string" || !serverModuleUrl.startsWith("file:")) {
    throw new TypeError("A file URL for the server module is required");
  }

  const serverDirectory = path.dirname(fileURLToPath(serverModuleUrl));
  return path.resolve(serverDirectory, "../../frontend/dist");
};
