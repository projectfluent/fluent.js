import { readFile } from "fs/promises";

const globalName = {
  "@fluent/bundle": "FluentBundle",
  "@fluent/dedent": "FluentDedent",
  "@fluent/dom": "FluentDOM",
  "@fluent/langneg": "FluentLangNeg",
  "@fluent/react": "FluentReact",
  "@fluent/sequence": "FluentSequence",
  "@fluent/syntax": "FluentSyntax",
};

export default async function () {
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
}
