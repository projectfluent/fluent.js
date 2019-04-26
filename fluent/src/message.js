import resolve from "./resolver.js";

export default
class FluentMessage {
    constructor(value, attributes) {
        this._value = value;
        this._attributes = attributes;
        this.attributes = Object.keys(attributes);
    }

    value(bundle, args, errors = []) {
        return resolve(bundle, args, this._value, errors);
    }

    attribute(bundle, name, args, errors = []) {
        let attribute = this._attributes[name];
        if (attribute === undefined){
            errors.push(`No attribute called "${name}"`);
            return undefined;
        }
        return resolve(bundle, args, attribute, errors);
    }
}
