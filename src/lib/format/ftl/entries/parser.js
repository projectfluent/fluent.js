import { default as ASTParser } from '../ast/parser';
import { createEntriesFromAST } from './transformer';

import { L10nError } from '../../../errors';

export default {
  parse: function(emit, string) {
    const ast = ASTParser.parseResource(string);
    const entries = createEntriesFromAST(ast);
    return entries;
  }
};
