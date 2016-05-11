import { fetchResource } from '../web/io';
import { View } from '../../bindings/html/view';

import FTLASTParser from '../../lib/format/ftl/ast/parser';
import FTLEntriesParser from '../../lib/format/ftl/entries/parser';
import {createEntriesFromAST} from '../../lib/format/ftl/entries/transformer';

import { Context } from '../../lib/context';
import { Env } from '../../lib/env';
import { L10nError } from '../../lib/errors';
import { prioritizeLocales } from '../../lib/intl';
import { MockContext, lang } from '../../lib/mocks';
import { format } from '../../lib/resolver';

export default {
  fetchResource, View,
  FTLASTParser, FTLEntriesParser, createEntriesFromAST,
  Context, Env, L10nError,
  prioritizeLocales, MockContext, lang,
  format
};
