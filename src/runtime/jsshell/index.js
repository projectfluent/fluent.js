'use strict';

import L20nParser from '../../lib/format/l20n/parser';
import { createEntry } from '../../lib/resolver';

function createEntries(ast) {
  let entries = Object.create(null);

  var lang = {
    code:'en-US',
    src: 'app',
    dir: 'ltr'
  };

  for (var i = 0, node; node = ast[i]; i++) {
    entries[node.$i] = createEntry(node, lang);
  }

  return entries;
}

this.L20n = {
  Parser: L20nParser,
  createEntries: createEntries
};
