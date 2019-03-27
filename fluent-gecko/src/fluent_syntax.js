/* eslint object-shorthand: "off",
          comma-dangle: "off",
          no-labels: "off" */

import {FluentParser} from "../../fluent-syntax/src/parser";
import {FluentSerializer} from "../../fluent-syntax/src/serializer";
import * as ast from "../../fluent-syntax/src/ast";
import * as visitor from "../../fluent-syntax/src/visitor";

this.EXPORTED_SYMBOLS = [
  ...Object.keys({
    FluentParser,
    FluentSerializer,
  }),
  ...Object.keys(ast),
  ...Object.keys(visitor),
];
