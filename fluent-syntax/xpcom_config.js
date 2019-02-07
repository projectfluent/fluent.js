import nodeResolve from "rollup-plugin-node-resolve";
import bundleConfig from "../bundle_config";

const version = require("./package.json").version;
const input = `\
import FluentParser from "./src/parser";
import FluentSerializer from "./src/serializer";
import * as ast from "./src/ast";

let EXPORTED_SYMBOLS = [
  "FluentParser",
  "FluentSerializer",
  ...Object.keys(ast)
];
`;

export default Object.assign({}, bundleConfig, {
  preferConst: true,
  treeshake: false,
  input: "virtual",
  output: {
    format: "esm",
    freeze: false,
    banner: `\
/* vim: set ts=2 et sw=2 tw=80 filetype=javascript: */

/* Copyright 2017 Mozilla Foundation and others
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

`,
    intro: `/* fluent-syntax@${version} */`,
  },
  plugins: [
    nodeResolve(),
    {
      name: "virtual-input",
      resolveId(importee) {
        return importee === "virtual" ? importee : null;
      },
      load(id) {
        return id === "virtual" ? input : null;
      }
    }
  ]
});
