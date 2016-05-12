import 'string.prototype.startswith';
import 'string.prototype.endswith';

export { fetchResource } from './io';
export { Context, SimpleContext } from '../../lib/context';
export { Bundle } from '../../lib/bundle';

export { default as FTLASTParser } from
  '../../lib/format/ftl/ast/parser';
export { default as FTLEntriesParser } from
  '../../lib/format/ftl/entries/parser';
export { createEntriesFromAST } from
  '../../lib/format/ftl/entries/transformer';
