'use strict';

const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM('', {
  url: 'http://localhost',
});

for (const [key, value] of Object.entries(window)) {
  if (!(key in global)) {
    global[key] = value;
  }
}

const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

Enzyme.configure({ adapter: new Adapter() });
