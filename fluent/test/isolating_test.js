'use strict';

import assert from 'assert';

import FluentBundle from '../src/bundle';
import { ftl } from '../src/util';

// Unicode bidi isolation characters.
const FSI = '\u2068';
const PDI = '\u2069';

suite('Isolating interpolations', function(){
  let bundle, args, errs;

  suiteSetup(function() {
    bundle = new FluentBundle('en-US');
    bundle.addMessages(ftl`
      foo = Foo
      bar = { foo } Bar
      baz = { $arg } Baz
      qux = { bar } { baz }
    `);
  });

  setup(function() {
    errs = [];
  });

  test('isolates interpolated message references', function(){
    const val = bundle.format('bar', args, errs);
    assert.equal(val, `${FSI}Foo${PDI} Bar`);
    assert.equal(errs.length, 0);
  });

  test('isolates interpolated string-typed variables', function(){
    const val = bundle.format('baz', {arg: 'Arg'}, errs);
    assert.equal(val, `${FSI}Arg${PDI} Baz`);
    assert.equal(errs.length, 0);
  });

  test('isolates interpolated number-typed variables', function(){
    const val = bundle.format('baz', {arg: 1}, errs);
    assert.equal(val, `${FSI}1${PDI} Baz`);
    assert.equal(errs.length, 0);
  });

  test('isolates interpolated date-typed variables', function(){
    const dtf = new Intl.DateTimeFormat('en-US');
    const arg = new Date('2016-09-29');

    const val = bundle.format('baz', {arg}, errs);
    // format the date argument to account for the testrunner's timezone
    assert.equal(val, `${FSI}${dtf.format(arg)}${PDI} Baz`);
    assert.equal(errs.length, 0);
  });

  test('isolates complex interpolations', function(){
    const val = bundle.format('qux', {arg: 'Arg'}, errs);

    const expected_bar = `${FSI}${FSI}Foo${PDI} Bar${PDI}`;
    const expected_baz = `${FSI}${FSI}Arg${PDI} Baz${PDI}`;
    assert.equal(val, `${expected_bar} ${expected_baz}`);
    assert.equal(errs.length, 0);
  });
});

suite('Skip isolation cases', function(){
  let bundle, args, errs;

  suiteSetup(function() {
    bundle = new FluentBundle('en-US');
    bundle.addMessages(ftl`
      -brand-short-name = Amaya
      foo = { -brand-short-name }
    `);
  });

  setup(function() {
    errs = [];
  });

  test('skips isolation if the only element is a placeable', function(){
    const val = bundle.format('foo', args, errs);
    assert.equal(val, `Amaya`);
    assert.equal(errs.length, 0);
  });
});
