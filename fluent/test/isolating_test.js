'use strict';

import assert from 'assert';
import ftl from "@fluent/dedent";

import FluentBundle from '../src/bundle';
import FluentResource from '../src/resource';

// Unicode bidi isolation characters.
const FSI = '\u2068';
const PDI = '\u2069';

suite('Isolating interpolations', function(){
  let bundle, args, errs;

  suiteSetup(function() {
    bundle = new FluentBundle('en-US');
    bundle.addResource(new FluentResource(ftl`
      foo = Foo
      bar = { foo } Bar
      baz = { $arg } Baz
      qux = { bar } { baz }
      `));
  });

  setup(function() {
    errs = [];
  });

  test('isolates interpolated message references', function(){
    const msg = bundle.getMessage('bar');
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, `${FSI}Foo${PDI} Bar`);
    assert.strictEqual(errs.length, 0);
  });

  test('isolates interpolated string-typed variables', function(){
    const msg = bundle.getMessage('baz');
    const val = bundle.formatPattern(msg.value, {arg: 'Arg'}, errs);
    assert.strictEqual(val, `${FSI}Arg${PDI} Baz`);
    assert.strictEqual(errs.length, 0);
  });

  test('isolates interpolated number-typed variables', function(){
    const msg = bundle.getMessage('baz');
    const val = bundle.formatPattern(msg.value, {arg: 1}, errs);
    assert.strictEqual(val, `${FSI}1${PDI} Baz`);
    assert.strictEqual(errs.length, 0);
  });

  test('isolates interpolated date-typed variables', function(){
    const dtf = new Intl.DateTimeFormat('en-US');
    const arg = new Date('2016-09-29');

    const msg = bundle.getMessage('baz');
    const val = bundle.formatPattern(msg.value, {arg}, errs);
    // format the date argument to account for the testrunner's timezone
    assert.strictEqual(val, `${FSI}${dtf.format(arg)}${PDI} Baz`);
    assert.strictEqual(errs.length, 0);
  });

  test('isolates complex interpolations', function(){
    const msg = bundle.getMessage('qux');
    const val = bundle.formatPattern(msg.value, {arg: 'Arg'}, errs);

    const expected_bar = `${FSI}${FSI}Foo${PDI} Bar${PDI}`;
    const expected_baz = `${FSI}${FSI}Arg${PDI} Baz${PDI}`;
    assert.strictEqual(val, `${expected_bar} ${expected_baz}`);
    assert.strictEqual(errs.length, 0);
  });
});

suite('Skip isolation cases', function(){
  let bundle, args, errs;

  suiteSetup(function() {
    bundle = new FluentBundle('en-US');
    bundle.addResource(new FluentResource(ftl`
      -brand-short-name = Amaya
      foo = { -brand-short-name }
      `));
  });

  setup(function() {
    errs = [];
  });

  test('skips isolation if the only element is a placeable', function(){
    const msg = bundle.getMessage('foo');
    const val = bundle.formatPattern(msg.value, args, errs);
    assert.strictEqual(val, `Amaya`);
    assert.strictEqual(errs.length, 0);
  });
});
