/* eslint object-shorthand: "off",
          comma-dangle: "off",
          no-labels: "off" */

import {FluentParser} from "../../fluent-syntax/esm/parser";
import {FluentSerializer} from "../../fluent-syntax/esm/serializer";
import {Visitor, Transformer} from "../../fluent-syntax/esm/visitor";
import * as ast from "../../fluent-syntax/esm/ast";

this.EXPORTED_SYMBOLS = [
  ...Object.keys(ast),
  ...Object.keys({
    FluentParser,
    FluentSerializer,
    Visitor,
    Transformer
  }),
];
