'use strict';

import assert from 'assert';

import FluentBundle from '../src/bundle';
import { ftl } from '../src/util';

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
    const val = bundle.format('foo', {}, errs);
    const attr = bundle.format('foo.bar', {foo: "arg"}, errs);
    assert(val.includes("FAA"));
    assert(attr.includes("BAr"));
    assert(attr.includes("BAz"));
    assert.equal(errs.length, 0);
  });
});
