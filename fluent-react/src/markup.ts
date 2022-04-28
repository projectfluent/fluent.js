/* eslint-env browser */

export type MarkupParser = (str: string) => Array<Node>;
let cachedParseMarkup: MarkupParser;

// We use a function creator to make the reference to `document` lazy. At the
// same time, it's eager enough to throw in <LocalizationProvider> as soon as
// it's first mounted which reduces the risk of this error making it to the
// runtime without developers noticing it in development.
export function createParseMarkup(): MarkupParser {
  if (typeof document === "undefined") {
    // We can't use <template> to sanitize translations.
    throw new Error(
      "`document` is undefined. Without it, translations cannot " +
        "be safely sanitized. Consult the documentation at " +
        "https://github.com/projectfluent/fluent.js/wiki/React-Overlays."
    );
  }

  if (!cachedParseMarkup) {
    const template = document.createElement("template");
    cachedParseMarkup = function parseMarkup(str: string): Array<Node> {
      template.innerHTML = str;
      return Array.from(template.content.childNodes);
    };
  }

  return cachedParseMarkup;
}
