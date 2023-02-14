import { readFileSync } from "fs";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const vim = `/* vim: set ts=2 et sw=2 tw=80 filetype=javascript: */`;
const license = `\
/* Copyright 2019 Mozilla Foundation and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

`;

const reactPkgSrc = readFileSync("../fluent-react/package.json", "utf8");
const reactPkg = JSON.parse(reactPkgSrc);
const syntaxPkgSrc = readFileSync("../fluent-syntax/package.json", "utf8");
const syntaxPkg = JSON.parse(syntaxPkgSrc);

export default [
  {
    input: "src/fluent-react.js",
    output: {
      file: "dist/fluent-react.js",
      format: "cjs",
      generatedCode: { constBindings: true },
      banner: license,
      intro: `/** fluent-react@${reactPkg.version} */`,
    },
    context: "this",
    external: ["react"],
    plugins: [nodeResolve()],
  },
  {
    input: "src/fluent-syntax.js",
    output: {
      file: "dist/FluentSyntax.jsm",
      format: "es",
      freeze: false,
      generatedCode: { constBindings: true },
      banner: `${vim}\n\n${license}`,
      intro: `/** fluent-syntax@${syntaxPkg.version} */`,
    },
    context: "this",
    treeshake: false,
    plugins: [nodeResolve()],
  },
];
