import { BaseNode } from "./ast";

/*
 * Abstract Visitor pattern
 */
export class Visitor {
  visit(node) {
    if (Array.isArray(node)) {
      node.forEach(child => this.visit(child));
      return;
    }
    if (!(node instanceof BaseNode)) {
      return;
    }
    const visit = this[`visit${node.type}`] || this.genericVisit;
    visit.call(this, node);
  }

  genericVisit(node) {
    for (const propname of Object.keys(node)) {
      this.visit(node[propname]);
    }
  }
}

/*
 * Abstract Transformer pattern
 */
export class Transformer extends Visitor {
  visit(node) {
    if (!(node instanceof BaseNode)) {
      return node;
    }
    const visit = this[`visit${node.type}`] || this.genericVisit;
    return visit.call(this, node);
  }

  genericVisit(node) {
    for (const propname of Object.keys(node)) {
      const propvalue = node[propname];
      if (Array.isArray(propvalue)) {
        const newvals = propvalue
          .map(child => this.visit(child))
          .filter(newchild => newchild !== undefined);
        node[propname] = newvals;
      }
      if (propvalue instanceof BaseNode) {
        const new_val = this.visit(propvalue);
        if (new_val === undefined) {
          delete node[propname];
        } else {
          node[propname] = new_val;
        }
      }
    }
    return node;
  }
}
