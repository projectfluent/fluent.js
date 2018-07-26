/* global window, require */
let doc = null;
if (typeof(window) === "undefined" || !window || !window.document) {
  const jsdom = require("jsdom");
  doc = new jsdom.JSDOM("<html><body></body></html>").window.document;
} else {
  doc = window.document;
}
const TEMPLATE = doc.createElement("template");

export function parseMarkup(str) {
  TEMPLATE.innerHTML = str;
  return TEMPLATE.content;
}
