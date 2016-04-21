import 'string.prototype.startswith';
import 'string.prototype.endswith';

export { fetchResource } from './io';
export { Env } from '../../lib/env';

export { format } from '../../lib/resolver';
export { default as FTLASTParser } from
  '../../lib/format/ftl/ast/parser';
export { default as FTLEntriesParser } from
  '../../lib/format/ftl/entries/parser';
export { createEntriesFromAST } from
  '../../lib/format/ftl/entries/transformer';

export * from '../../lib/mocks';
