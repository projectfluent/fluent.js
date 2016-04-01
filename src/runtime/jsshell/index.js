import L20nParser from '../../lib/format/l20n/entries/parser';
import PropertiesParser from '../../lib/format/properties/parser';
import FTLASTParser from '../../lib/format/ftl/ast/parser';
import FTLEntriesParser from '../../lib/format/ftl/entries/parser';
import { format } from '../../lib/resolver';
import { MockContext } from '../../lib/mocks';

export default {
  MockContext,
  L20nParser,
  FTLASTParser,
  FTLEntriesParser,
  PropertiesParser,
  format
};
