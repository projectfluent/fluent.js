'use strict';

import assert from 'assert';
import ftl from "@fluent/dedent";

import FluentBundle from '../src/bundle';

suite('Transformations', function(){
  let bundle, errs;

  suiteSetup(function() {
    bundle = new FluentBundle('en-US', {
      transform: v => v.replace(/a/g, "A") 
    });
    bundle.addMessages(ftl`
      foo = Faa
          .bar = Bar { $foo } Baz
      `);
  });

  setup(function() {
    errs = [];
  });

  test('transforms strings', function(){
    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, {}, errs);
    const attr = bundle.formatPattern(msg.attributes["bar"], {foo: "arg"}, errs);
    assert(val.includes("FAA"));
    assert(attr.includes("BAr"));
    assert(attr.includes("BAz"));
    assert.strictEqual(errs.length, 0);
  });
});
