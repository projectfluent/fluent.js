/* eslint-env browser */

const TEMPLATE = typeof(document) !== "undefined" ?
  document.createElement("template") : null;

export function parseMarkup(str) {
  TEMPLATE.innerHTML = str;
  return TEMPLATE.content;
}
