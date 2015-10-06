'use strict';

/* jshint node:true */

import { fetch } from './io';
import { View } from '../../../bindings/gaiabuild/view';
import { pseudo, walkValue } from '../../../lib/pseudo';

function getView(htmloptimizer) {
  const htmlFetch = (...args) => fetch(htmloptimizer, ...args);
  return new View(htmloptimizer, htmlFetch);
}

module.exports = {
  pseudo, walkValue, getView
};
