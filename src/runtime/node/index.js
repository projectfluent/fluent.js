import 'string.prototype.startswith';
import 'string.prototype.endswith';

export { fetchResource } from './io';
export { Context } from '../../lib/context';

export { default as FTLASTParser } from
  '../../lib/format/ftl/ast/parser';
export { default as FTLEntriesParser } from
  '../../lib/format/ftl/entries/parser';
export { createEntriesFromAST } from
  '../../lib/format/ftl/entries/transformer';

export * from '../../lib/mocks';
