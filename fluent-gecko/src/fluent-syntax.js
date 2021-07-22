/* eslint object-shorthand: "off",
          comma-dangle: "off",
          no-labels: "off" */

import {FluentParser} from "../../fluent-syntax/esm/parser.js";
import {FluentSerializer} from "../../fluent-syntax/esm/serializer.js";
import {Visitor, Transformer} from "../../fluent-syntax/esm/visitor.js";
import * as ast from "../../fluent-syntax/esm/ast.js";

this.EXPORTED_SYMBOLS = [
  ...Object.keys(ast),
  ...Object.keys({
    FluentParser,
    FluentSerializer,
    Visitor,
    Transformer
  }),
];
