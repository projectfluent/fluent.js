import resolve from "./resolver.js";

export default
class FluentMessage {
    constructor(bundle, id, message) {
        this.bundle = bundle;
        this.id = id;
        this.message = message;
        this.attributes = message.attrs
            ? Object.keys(message.attrs)
            : [];
    }

    value(args, errors = []) {
        // Optimize messages which are simple strings with no attributes.
        if (typeof this.message === "string") {
            return this.bundle._transform(this.message);
        }
        // Optimize messages with null values.
        if (this.message.value === null) {
            return null;
        }
        // Optimize simple-string messages with attributes.
        if (typeof this.message.value === "string") {
            return this.bundle._transform(this.message.value);
        }
        // Resolve the complex value of the message.
        return resolve(this.bundle, args, this.message, errors);
    }

    attribute(name, args, errors = []) {
        if (!this.message.attrs) {
            errors.push(`Message has no attributes: "${this.id}"`);
            return undefined;
        }
        let attribute = this.message.attrs[name];
        if (attribute === undefined){
            errors.push(`No attribute called "${name}"`);
            return undefined;
        }
        // Optimize attributes which are simple text.
        if (typeof attribute === "string") {
            return this.bundle._transform(attribute);
        }
        // Resolve the complex value of the attribute.
        return resolve(this.bundle, args, attribute, errors);
    }
}
