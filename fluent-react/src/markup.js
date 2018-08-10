/* eslint-env browser */

let cachedParseMarkup;

// We use a function creator to make the reference to `document` lazy. At the
// same time, it's eager enough to throw in <Localized> as soon as it's first
// rendered which reduces the risk of this error making it to the runtime
// without developers noticing it in development.
export default function createParseMarkup() {
  if (typeof(document) === "undefined") {
    // We can't use <template> to sanitize translations.
    throw new Error(
      "`document` is undefined. Without it, translations cannot " +
      "be safely sanitized. Consult the documentation at " +
      "https://github.com/projectfluent/fluent.js/wiki/React-Overlays."
    );
  }

  if (!cachedParseMarkup) {
    const template = document.createElement("template");
    cachedParseMarkup = function parseMarkup(str) {
      template.innerHTML = str;
      return Array.from(template.content.childNodes);
    };
  }

  return cachedParseMarkup;
}
