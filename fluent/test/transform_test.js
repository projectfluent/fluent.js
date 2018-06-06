'use strict';

import assert from 'assert';

import { MessageContext } from '../src/context';
import { ftl } from '../src/util';

suite('Transformations', function(){
  let ctx, errs;

  suiteSetup(function() {
    ctx = new MessageContext('en-US', {
      transform: v => v.replace(/a/g, "A") 
    });
    ctx.addMessages(ftl`
      foo = Faa
          .bar = Bar { $foo } Baz
    `);
  });

  setup(function() {
    errs = [];
  });

  test('transforms strings', function(){
    const msg = ctx.getMessage('foo');
    const val = ctx.format(msg, {}, errs);
    const attr = ctx.format(msg.attrs["bar"], {foo: "arg"}, errs);
    assert(val.includes("FAA"));
    assert(attr.includes("BAr"));
    assert(attr.includes("BAz"));
    assert.equal(errs.length, 0);
  });
});
