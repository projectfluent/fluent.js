class Node {
  constructor() {}
}

class Resource extends Node {
  constructor() {
    super();
    this.type = 'Resource';
    this.body = [];
  }
}

class Entry extends Node {
  constructor() {
    super();
    this.type = 'Entry';
  }
}

class Identifier extends Node {
  constructor(name) {
    super();
    this.type = 'Identifier';
    this.name = name;
  }
}

class String extends Node {
  constructor(source, elements) {
    super();
    this.type = 'String';
    this.source = source;
    this.elements = elements;
  }
}

class Member extends Node {
  constructor(key, value, def = false) {
    super();
    this.type = 'Member';
    this.key = key;
    this.value = value;
    this.default = def;
  }
}

class Entity extends Entry {
  constructor(id, value = null, traits = []) {
    super();
    this.type = 'Entity';
    this.id = id;
    this.value = value;
    this.traits = traits;
  }
}

class Placeable extends Node {
  constructor(expression, variants = null) {
    super();
    this.type = 'Placeable';
    this.expression = expression;
    this.variants = variants;
  }
}

class MemberExpression extends Node {
  constructor(idref, keyword) {
    super();
    this.type = 'MemberExpression';
    this.idref = idref;
    this.keyword = keyword;
  }
}

class CallExpression extends Node {
  constructor(callee, args) {
    super();
    this.type = 'CallExpression';
    this.callee = callee;
    this.args = args;
  }
}

class Variable extends Node {
  constructor(id) {
    super();
    this.type = 'Variable';
    this.id = id;
  }
}

class KeyValueArg extends Node {
  constructor(key, value) {
    super();
    this.type = 'KeyValueArg';
    this.key = key;
    this.value = value;
  }
}

class Number extends Node {
  constructor(value) {
    super();
    this.type = 'Number';
    this.value = value;
  }
}

class Comment extends Node {
  constructor(content) {
    super();
    this.type = 'Comment';
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
