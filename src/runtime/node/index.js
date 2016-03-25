import 'string.prototype.startswith';
import 'string.prototype.endswith';

export { fetchResource } from './io';
export { Env } from '../../lib/env';

export { default as PropertiesParser } from '../../lib/format/properties/parser';
export { default as L20nParser } from '../../lib/format/l20n/entries/parser';
export { format } from '../../lib/resolver';
export * from '../../lib/mocks';
