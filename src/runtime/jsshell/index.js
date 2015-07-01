'use strict';

import L20nParser from '../../lib/format/l20n/parser';
import { format } from '../../lib/resolver';
import { createEntriesFromAST, MockContext } from '../../lib/mocks';

this.L20n = {
  MockContext,
  L20nParser,
  createEntriesFromAST,
  format
};
