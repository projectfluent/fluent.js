const { resolve } = require("path");

const { name } = require(resolve("package.json"));

module.exports = {
  entryPoints: [resolve("src/index.ts")],
  hideGenerator: true,
  includeVersion: true,
  out: resolve(name.replace("@fluent", "../html")),
};
