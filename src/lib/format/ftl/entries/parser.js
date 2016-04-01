import { default as ASTParser } from '../ast/parser';
import { createEntriesFromAST } from './transformer';

import { L10nError } from '../../../errors';

export default {
  parseResource: function(string) {
    const ast = ASTParser.parseResource(string);
    return createEntriesFromAST(ast);
  }
};
