import parse from "./parser";

/**
 * Fluent Resource is a structure storing a map
 * of localization entries.
 */
export default class FluentResource extends Map {
  constructor(entries, errors = []) {
    super(entries);
    this.errors = errors;
  }

  static fromString(source) {
    const [entries, errors] = parse(source);
    return new FluentResource(Object.entries(entries), errors);
  }
}

