import 'string.prototype.startswith';
import 'string.prototype.endswith';

export { default as FTLASTParser } from
  '../../lib/format/ftl/ast/parser';
export { default as FTLEntriesParser } from
  '../../lib/format/ftl/entries/parser';
export { createEntriesFromAST } from
  '../../lib/format/ftl/entries/transformer';
export { Bundle } from '../../lib/bundle';

import { Context, SimpleContext } from '../../lib/context';
import { fetchResource } from './io';

export function createSimpleContext(langs, resIds) {
  return SimpleContext.create(fetchResource, langs, resIds);
}
