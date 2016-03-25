import L20nParser from '../../lib/format/l20n/entries/parser';
import PropertiesParser from '../../lib/format/properties/parser';
import FTLASTParser from '../../lib/format/ftl/ast/parser';
import { format } from '../../lib/resolver';
import { createEntriesFromAST, MockContext } from '../../lib/mocks';

this.L20n = {
  createEntriesFromAST,
  MockContext,
  L20nParser,
  FTLASTParser,
  PropertiesParser,
  format
};
