'use strict';

import { fetch } from '../web/io';
import { Service } from '../../bindings/html/service';
import { View } from '../../bindings/html/view';
import { Env } from '../../lib/env';
import L20nASTParser from '../../lib/format/l20n/ast/parser';
import L20nASTSerializer from '../../lib/format/l20n/ast/serializer';
import L20nEntriesParser from '../../lib/format/l20n/entries/parser';
import L20nEntriesSerializer from '../../lib/format/l20n/entries/serializer';
import PropertiesParser from '../../lib/format/properties/parser';

export const L20n = {
    Service, View, Env, fetch,
    L20nASTParser, L20nASTSerializer, L20nEntriesParser, L20nEntriesSerializer,
    PropertiesParser,
};
