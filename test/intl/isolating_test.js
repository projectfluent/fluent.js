'use strict';

import assert from 'assert';

import { MessageContext } from '../../src/intl/context';
import { ftl } from '../util';

// Unicode bidi isolation characters.
const FSI = '\u2068';
const PDI = '\u2069';

describe('Isolating interpolations', function(){
  let ctx, args, errs;

  before(function() {
    ctx = new MessageContext('en-US');
    ctx.addMessages(ftl`
      foo = Foo
      bar = { foo } Bar
      baz = { $arg } Baz
      qux = { bar } { baz }
    `);
  });

  beforeEach(function() {
    errs = [];
  });

  it('isolates interpolated message references', function(){
    const msg = ctx.messages.get('bar');
    const val = ctx.format(msg, args, errs);
    assert.equal(val, `${FSI}Foo${PDI} Bar`);
    assert.equal(errs.length, 0);
  });

  it('isolates interpolated string-typed external arguments', function(){
    const msg = ctx.messages.get('baz');
    const val = ctx.format(msg, {arg: 'Arg'}, errs);
    assert.equal(val, `${FSI}Arg${PDI} Baz`);
    assert.equal(errs.length, 0);
  });

  it('isolates interpolated number-typed external arguments', function(){
    const msg = ctx.messages.get('baz');
    const val = ctx.format(msg, {arg: 1}, errs);
    assert.equal(val, `${FSI}1${PDI} Baz`);
    assert.equal(errs.length, 0);
  });

  it('isolates interpolated date-typed external arguments', function(){
    const dtf = new Intl.DateTimeFormat('en-US');
    const arg = new Date('2016-09-29');

    const msg = ctx.messages.get('baz');
    const val = ctx.format(msg, {arg}, errs);
    // format the date argument to account for the testrunner's timezone
    assert.equal(val, `${FSI}${dtf.format(arg)}${PDI} Baz`);
    assert.equal(errs.length, 0);
  });

  it('isolates complex interpolations', function(){
    const msg = ctx.messages.get('qux');
    const val = ctx.format(msg, {arg: 'Arg'}, errs);

    const expected_bar = `${FSI}${FSI}Foo${PDI} Bar${PDI}`;
    const expected_baz = `${FSI}${FSI}Arg${PDI} Baz${PDI}`;
    assert.equal(val, `${expected_bar} ${expected_baz}`);
    assert.equal(errs.length, 0);
  });
});
