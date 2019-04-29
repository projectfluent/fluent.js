import {FluentNone} from "./types.js";
import Type from "./resolver.js";

export default
class FluentMessage {
  constructor(id, value, attributes) {
    this.id = id;
    this.hasValue = value !== null;
    this.attributeNames = Object.keys(attributes);

    this._value = value;
    this._attributes = attributes;
  }

  resolveValue(scope) {
    // Handle messages with null values.
    if (this._value === null) {
      scope.errors.push(new RangeError("No value"));
      return new FluentNone(this.id);
    }
    return Type(scope, this._value);
  }

  resolveAttribute(scope, name) {
    let attribute = this._attributes[name];
    if (attribute === undefined){
      scope.errors.push(new ReferenceError(`Unknown attribute: ${name}`));
      return new FluentNone(`${this.id}.${name}`);
    }
    return Type(scope, attribute);
  }
}
