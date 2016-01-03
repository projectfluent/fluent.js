class Node {
  constructor() {
    this.type = this.constructor.name;
  }
}

class Entry extends Node {
  constructor() {
    super();
  }
}

class Identifier extends Node {
  constructor(name) {
    super();
    this.name = name;
  }
}

class Variable extends Node {
  constructor(name) {
    super();
    this.name = name;
  }
}

class Global extends Node {
  constructor(name) {
    super();
    this.name = name;
  }
}

class Value extends Node {
  constructor() {
    super();
  }
}

class String extends Value {
  constructor(source, content) {
    super();
    this.source = source;
    this.content = content;

    this._opchar = '"';
  }
}

class Hash extends Value {
  constructor(items) {
    super();
    this.items = items;
  }
}


class Entity extends Entry {
  constructor(id, value = null, index = null, attrs = []) {
    super();
    this.id = id;
    this.value = value;
    this.index = index;
    this.attrs = attrs;
  }
}

class Resource extends Node {
  constructor() {
    super();
    this.body = [];
  }
}

class Attribute extends Node {
  constructor(id, value, index = null) {
    super();
    this.id = id;
    this.value = value;
    this.index = index;
  }
}

class HashItem extends Node {
  constructor(id, value, defItem) {
    super();
    this.id = id;
    this.value = value;
    this.default = defItem;
  }
}

class Comment extends Entry {
  constructor(body) {
    super();
    this.body = body;
  }
}

class Expression extends Node {
  constructor() {
    super();
  }
}

class PropertyExpression extends Expression {
  constructor(idref, exp, computed = false) {
    super();
    this.idref = idref;
    this.exp = exp;
    this.computed = computed;
  }
}

class CallExpression extends Expression {
  constructor(callee, args) {
    super();
    this.callee = callee;
    this.args = args;
  }
}

class JunkEntry extends Entry {
  constructor(content) {
    super();
    this.content = content;
  }
}

export default {
  Node,
  Identifier,
  Value,
  String,
  Hash,
  Entity,
  Resource,
  Attribute,
  HashItem,
  Comment,
  Variable,
  Global,
  Expression,
  PropertyExpression,
  CallExpression,
  JunkEntry,
};
