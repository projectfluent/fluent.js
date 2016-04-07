import FTLASTParser from '../../lib/format/ftl/ast/parser';
import FTLEntriesParser from '../../lib/format/ftl/entries/parser';
import { createEntriesFromAST } from '../../lib/format/ftl/entries/transformer';
import { format } from '../../lib/resolver';
import { MockContext } from '../../lib/mocks';

export default {
  MockContext,
  FTLASTParser,
  FTLEntriesParser,
  createEntriesFromAST,
  format
};
