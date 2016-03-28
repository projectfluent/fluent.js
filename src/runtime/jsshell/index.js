import L20nParser from '../../lib/format/l20n/entries/parser';
import PropertiesParser from '../../lib/format/properties/parser';
import FTLParser from '../../lib/format/ftl/ast/parser';
import {default as FTLEntriesParser } from '../../lib/format/ftl/entries/parser';
import { format } from '../../lib/resolver';
import { MockContext } from '../../lib/mocks';

this.L20n = {
  MockContext,
  L20nParser,
  FTLParser,
  FTLEntriesParser,
  PropertiesParser,
  format
};
