import { JSDOM } from "jsdom";

global.window = new JSDOM("", {
  url: "http://localhost",
}).window;
global.document = global.window.document;
Object.keys(document.defaultView).forEach(property => {
  if (typeof global[property] === "undefined") {
    global[property] = document.defaultView[property];
  }
});

global.navigator = {
  userAgent: "node.js",
};
