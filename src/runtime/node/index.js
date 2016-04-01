import 'string.prototype.startswith';
import 'string.prototype.endswith';
import PropertiesParser from '../../lib/format/properties/parser';
import L20nParser from '../../lib/format/l20n/entries/parser';
import FTLASTParser from '../../lib/format/ftl/ast/parser';
import FTLEntriesParser from '../../lib/format/ftl/entries/parser';

export { fetchResource } from './io';
export { Env } from '../../lib/env';
export { format } from '../../lib/resolver';
export { PropertiesParser, L20nParser, FTLASTParser, FTLEntriesParser };
export * from '../../lib/mocks';
