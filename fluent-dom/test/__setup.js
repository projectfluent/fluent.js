'use strict';

const JSDOM = require('jsdom').JSDOM;

global.window = new JSDOM('').window;
global.document = global.window.document;
Object.keys(document.defaultView).forEach(property => {
  if (typeof global[property] === 'undefined') {
    global[property] = document.defaultView[property];
  }
});

global.navigator = {
  userAgent: 'node.js'
};
