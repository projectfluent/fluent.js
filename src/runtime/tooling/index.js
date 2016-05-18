import '../../intl/polyfill';

import FTLASTParser from '../../ftl/ast/parser';
import FTLEntriesParser from '../../ftl/entries/parser';
import { createEntriesFromAST } from '../../ftl/entries/transformer';

import { L10nError } from '../../lib/errors';
import { keysFromContext, valueFromContext, entityFromContext }
  from '../../lib/format';

import { fetchResource } from '../web/io';

export default {
  FTLASTParser, FTLEntriesParser, createEntriesFromAST, L10nError,
  keysFromContext, valueFromContext, entityFromContext, fetchResource
};
