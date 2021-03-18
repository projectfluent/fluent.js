import { BaseNode } from "./ast.js";

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
 *         (this: Visitor, node: BaseNode): void;
 *     }
 */
export abstract class Visitor {
  [prop: string]: unknown;

  visit(node: BaseNode): void {
    let visit = this[`visit${node.type}`];
    if (typeof visit === "function") {
      visit.call(this, node);
    } else {
      this.genericVisit(node);
    }
  }

  genericVisit(node: BaseNode): void {
    for (const key of Object.keys(node)) {
      let prop = node[key];
      if (prop instanceof BaseNode) {
        this.visit(prop);
      } else if (Array.isArray(prop)) {
        for (let element of prop) {
          this.visit(element as BaseNode);
        }
      }
    }
  }

  visitResource?(node: BaseNode): void;
  visitMessage?(node: BaseNode): void;
  visitTerm?(node: BaseNode): void;
  visitPattern?(node: BaseNode): void;
  visitTextElement?(node: BaseNode): void;
  visitPlaceable?(node: BaseNode): void;
  visitStringLiteral?(node: BaseNode): void;
  visitNumberLiteral?(node: BaseNode): void;
  visitMessageReference?(node: BaseNode): void;
  visitTermReference?(node: BaseNode): void;
  visitVariableReference?(node: BaseNode): void;
  visitFunctionReference?(node: BaseNode): void;
  visitSelectExpression?(node: BaseNode): void;
  visitCallArguments?(node: BaseNode): void;
  visitAttribute?(node: BaseNode): void;
  visitVariant?(node: BaseNode): void;
  visitNamedArgument?(node: BaseNode): void;
  visitIdentifier?(node: BaseNode): void;
  visitComment?(node: BaseNode): void;
  visitGroupComment?(node: BaseNode): void;
  visitResourceComment?(node: BaseNode): void;
  visitJunk?(node: BaseNode): void;
  visitSpan?(node: BaseNode): void;
  visitAnnotation?(node: BaseNode): void;
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
 *         (this: Transformer, node: BaseNode): BaseNode | undefined;
 *     }
 *
 * The returned node will replace the original one in the AST. Return
 * `undefined` to remove the node instead.
 */
export abstract class Transformer extends Visitor {
  [prop: string]: unknown;

  visit(node: BaseNode): BaseNode | undefined {
    let visit = this[`visit${node.type}`];
    if (typeof visit === "function") {
      return visit.call(this, node);
    }
    return this.genericVisit(node);
  }

  genericVisit(node: BaseNode): BaseNode | undefined {
    for (const key of Object.keys(node)) {
      let prop = node[key];
      if (prop instanceof BaseNode) {
        let newVal = this.visit(prop);
        if (newVal === undefined) {
          delete node[key];
        } else {
          node[key] = newVal;
        }
      } else if (Array.isArray(prop)) {
        let newVals: Array<BaseNode> = [];
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

  visitResource?(node: BaseNode): BaseNode | undefined;
  visitMessage?(node: BaseNode): BaseNode | undefined;
  visitTerm?(node: BaseNode): BaseNode | undefined;
  visitPattern?(node: BaseNode): BaseNode | undefined;
  visitTextElement?(node: BaseNode): BaseNode | undefined;
  visitPlaceable?(node: BaseNode): BaseNode | undefined;
  visitStringLiteral?(node: BaseNode): BaseNode | undefined;
  visitNumberLiteral?(node: BaseNode): BaseNode | undefined;
  visitMessageReference?(node: BaseNode): BaseNode | undefined;
  visitTermReference?(node: BaseNode): BaseNode | undefined;
  visitVariableReference?(node: BaseNode): BaseNode | undefined;
  visitFunctionReference?(node: BaseNode): BaseNode | undefined;
  visitSelectExpression?(node: BaseNode): BaseNode | undefined;
  visitCallArguments?(node: BaseNode): BaseNode | undefined;
  visitAttribute?(node: BaseNode): BaseNode | undefined;
  visitVariant?(node: BaseNode): BaseNode | undefined;
  visitNamedArgument?(node: BaseNode): BaseNode | undefined;
  visitIdentifier?(node: BaseNode): BaseNode | undefined;
  visitComment?(node: BaseNode): BaseNode | undefined;
  visitGroupComment?(node: BaseNode): BaseNode | undefined;
  visitResourceComment?(node: BaseNode): BaseNode | undefined;
  visitJunk?(node: BaseNode): BaseNode | undefined;
  visitSpan?(node: BaseNode): BaseNode | undefined;
  visitAnnotation?(node: BaseNode): BaseNode | undefined;
}
