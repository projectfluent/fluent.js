import { fetchResource } from '../web/io';
import { Client, broadcast } from '../web/bridge';
import { View } from '../../bindings/html/view';
import { Remote } from '../../bindings/html/remote';

import FTLASTParser from '../../lib/format/ftl/ast/parser';
import FTLEntriesParser from '../../lib/format/ftl/entries/parser';

import { Context } from '../../lib/context';
import { Env } from '../../lib/env';
import { L10nError } from '../../lib/errors';
import { emit, addEventListener, removeEventListener } from '../../lib/events';
import { prioritizeLocales } from '../../lib/intl';
import { MockContext, lang } from '../../lib/mocks';
import { walkEntry, walkValue, pseudo } from '../../lib/pseudo';
import { format } from '../../lib/resolver';

window.L20n = {
  fetchResource, Client, Remote, View, broadcast,
  FTLASTParser, FTLEntriesParser,
  Context, Env, L10nError, emit, addEventListener, removeEventListener,
  prioritizeLocales, MockContext, lang,
  walkEntry, walkValue, pseudo, format
};
