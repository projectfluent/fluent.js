class Node {
  constructor() {}
}

class NodeList extends Node {
  constructor(body = [], comment = null) {
    super();
    this.type = 'NodeList';
    this.body = body;
    this.comment = comment;
  }
}

class Resource extends NodeList {
  constructor(body = [], comment = null) {
    super(body, comment);
    this.type = 'Resource';
  }
}

class Entry extends Node {
  constructor() {
    super();
    this.type = 'Entry';
  }
}

class Message extends Entry {
  constructor(id, value = null, attributes = null, comment = null) {
    super();
    this.type = 'Entity';
    this.id = id;
    this.value = value;
    this.attributes = attributes;
    this.comment = comment;
  }
}

class Pattern extends Node {
  constructor(elements, quoted = false) {
    super();
    this.type = 'Pattern';
    this.elements = elements;
    this.quoted = quoted;
  }
}

class Expression extends Node {
  constructor() {
    super();
    this.type = 'Expression';
  }
}

class StringExpression extends Expression {
  constructor(value) {
    super();
    this.type = 'StringExpression';
    this.value = value;
  }
}

class NumberExpression extends Expression {
  constructor(value) {
    super();
    this.type = 'NumberExpression';
    this.value = value;
  }
}

class MessageReference extends Expression {
  constructor(id) {
    super();
    this.type = 'MessageReference';
    this.id = id;
  }
}

class ExternalArgument extends Expression {
  constructor(id) {
    super();
    this.type = 'ExternalArgument';
    this.id = id;
  }
}

class SelectExpression extends Expression {
  constructor(exp, variants) {
    super();
    this.type = 'SelectExpression';
    this.exp = exp;
    this.variants = variants;
  }
}

class AttributeExpression extends Expression {
  constructor(id, name) {
    super();
    this.type = 'AttributeExpression';
    this.id = id;
    this.name = name;
  }
}

class VariantExpression extends Expression {
  constructor(id, key) {
    super();
    this.type = 'VariantExpression';
    this.id = id;
    this.key = key;
  }
}

class CallExpression extends Expression {
  constructor(callee, args) {
    super();
    this.type = 'CallExpression';
    this.callee = callee;
    this.args = args;
  }
}

class Attribute extends Node {
  constructor(id, value) {
    super();
    this.type = 'Attribute';
    this.id = id;
    this.value = value;
  }
}

class Variant extends Node {
  constructor(key, value, def = false) {
    super();
    this.type = 'Variant';
    this.key = key;
    this.value = value;
    this.default = def;
  }
}

class NamedArgument extends Node {
  constructor(name, val) {
    super();
    this.name = name;
    this.val = val;
  }
}

class Identifier extends Node {
  constructor(name) {
    super();
    this.type = 'Identifier';
    this.name = name;
  }
}

class Keyword extends Identifier {
  constructor(name, namespace = null) {
    super(name);
    this.type = 'Keyword';
    this.namespace = namespace;
  }
}

class Comment extends Node {
  constructor(content) {
    super();
    this.type = 'Comment';
    this.content = content;
  }
}

class Section extends Node {
  constructor(key, comment = null) {
    super();
    this.type = 'Section';
    this.key = key;
    this.comment = comment;
  }
}

class Function extends Identifier {
  constructor(name) {
    super(name);
    this.type = 'Function';
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
  Resource,
  Message,
  Entry,
  Pattern,
  Expression,
  StringExpression,
  NumberExpression,
  MessageReference,
  ExternalArgument,
  SelectExpression,
  AttributeExpression,
  VariantExpression,
  CallExpression,
  Attribute,
  Variant,
  NamedArgument,
  Identifier,
  Keyword,
  Comment,
  Section,
  Function,
  JunkEntry,
};
