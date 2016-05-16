import { fetchResource } from '../web/io';
import { View } from '../../bindings/html/view';

import FTLASTParser from '../../ftl/ast/parser';
import FTLEntriesParser from '../../ftl/entries/parser';
import {createEntriesFromAST} from '../../ftl/entries/transformer';

import { Context, SimpleContext } from '../../lib/context';
import { L10nError } from '../../lib/errors';

import { MessageContext } from '../../intl/context';
import { prioritizeLocales } from '../../intl/index';

function createSimpleContext(langs, resIds) {
  return SimpleContext.create(fetchResource, langs, resIds);
}

export default {
  Context, SimpleContext, MessageContext, L10nError, View,
  FTLASTParser, FTLEntriesParser, createEntriesFromAST,
  prioritizeLocales, fetchResource, createSimpleContext
};
