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
    ctx.get('foo').should.equal('{{ $foo }}');
    ctx.get('bar').should.equal('{{ $bar }}');
    ctx.get('barBar').should.equal('{{ $bar.bar }}');
    ctx.get('barBaz').should.equal('{{ $bar.baz }}');
    ctx.get('barBazQux').should.equal('{{ $bar.baz.qux }}');
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
    ctx.get('foo').should.equal('F');
  });
  it('update foo, set bar', function() {
    ctx.updateData({
      foo: 'Foo',
      bar: 'B'
    });
    ctx.get('foo').should.equal('Foo');
    ctx.get('bar').should.equal('B');
  });
  it('update bar', function() {
    ctx.updateData({
      bar: 'Bar'
    });
    ctx.get('foo').should.equal('Foo');
    ctx.get('bar').should.equal('Bar');
  });
  it('update bar to a dict', function() {
    ctx.updateData({
      bar: {
        bar: 'BarBar'
      }
    });
    ctx.get('bar').should.equal('{{ $bar }}');
    ctx.get('barBar').should.equal('BarBar');
  });
  it('add a member to bar', function() {
    ctx.updateData({
      bar: {
        baz: 'BarBaz'
      }
    });
    ctx.get('barBar').should.equal('BarBar');
    ctx.get('barBaz').should.equal('BarBaz');
  });
  it('remove bar.baz', function() {
    ctx.updateData({
      bar: {
        baz: undefined
      }
    });
    ctx.get('barBar').should.equal('BarBar');
    ctx.get('barBaz').should.equal('{{ $bar.baz }}');
  });
  it('update bar to a string', function() {
    ctx.updateData({
      bar: 'Bar'
    });
    ctx.get('foo').should.equal('Foo');
    ctx.get('bar').should.equal('Bar');
  });
  it('update bar to a dict again', function() {
    ctx.updateData({
      bar: {
        bar: 'BarBar',
        baz: 'BarBaz'
      }
    });
    ctx.get('barBar').should.equal('BarBar');
    ctx.get('barBaz').should.equal('BarBaz');
  });
  it('update bar.baz to a dict', function() {
    ctx.updateData({
      bar: {
        baz: {
          qux: 'BarBazQux'
        }
      }
    });
    ctx.get('barBar').should.equal('BarBar');
    ctx.get('barBaz').should.equal('{{ $bar.baz }}');
    ctx.get('barBazQux').should.equal('BarBazQux');
  });
  it('remove bar.baz.qux', function() {
    ctx.updateData({
      bar: {
        baz: {
          qux: undefined
        }
      }
    });
    ctx.get('barBar').should.equal('BarBar');
    ctx.get('barBaz').should.equal('{{ $bar.baz }}');
    ctx.get('barBazQux').should.equal('{{ $bar.baz.qux }}');
  });
  it('remove bar', function() {
    ctx.updateData({
      bar: undefined
    });
    ctx.get('foo').should.equal('Foo');
    ctx.get('bar').should.equal('{{ $bar }}');
    ctx.get('barBar').should.equal('{{ $bar.bar }}');
    ctx.get('barBaz').should.equal('{{ $bar.baz }}');
    ctx.get('barBazQux').should.equal('{{ $bar.baz.qux }}');
  });
});

describe('ctx.get with ctxdata passed directly', function() {
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
    ctx.get('foo').should.equal('Foo');
    ctx.get('userName').should.equal('Bob');
    ctx.get('userGender').should.equal('masculine');
  });
  it('overrides the global primitive value', function() {
    ctx.get('foo', { foo: 'Bar' }).should.equal('Bar');
    ctx.get('foo').should.equal('Foo');
    ctx.get('userName').should.equal('Bob');
    ctx.get('userGender').should.equal('masculine');
  });
  it('adds a new object', function() {
    ctx.get('fooBar').should.equal('{{ $foo.bar }}');
    ctx.get('foo', { foo: { bar: 'Bar' } }).should.equal('{{ $foo }}');
    ctx.get('fooBar', { foo: { bar: 'FooBar' } }).should.equal('FooBar');
    ctx.get('foo').should.equal('Foo');
  });
  it('overrides the global second-level primitive value', function() {
    ctx.get('userName', { user: { name: 'Ben' } }).should.equal('Ben');
    ctx.get('userName').should.equal('Bob');
  });
  it('does not change other second-level members', function() {
    ctx.get('userName', { user: { name: 'Ben' } }).should.equal('Ben');
    ctx.get('userGender', { user: { name: 'Ben' } }).should.equal('masculine');
  });
  it('removes second-level members, but only locally', function() {
    ctx.get('userName', {
      user: {
        name: undefined
      }
    }).should.equal('{{ $user.name }}');
    ctx.get('userName').should.equal('Bob');
  });
  it('removes first-level members, but only locally', function() {
    ctx.get('userName', { user: undefined }).should.equal('{{ $user.name }}');
    ctx.get('userName').should.equal('Bob');
    ctx.get('userGender').should.equal('masculine');
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
    ctx.get('foo').should.equal('{{ $foo }}');
    ctx.get('bar').should.equal('{{ $bar }}');
  });
  it('after updateData(), only $foo is defined', function() {
    ctx.updateData({ foo: 'Foo' });
    ctx.get('foo').should.equal('Foo');
    ctx.get('bar').should.equal('{{ $bar }}');
  });
  it('when passed directly, only $foo is defined', function() {
    ctx.get('foo', { foo: 'Foo' }).should.equal('Foo');
    ctx.get('bar', { foo: 'Foo' }).should.equal('{{ $bar }}');
  });
});
