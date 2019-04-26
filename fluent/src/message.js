import resolve from "./resolver.js";

export default
class FluentMessage {
    constructor(bundle, id, values) {
        this.bundle = bundle;
        this.id = id;
        this.values = values;
    }

    value(args, errors = []) {
        return resolve(this.bundle, args, this.values["*"], errors);
    }

    attribute(name, args, errors = []) {
        let attribute = this.values[name];
        if (attribute === undefined){
            errors.push(`No attribute called "${name}"`);
            return undefined;
        }
        return resolve(this.bundle, args, attribute, errors);
    }
}
