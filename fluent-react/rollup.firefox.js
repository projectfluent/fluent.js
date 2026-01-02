import { nodeResolve } from "@rollup/plugin-node-resolve";
import pkg from "./package.json" with { type: "json" };

/**
 * This produces a bundled version of `@fluent/react` suitable for inclusion in Firefox:
 *
 * https://searchfox.org/firefox-main/source/devtools/client/shared/vendor/fluent-react.js
 */

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

export default {
  input: "dist/index.js",
  output: {
    file: "dist/fluent-react.cjs",
    format: "cjs",
    generatedCode: { constBindings: true },
    banner: license,
    intro: `/** ${pkg.name}@${pkg.version} */`,
  },
  context: "this",
  external: ["react"],
  plugins: [nodeResolve()],
};
