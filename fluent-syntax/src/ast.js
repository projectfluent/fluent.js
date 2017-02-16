class Node {
  constructor() {}
}

export class Resource extends Node {
  constructor(body = [], comment = null) {
    super(body, comment);
    this.type = 'Resource';
    this.body = body;
    this.comment = comment;
  }
}

export class Entry extends Node {
  constructor() {
    super();
    this.type = 'Entry';
  }
}

export class Message extends Entry {
  constructor(id, value = null, attributes = null, comment = null) {
    super();
    this.type = 'Message';
    this.id = id;
    this.value = value;
    this.attributes = attributes;
    this.comment = comment;
  }
}

export class Pattern extends Node {
  constructor(elements, quoted = false) {
    super();
    this.type = 'Pattern';
    this.elements = elements;
    this.quoted = quoted;
  }
}

export class Expression extends Node {
  constructor() {
    super();
    this.type = 'Expression';
  }
}

export class StringExpression extends Expression {
  constructor(value) {
    super();
    this.type = 'StringExpression';
    this.value = value;
  }
}

export class NumberExpression extends Expression {
  constructor(value) {
    super();
    this.type = 'NumberExpression';
    this.value = value;
  }
}

export class MessageReference extends Expression {
  constructor(id) {
    super();
    this.type = 'MessageReference';
    this.id = id;
  }
}

export class ExternalArgument extends Expression {
  constructor(id) {
    super();
    this.type = 'ExternalArgument';
    this.id = id;
  }
}

export class SelectExpression extends Expression {
  constructor(expression, variants) {
    super();
    this.type = 'SelectExpression';
    this.expression = expression;
    this.variants = variants;
  }
}

export class AttributeExpression extends Expression {
  constructor(id, name) {
    super();
    this.type = 'AttributeExpression';
    this.id = id;
    this.name = name;
  }
}

export class VariantExpression extends Expression {
  constructor(id, key) {
    super();
    this.type = 'VariantExpression';
    this.id = id;
    this.key = key;
  }
}

export class CallExpression extends Expression {
  constructor(callee, args) {
    super();
    this.type = 'CallExpression';
    this.callee = callee;
    this.args = args;
  }
}

export class Attribute extends Node {
  constructor(id, value) {
    super();
    this.type = 'Attribute';
    this.id = id;
    this.value = value;
  }
}

export class Variant extends Node {
  constructor(key, value, def = false) {
    super();
    this.type = 'Variant';
    this.key = key;
    this.value = value;
    this.default = def;
  }
}

export class NamedArgument extends Node {
  constructor(name, val) {
    super();
    this.name = name;
    this.val = val;
  }
}

export class Identifier extends Node {
  constructor(name) {
    super();
    this.type = 'Identifier';
    this.name = name;
  }
}

export class Keyword extends Identifier {
  constructor(name) {
    super(name);
    this.type = 'Keyword';
  }
}

export class Comment extends Entry {
  constructor(content) {
    super();
    this.type = 'Comment';
    this.content = content;
  }
}

export class Section extends Entry {
  constructor(key, comment = null) {
    super();
    this.type = 'Section';
    this.key = key;
    this.comment = comment;
  }
}

export class Function extends Identifier {
  constructor(name) {
    super(name);
    this.type = 'Function';
  }
}

export class JunkEntry extends Entry {
  constructor(content) {
    super();
    this.type = 'JunkEntry';
    this.content = content;
  }
}
