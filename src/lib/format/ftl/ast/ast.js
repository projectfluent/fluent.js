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
  constructor(content) {
    super();
    this.content = content;
  }
}

class Hash extends Value {
  constructor(items) {
    super();
    this.items = items;
  }
}

class Entity extends Entry {
  constructor(id, value = null) {
    super();
    this.id = id;
    this.value = value;
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
};
