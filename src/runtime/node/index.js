import 'string.prototype.startswith';
import 'string.prototype.endswith';

export { default as FTLASTParser } from '../../ftl/ast/parser';
export { default as FTLEntriesParser } from '../../ftl/entries/parser';
export { createEntriesFromAST } from '../../ftl/entries/transformer';
export { MessageContext } from '../../intl/context';
export { fetchResource } from './io';
