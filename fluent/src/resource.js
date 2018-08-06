import parse from "./parser";

/**
 * Fluent Resource is a structure storing a map
 * of localization entries.
 */
export default class FluentResource extends Map {
  constructor(entries) {
    super(entries);
  }

  static fromString(source) {
    const entries = parse(source);
    return new FluentResource(entries);
  }
}
