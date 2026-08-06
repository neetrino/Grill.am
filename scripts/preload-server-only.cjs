/**
 * Intercepts Node's module load so CLI scripts can import Next server modules
 * that declare `import "server-only"`.
 */
const Module = require("node:module");

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad(request, parent, isMain);
};
