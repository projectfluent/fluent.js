import { fetchResource } from '../web/io';
import { Client, broadcast } from '../web/bridge';
import { View } from '../../bindings/html/view';
import { Remote } from '../../bindings/html/remote';

import ASTParser from '../../lib/format/l20n/ast/parser';
import ASTSerializer from '../../lib/format/l20n/ast/serializer';
import EntriesParser from '../../lib/format/l20n/entries/parser';
import EntriesSerializer from '../../lib/format/l20n/entries/serializer';
import PropertiesParser from '../../lib/format/properties/parser';
import FTLASTParser from '../../lib/format/ftl/ast/parser';

import { Context } from '../../lib/context';
import { Env } from '../../lib/env';
import { L10nError } from '../../lib/errors';
import { emit, addEventListener, removeEventListener } from '../../lib/events';
import { prioritizeLocales } from '../../lib/intl';
import {
  createEntriesFromSource, createEntriesFromAST, MockContext, lang
} from '../../lib/mocks';
import { getPluralRule } from '../../lib/plurals';
import { walkEntry, walkValue, pseudo } from '../../lib/pseudo';
import { format } from '../../lib/resolver';

window.L20n = {
  fetchResource, Client, Remote, View, broadcast,
  ASTParser, ASTSerializer, EntriesParser, EntriesSerializer, PropertiesParser,
  FTLASTParser,
  Context, Env, L10nError, emit, addEventListener, removeEventListener,
  prioritizeLocales, MockContext, lang, getPluralRule, walkEntry, walkValue,
  createEntriesFromSource, createEntriesFromAST, pseudo, format
};
