import { FluentParser } from "../../fluent-syntax/dist/parser.js";
import { FluentSerializer } from "../../fluent-syntax/dist/serializer.js";
import { Visitor, Transformer } from "../../fluent-syntax/dist/visitor.js";
import * as ast from "../../fluent-syntax/dist/ast.js";

this.EXPORTED_SYMBOLS = [
  ...Object.keys(ast),
  ...Object.keys({
    FluentParser,
    FluentSerializer,
    Visitor,
    Transformer,
  }),
];
