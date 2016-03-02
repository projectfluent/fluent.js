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

class String extends Node {
  constructor(source, elements) {
    super();
    this.source = source;
    this.elements = elements;
  }
}

class Member extends Node {
  constructor(key, value, def = false) {
    super();
    this.key = key;
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
  constructor(expression, variants = null) {
    super();
    this.expression = expression;
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

class Comment extends Node {
  constructor(content) {
    super();
    this.content = content;
  }
}

export default {
  Node,
  Identifier,
  String,
  Member,
  Entity,
  Resource,
  Placeable,
  MemberExpression,
  CallExpression,
  Variable,
  KeyValueArg,
  Number,
  Comment
};
