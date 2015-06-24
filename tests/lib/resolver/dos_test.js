/* global it, before, describe */
/* jshint -W101 */
'use strict';

import assert from 'assert';
import { format, createEntries } from './header';
import { MockContext } from './header';

// Bug 803931 - Compiler is vulnerable to the billion laughs attack

describe('Billion Laughs', function(){
  var entries, ctx;

  before(function() {
    entries = createEntries([
      'lol0=LOL',
      'lol1={{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}} {{lol0}}',
      'lol2={{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}} {{lol1}}',
      'lol3={{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}} {{lol2}}',
      // normally, we'd continue with lol4 through lol9 in the same manner,
      // but this would make the test itself dangerous if the guards in the
      // compiler fail.  Given MAX_PLACEABLE_LENGTH of 2500, lol3 is enough
      // to test this.
      'lolz={{ lol3 }}'
    ].join('\n'));
    ctx = new MockContext(entries);
  });

  it('format() throws', function() {
    assert.throws(function() {
      format(ctx, null, entries.lolz);
    }, /too many characters in placeable/i);
  });
});
