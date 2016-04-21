import FTLEntriesParser from '../../lib/format/ftl/entries/parser';
import { MockContext, lang } from '../../lib/mocks';
import { format } from '../../lib/resolver';

export default {
  Parser: FTLEntriesParser,
  Context: MockContext,
  format,
  lang
};
