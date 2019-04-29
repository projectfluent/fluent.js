import {FluentNone} from "./types.js";
import Type from "./resolver.js";

export default
class FluentMessage {
  constructor(id, value, attributes) {
    this.id = id;

    // Reflection fields allow consumers to decide which patterns to format.
    this.hasValue = value !== null;
    this.attributeNames = Object.keys(attributes);

    // Semi-private fields for storing the runtime AST of the message.
    // Should not be accessed directly.
    this._value = value;
    this._attributes = attributes;
  }

  // Resolve the value of the message into a FluentType. Used by
  // FluentBundle.{format,formatValue} and when resolving references to
  // messages and terms from other patterns.
  resolveValue(scope) {
    // Handle messages with null values.
    if (this._value === null) {
      scope.errors.push(new RangeError("No value"));
      return new FluentNone(this.id);
    }
    return Type(scope, this._value);
  }

  // Resolve the attribute of the message into a FluentType. Used by
  // FluentBundle.formatAttribute and when resolving references to
  // attributes of messages and terms from other patterns.
  resolveAttribute(scope, name) {
    let attribute = this._attributes[name];
    if (attribute === undefined){
      scope.errors.push(new ReferenceError(`Unknown attribute: ${name}`));
      return new FluentNone(`${this.id}.${name}`);
    }
    return Type(scope, attribute);
  }
}
