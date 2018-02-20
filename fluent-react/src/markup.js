/* eslint-env browser */

const TEMPLATE = document.createElement("template");

export function parseMarkup(str) {
  TEMPLATE.innerHTML = str;
  return TEMPLATE.content;
}
