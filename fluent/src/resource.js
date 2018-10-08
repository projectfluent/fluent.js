import RuntimeParser from "./parser";

/**
 * Fluent Resource is a structure storing a map
 * of localization entries.
 */
export default class FluentResource extends Map {
  constructor(entries) {
    super(entries);
  }

  static fromString(source) {
    let parser = new RuntimeParser();
    return new FluentResource(parser.entries(source));
  }
}
