'use strict';

import { fetch } from './io';
import { View } from '../../bindings/gaiabuild/view';

export function translate(htmloptimizer, lang) {
  let htmlFetch = (...args) => fetch(htmloptimizer, ...args);
  let view = new View(htmloptimizer, htmlFetch);
  return view.translate(lang);
}
