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

class Pattern extends Node {
  constructor(source, elements) {
    super();
    this.type = 'Pattern';
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
  constructor(expressions) {
    super();
    this.type = 'Placeable';
    this.expressions = expressions;
  }
}

class SelectExpression extends Node {
  constructor(expression, variants = null) {
    super();
    this.type = 'SelectExpression';
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
  constructor(id, value) {
    super();
    this.type = 'KeyValueArg';
    this.id = id;
    this.value = value;
  }
}

class EntityReference extends Node {
  constructor(id) {
    super();
    this.type = 'EntityReference';
    this.id = id;
  }
}

class BuiltinReference extends Node {
  constructor(id) {
    super();
    this.type = 'BuiltinReference';
    this.id = id;
  }
}

class Keyword extends Node {
  constructor(value, namespace=null) {
    super();
    this.type = 'Keyword';
    this.value = value;
    this.namespace = namespace;
  }
}

class Number extends Node {
  constructor(value) {
    super();
    this.type = 'Number';
    this.value = value;
  }
}

class TextElement extends Node {
  constructor(value) {
    super();
    this.type = 'TextElement';
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

class JunkEntry extends Entry {
  constructor(content) {
    super();
    this.type = 'JunkEntry';
    this.content = content;
  }
}

export default {
  Node,
  Pattern,
  Member,
  Entity,
  Resource,
  Placeable,
  SelectExpression,
  MemberExpression,
  CallExpression,
  Variable,
  KeyValueArg,
  Number,
  EntityReference,
  BuiltinReference,
  Keyword,
  TextElement,
  Comment,
  JunkEntry
};
