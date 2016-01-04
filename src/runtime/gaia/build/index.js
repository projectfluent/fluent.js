/* jshint node:true */

import { fetchResource } from './io';
import { View } from '../../../bindings/gaiabuild/view';
export { pseudo, walkValue } from '../../../lib/pseudo';

export function getView(htmloptimizer) {
  const htmlFetch = (...args) => fetchResource(htmloptimizer, ...args);
  return new View(htmloptimizer, htmlFetch);
}
