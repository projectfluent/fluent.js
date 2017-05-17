'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from './util';

suite('Reference bombs', function() {
  let ctx, args, errs;

  setup(function() {
    errs = [];
  });

  suite('Billion Laughs', function(){
    suiteSetup(function() {
      ctx = new MessageContext('en-US', { useIsolating: false });
      ctx.addMessages(ftl`
        lol0 = LOL
        lol1 = {lol0} {lol0} {lol0} {lol0} {lol0} {lol0} {lol0} {lol0} {lol0} {lol0}
        lol2 = {lol1} {lol1} {lol1} {lol1} {lol1} {lol1} {lol1} {lol1} {lol1} {lol1}
        lol3 = {lol2} {lol2} {lol2} {lol2} {lol2} {lol2} {lol2} {lol2} {lol2} {lol2}
        lol4 = {lol3} {lol3} {lol3} {lol3} {lol3} {lol3} {lol3} {lol3} {lol3} {lol3}
        lol5 = {lol4} {lol4} {lol4} {lol4} {lol4} {lol4} {lol4} {lol4} {lol4} {lol4}
        lol6 = {lol5} {lol5} {lol5} {lol5} {lol5} {lol5} {lol5} {lol5} {lol5} {lol5}
        lol7 = {lol6} {lol6} {lol6} {lol6} {lol6} {lol6} {lol6} {lol6} {lol6} {lol6}
        lol8 = {lol7} {lol7} {lol7} {lol7} {lol7} {lol7} {lol7} {lol7} {lol7} {lol7}
        lol9 = {lol8} {lol8} {lol8} {lol8} {lol8} {lol8} {lol8} {lol8} {lol8} {lol8}
        lolz = {lol9}
      `);
    });

    // XXX Protect the FTL Resolver against the billion laughs attack
    // https://bugzil.la/1307126
    it.skip('does not expand all placeables', function() {
      const msg = ctx.getMessage('lolz');
      const val = ctx.format(msg, args, errs);
      assert.equal(val, '???');
      assert.equal(errs.length, 1);
    });
  });
});
