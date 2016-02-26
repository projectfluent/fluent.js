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

class Member extends Node {
  constructor(id, value) {
    super();
    this.id = id;
    this.value = value;
  }
}

class Entity extends Entry {
  constructor(id, value = null, members = []) {
    super();
    this.id = id;
    this.value = value;
    this.members = members;
  }
}

class Placeable extends Node {
  constructor(content = null) {
    super();
    this.content = content;
  }
}

export default {
  Node,
  Identifier,
  Value,
  String,
  Member,
  Entity,
  Resource,
  Placeable
};
