class Node {
  constructor() {
    this.type = this.constructor.name;
  }
}

class Resource extends Node {
  constructor() {
    super();
    this.body = [];
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
  }
}

class Trait extends Node {
  constructor(id, value) {
    super();
    this.id = id;
    this.value = value;
  }
}

class Variant extends Node {
  constructor(id, value, def = false) {
    super();
    this.id = id;
    this.value = value;
    this.default = def;
  }
}

class Entity extends Entry {
  constructor(id, value = null, traits = []) {
    super();
    this.id = id;
    this.value = value;
    this.traits = traits;
  }
}

class Placeable extends Node {
  constructor(content = null) {
    super();
    this.content = content;
  }
}

class SelectExpression extends Node {
  constructor(selector = null, variants = null) {
    super();
    this.selector = selector;
    this.variants = variants;
  }
}

class MemberExpression extends Node {
  constructor(idref, keyword) {
    super();
    this.idref = idref;
    this.keyword = keyword;
  }
}

class CallExpression extends Node {
  constructor(callee, args) {
    super();
    this.callee = callee;
    this.args = args;
  }
}

class Variable extends Node {
  constructor(id) {
    super();
    this.id = id;
  }
}

class KeyValueArg extends Node {
  constructor(key, value) {
    super();
    this.key = key;
    this.value = value;
  }
}

class Number extends Node {
  constructor(value) {
    super();
    this.value = value;
  }
}

export default {
  Node,
  Identifier,
  Value,
  String,
  Trait,
  Entity,
  Resource,
  Variant,
  Placeable,
  SelectExpression,
  MemberExpression,
  CallExpression,
  Variable,
  KeyValueArg,
  Number
};
