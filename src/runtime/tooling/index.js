import { fetchResource } from '../web/io';
import { View } from '../../bindings/html/view';

import FTLASTParser from '../../lib/format/ftl/ast/parser';
import FTLEntriesParser from '../../lib/format/ftl/entries/parser';
import {createEntriesFromAST} from '../../lib/format/ftl/entries/transformer';

import { Context, SimpleContext } from '../../lib/context';
import { Bundle } from '../../lib/bundle';

import { L10nError } from '../../lib/errors';
import { prioritizeLocales } from '../../lib/shims';

function createSimpleContext(langs, resIds) {
  return SimpleContext.create(fetchResource, langs, resIds);
}

export default {
  Context, SimpleContext, Bundle, L10nError, View,
  FTLASTParser, FTLEntriesParser, createEntriesFromAST,
  prioritizeLocales, fetchResource, createSimpleContext
};
