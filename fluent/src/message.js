import resolve from "./resolver.js";

export default
class FluentMessage {
    constructor(bundle, id, values) {
        this.bundle = bundle;
        this.id = id;
        ({"*": this._value = null, ...this._attributes} = values);
        this.attributes = Object.keys(this._attributes);
    }

    value(args, errors = []) {
        return resolve(this.bundle, args, this._value, errors);
    }

    attribute(name, args, errors = []) {
        let attribute = this._attributes[name];
        if (attribute === undefined){
            errors.push(`No attribute called "${name}"`);
            return undefined;
        }
        return resolve(this.bundle, args, attribute, errors);
    }
}
