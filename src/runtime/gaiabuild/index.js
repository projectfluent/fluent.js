'use strict';

import { fetch } from './io';
import { View } from '../../bindings/gaiabuild/view';

export { qps, walkContent } from '../../lib/pseudo';

export function getView(htmloptimizer) {
  const htmlFetch = (...args) => fetch(htmloptimizer, ...args);
  return new View(htmloptimizer, htmlFetch);
}
