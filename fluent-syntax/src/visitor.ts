import { BaseNode } from "./ast.js";

export abstract class Visitor {
  [method: string]: (this: Visitor, node: BaseNode) => void;

  visit(node: BaseNode): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    let visit = this[`visit${node.type}`] || this.genericVisit;
    visit.call(this, node);
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
}

export abstract class Transformer extends Visitor {
  [method: string]: (this: Visitor, node: BaseNode) => BaseNode | undefined;

  visit(node: BaseNode): BaseNode | undefined {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const visit = this[`visit${node.type}`] || this.genericVisit;
    return visit.call(this, node);
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
}
