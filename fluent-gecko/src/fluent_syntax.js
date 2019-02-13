/* eslint object-shorthand: "off",
          no-unused-vars: "off",
          no-redeclare: "off",
          comma-dangle: "off",
          no-labels: "off" */

import FluentParser from "../../fluent-syntax/src/parser";
import FluentSerializer from "../../fluent-syntax/src/serializer";
import * as ast from "../../fluent-syntax/src/ast";

this.EXPORTED_SYMBOLS = [
  "FluentParser",
  "FluentSerializer",
  ...Object.keys(ast),
];
