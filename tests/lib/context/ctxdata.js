var Context = process.env.L20N_COV ?
  require('../../../build/cov/lib/l20n/context').Context :
  require('../../../lib/l20n/context').Context;

function whenReady(ctx, callback) {
  'use strict';
  ctx.addEventListener('ready', function onReady() {
    ctx.removeEventListener('ready', onReady);
    callback();
  });
}

describe('ctx.updateData', function() {
  'use strict';

  // jsHint incorrectly claims function expressions on which the property
  // is accessed just after its definition doesn't require parens;
  // ignore this warning.
  /* jshint -W068 */

  var ctx = new Context();
  ctx.addResource('                                                           \
    <foo "{{ $foo }}">                                                        \
    <bar "{{ $bar }}">                                                        \
    <barBar "{{ $bar.bar }}">                                                 \
    <barBaz "{{ $bar.baz }}">                                                 \
    <barBazQux "{{ $bar.baz.qux }}">                                          \
  ');

  before(function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });

  it('when absent, all testing entities don\'t work', function() {
    ctx.getSync('foo').should.equal('{{ $foo }}');
    ctx.getSync('bar').should.equal('{{ $bar }}');
    ctx.getSync('barBar').should.equal('{{ $bar.bar }}');
    ctx.getSync('barBaz').should.equal('{{ $bar.baz }}');
    ctx.getSync('barBazQux').should.equal('{{ $bar.baz.qux }}');
  });
  it('should throw if the argument is not an object', function() {
    (function() {
      ctx.updateData();
    }).should.throw(/non-null object/);
  });
  it('should not throw if the passed object is empty', function() {
    (function() {
      ctx.updateData({});
    }).should.not.throw();
  });
  it('set foo', function() {
    ctx.updateData({
      foo: 'F'
    });
    ctx.getSync('foo').should.equal('F');
  });
  it('update foo, set bar', function() {
    ctx.updateData({
      foo: 'Foo',
      bar: 'B'
    });
    ctx.getSync('foo').should.equal('Foo');
    ctx.getSync('bar').should.equal('B');
  });
  it('update bar', function() {
    ctx.updateData({
      bar: 'Bar'
    });
    ctx.getSync('foo').should.equal('Foo');
    ctx.getSync('bar').should.equal('Bar');
  });
  it('update bar to a dict', function() {
    ctx.updateData({
      bar: {
        bar: 'BarBar'
      }
    });
    ctx.getSync('bar').should.equal('{{ $bar }}');
    ctx.getSync('barBar').should.equal('BarBar');
  });
  it('add a member to bar', function() {
    ctx.updateData({
      bar: {
        baz: 'BarBaz'
      }
    });
    ctx.getSync('barBar').should.equal('BarBar');
    ctx.getSync('barBaz').should.equal('BarBaz');
  });
  it('remove bar.baz', function() {
    ctx.updateData({
      bar: {
        baz: undefined
      }
    });
    ctx.getSync('barBar').should.equal('BarBar');
    ctx.getSync('barBaz').should.equal('{{ $bar.baz }}');
  });
  it('update bar to a string', function() {
    ctx.updateData({
      bar: 'Bar'
    });
    ctx.getSync('foo').should.equal('Foo');
    ctx.getSync('bar').should.equal('Bar');
  });
  it('update bar to a dict again', function() {
    ctx.updateData({
      bar: {
        bar: 'BarBar',
        baz: 'BarBaz'
      }
    });
    ctx.getSync('barBar').should.equal('BarBar');
    ctx.getSync('barBaz').should.equal('BarBaz');
  });
  it('update bar.baz to a dict', function() {
    ctx.updateData({
      bar: {
        baz: {
          qux: 'BarBazQux'
        }
      }
    });
    ctx.getSync('barBar').should.equal('BarBar');
    ctx.getSync('barBaz').should.equal('{{ $bar.baz }}');
    ctx.getSync('barBazQux').should.equal('BarBazQux');
  });
  it('remove bar.baz.qux', function() {
    ctx.updateData({
      bar: {
        baz: {
          qux: undefined
        }
      }
    });
    ctx.getSync('barBar').should.equal('BarBar');
    ctx.getSync('barBaz').should.equal('{{ $bar.baz }}');
    ctx.getSync('barBazQux').should.equal('{{ $bar.baz.qux }}');
  });
  it('remove bar', function() {
    ctx.updateData({
      bar: undefined
    });
    ctx.getSync('foo').should.equal('Foo');
    ctx.getSync('bar').should.equal('{{ $bar }}');
    ctx.getSync('barBar').should.equal('{{ $bar.bar }}');
    ctx.getSync('barBaz').should.equal('{{ $bar.baz }}');
    ctx.getSync('barBazQux').should.equal('{{ $bar.baz.qux }}');
  });
});

describe('ctx.getSync with ctxdata passed directly', function() {
  'use strict';
  var ctx = new Context();
  ctx.updateData({
    foo: 'Foo',
    user: {
      name: 'Bob',
      gender: 'masculine'
    }
  });
  ctx.addResource('                                                           \
    <foo "{{ $foo }}">                                                        \
    <fooBar "{{ $foo.bar }}">                                                 \
    <userName "{{ $user.name }}">                                             \
    <userGender "{{ $user.gender }}">                                         \
  ');

  before(function(done) {
    whenReady(ctx, done);
    ctx.requestLocales();
  });

  it('does nothing if no data is paased', function() {
    ctx.getSync('foo').should.equal('Foo');
    ctx.getSync('userName').should.equal('Bob');
    ctx.getSync('userGender').should.equal('masculine');
  });
  it('overrides the global primitive value', function() {
    ctx.getSync('foo', { foo: 'Bar' }).should.equal('Bar');
    ctx.getSync('foo').should.equal('Foo');
    ctx.getSync('userName').should.equal('Bob');
    ctx.getSync('userGender').should.equal('masculine');
  });
  it('adds a new object', function() {
    ctx.getSync('fooBar').should.equal('{{ $foo.bar }}');
    ctx.getSync('foo', { foo: { bar: 'Bar' } }).should.equal('{{ $foo }}');
    ctx.getSync('fooBar', { foo: { bar: 'FooBar' } }).should.equal('FooBar');
    ctx.getSync('foo').should.equal('Foo');
  });
  it('overrides the global second-level primitive value', function() {
    ctx.getSync('userName', { user: { name: 'Ben' } }).should.equal('Ben');
    ctx.getSync('userName').should.equal('Bob');
  });
  it('does not change other second-level members', function() {
    ctx.getSync('userName', { user: { name: 'Ben' } }).should.equal('Ben');
    ctx.getSync('userGender', { user: { name: 'Ben' } }).should.equal('masculine');
  });
  it('removes second-level members, but only locally', function() {
    ctx.getSync('userName', {
      user: {
        name: undefined
      }
    }).should.equal('{{ $user.name }}');
    ctx.getSync('userName').should.equal('Bob');
  });
  it('removes first-level members, but only locally', function() {
    ctx.getSync('userName', { user: undefined }).should.equal('{{ $user.name }}');
    ctx.getSync('userName').should.equal('Bob');
    ctx.getSync('userGender').should.equal('masculine');
  });
});

describe('Object.prototype manipulation', function() {
  'use strict';
  var ctx = new Context();
  ctx.addResource('                                                           \
    <foo "{{ $foo }}">                                                        \
    <bar "{{ $bar }}">                                                        \
  ');

  before(function(done) {
    Object.prototype.bar = 'Bar';
    whenReady(ctx, done);
    ctx.requestLocales();
  });
  after(function() {
    delete Object.prototype.bar;
  });

  it('neither $foo nor $bar are defined', function() {
    ctx.getSync('foo').should.equal('{{ $foo }}');
    ctx.getSync('bar').should.equal('{{ $bar }}');
  });
  it('after updateData(), only $foo is defined', function() {
    ctx.updateData({ foo: 'Foo' });
    ctx.getSync('foo').should.equal('Foo');
    ctx.getSync('bar').should.equal('{{ $bar }}');
  });
  it('when passed directly, only $foo is defined', function() {
    ctx.getSync('foo', { foo: 'Foo' }).should.equal('Foo');
    ctx.getSync('bar', { foo: 'Foo' }).should.equal('{{ $bar }}');
  });
});
