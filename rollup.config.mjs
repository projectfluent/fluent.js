import { promises } from "fs";

// 'fs/promises' is only available from Node.js 14.0.0
const { readFile } = promises;

const globalName = {
  "@fluent/bundle": "FluentBundle",
  "@fluent/dedent": "FluentDedent",
  "@fluent/dom": "FluentDOM",
  "@fluent/langneg": "FluentLangNeg",
  "@fluent/react": "FluentReact",
  "@fluent/sequence": "FluentSequence",
  "@fluent/syntax": "FluentSyntax",
};

module.exports = async function() {
  // Current dir is the package's own directory here
  const pkgSrc = await readFile("package.json", "utf8");
  const { name, version } = JSON.parse(pkgSrc);

  return {
    input: "esm/index.js",
    output: {
      file: "index.js",
      format: "umd",
      amd: { id: name },
      name: globalName[name],
      banner: `/* ${name}@${version} */`,
    },
  };
};
