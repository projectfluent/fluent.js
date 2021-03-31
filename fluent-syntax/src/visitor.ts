import * as AST from "./ast.js";

/**
 * A read-only visitor.
 *
 * Subclasses can be used to gather information from an AST.
 *
 * To handle specific node types add methods like `visitPattern`.
 * Then, to descend into children call `genericVisit`.
 *
 * Visiting methods must implement the following interface:
 *
 *     interface VisitingMethod {
 *         (this: Visitor, node: AST.BaseNode): void;
 *     }
 */
export abstract class Visitor {
  [prop: string]: unknown;

  visit(node: AST.BaseNode): void {
    let visit = this[`visit${node.type}`];
    if (typeof visit === "function") {
      visit.call(this, node);
    } else {
      this.genericVisit(node);
    }
  }

  genericVisit(node: AST.BaseNode): void {
    for (const key of Object.keys(node)) {
      let prop = node[key];
      if (prop instanceof AST.BaseNode) {
        this.visit(prop);
      } else if (Array.isArray(prop)) {
        for (let element of prop) {
          this.visit(element as AST.BaseNode);
        }
      }
    }
  }

  visitResource?(node: AST.Resource): void;
  visitMessage?(node: AST.Message): void;
  visitTerm?(node: AST.Term): void;
  visitPattern?(node: AST.Pattern): void;
  visitTextElement?(node: AST.TextElement): void;
  visitPlaceable?(node: AST.Placeable): void;
  visitStringLiteral?(node: AST.StringLiteral): void;
  visitNumberLiteral?(node: AST.NumberLiteral): void;
  visitMessageReference?(node: AST.MessageReference): void;
  visitTermReference?(node: AST.TermReference): void;
  visitVariableReference?(node: AST.VariableReference): void;
  visitFunctionReference?(node: AST.FunctionReference): void;
  visitSelectExpression?(node: AST.SelectExpression): void;
  visitCallArguments?(node: AST.CallArguments): void;
  visitAttribute?(node: AST.Attribute): void;
  visitVariant?(node: AST.Variant): void;
  visitNamedArgument?(node: AST.NamedArgument): void;
  visitIdentifier?(node: AST.Identifier): void;
  visitComment?(node: AST.Comment): void;
  visitGroupComment?(node: AST.GroupComment): void;
  visitResourceComment?(node: AST.ResourceComment): void;
  visitJunk?(node: AST.Junk): void;
  visitSpan?(node: AST.Span): void;
  visitAnnotation?(node: AST.Annotation): void;
}

/**
 * A read-and-write visitor.
 *
 * Subclasses can be used to modify an AST in-place.
 *
 * To handle specific node types add methods like `visitPattern`.
 * Then, to descend into children call `genericVisit`.
 *
 * Visiting methods must implement the following interface:
 *
 *     interface TransformingMethod {
 *         (this: Transformer, node: AST.BaseNode): AST.BaseNode | undefined;
 *     }
 *
 * The returned node will replace the original one in the AST. Return
 * `undefined` to remove the node instead.
 */
export abstract class Transformer extends Visitor {
  [prop: string]: unknown;

  visit(node: AST.BaseNode): AST.BaseNode | undefined {
    let visit = this[`visit${node.type}`];
    if (typeof visit === "function") {
      return visit.call(this, node);
    }
    return this.genericVisit(node);
  }

  genericVisit(node: AST.BaseNode): AST.BaseNode {
    for (const key of Object.keys(node)) {
      let prop = node[key];
      if (prop instanceof AST.BaseNode) {
        let newVal = this.visit(prop);
        if (newVal === undefined) {
          delete node[key];
        } else {
          node[key] = newVal;
        }
      } else if (Array.isArray(prop)) {
        let newVals: Array<AST.BaseNode> = [];
        for (let element of prop) {
          let newVal = this.visit(element);
          if (newVal !== undefined) {
            newVals.push(newVal);
          }
        }
        node[key] = newVals;
      }
    }
    return node;
  }

  visitResource?(node: AST.Resource): AST.BaseNode | undefined;
  visitMessage?(node: AST.Message): AST.BaseNode | undefined;
  visitTerm?(node: AST.Term): AST.BaseNode | undefined;
  visitPattern?(node: AST.Pattern): AST.BaseNode | undefined;
  visitTextElement?(node: AST.TextElement): AST.BaseNode | undefined;
  visitPlaceable?(node: AST.Placeable): AST.BaseNode | undefined;
  visitStringLiteral?(node: AST.StringLiteral): AST.BaseNode | undefined;
  visitNumberLiteral?(node: AST.NumberLiteral): AST.BaseNode | undefined;
  visitMessageReference?(node: AST.MessageReference): AST.BaseNode | undefined;
  visitTermReference?(node: AST.TermReference): AST.BaseNode | undefined;
  visitVariableReference?(node: AST.VariableReference):
  AST.BaseNode | undefined;
  visitFunctionReference?(node: AST.FunctionReference):
  AST.BaseNode | undefined;
  visitSelectExpression?(node: AST.SelectExpression): AST.BaseNode | undefined;
  visitCallArguments?(node: AST.CallArguments): AST.BaseNode | undefined;
  visitAttribute?(node: AST.Attribute): AST.BaseNode | undefined;
  visitVariant?(node: AST.Variant): AST.BaseNode | undefined;
  visitNamedArgument?(node: AST.NamedArgument): AST.BaseNode | undefined;
  visitIdentifier?(node: AST.Identifier): AST.BaseNode | undefined;
  visitComment?(node: AST.Comment): AST.BaseNode | undefined;
  visitGroupComment?(node: AST.GroupComment): AST.BaseNode | undefined;
  visitResourceComment?(node: AST.ResourceComment): AST.BaseNode | undefined;
  visitJunk?(node: AST.Junk): AST.BaseNode | undefined;
  visitSpan?(node: AST.Span): AST.BaseNode | undefined;
  visitAnnotation?(node: AST.Annotation): AST.BaseNode | undefined;
}
