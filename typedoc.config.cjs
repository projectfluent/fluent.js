const { resolve } = require("path");

const { name } = require(resolve("package.json"));

module.exports = {
  entryPoints: ["src/index.ts"],
  hideGenerator: true,
  includeVersion: true,
  //logger: "none",
  out: name.replace("@fluent", "../html"),
};
