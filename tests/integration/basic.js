var L20n = process.env.L20N_COV ?
  require('../../build/cov/lib/l20n') :
  require('../../lib/l20n');

describe('A single-locale context with addResource', function() {
  'use strict';
  var ctx;
  beforeEach(function(done) {
    ctx = L20n.getContext();
    ctx.ready(done);
    ctx.addResource('                                                         \
      <brandName "Firefox">                                                   \
      <about "About {{ brandName }}">                                         \
      <cert "Certificate signed by {{ $organization }}">                      \
      <brandNoDefault {                                                       \
        short: "Firefox",                                                     \
        long: "Mozilla Firefox"                                               \
      }>                                                                      \
      <brandWithDefault {                                                     \
       *short: "Firefox",                                                     \
        long: "Mozilla Firefox"                                               \
      }>                                                                      \
    ');
    ctx.requestLocales();
  });

  it('should return the string value of brandName', function() {
    var value = ctx.get('brandName');
    value.should.equal('Firefox');
  });
  it('should return the id of foo', function() {
    var value = ctx.get('foo');
    value.should.equal('foo');
  });
  it('should return the value of about with the value of brandName in it', function() {
    var value = ctx.get('about');
    value.should.equal('About Firefox');
  });
  it('should return the value of cert with the value of $organization passed directly', function() {
    var value = ctx.get('cert', {'organization': 'Mozilla Foundation'});
    value.should.equal('Certificate signed by Mozilla Foundation');
  });
  it('should return the value of cert with the value of $organization defined globally', function() {
    ctx.updateData({ organization: 'Mozilla Foundation' });
    var value = ctx.get('cert');
    value.should.equal('Certificate signed by Mozilla Foundation');
  });
  it('should return the id of brandNoDefault', function() {
    var value = ctx.get('brandNoDefault');
    value.should.equal('brandNoDefault');
  });
  it('should return the short value of brandWithDefault', function() {
    var value = ctx.get('brandWithDefault');
    value.should.equal('Firefox');
  });

});

describe('A single-locale context with linkResource', function() {
  'use strict';
  var ctx;
  beforeEach(function(done) {
    ctx = L20n.getContext();
    ctx.ready(done);
    ctx.linkResource(__dirname + '/fixtures/basic/single.lol');
    ctx.requestLocales();
  });

  it('should return the string value of brandName', function() {
    var value = ctx.get('brandName');
    value.should.equal('Firefox');
  });
  it('should return the id of foo', function() {
    var value = ctx.get('foo');
    value.should.equal('foo');
  });
  it('should return the value of about with the value of brandName in it', function() {
    var value = ctx.get('about');
    value.should.equal('About Firefox');
  });
  it('should return the value of cert with the value of $organization passed directly', function() {
    var value = ctx.get('cert', {'organization': 'Mozilla Foundation'});
    value.should.equal('Certificate signed by Mozilla Foundation');
  });
  it('should return the value of cert with the value of $organization defined globally', function() {
    ctx.updateData({ organization: 'Mozilla Foundation' });
    var value = ctx.get('cert');
    value.should.equal('Certificate signed by Mozilla Foundation');
  });
  it('should return the id of brandNoDefault', function() {
    var value = ctx.get('brandNoDefault');
    value.should.equal('brandNoDefault');
  });
  it('should return the short value of brandWithDefault', function() {
    var value = ctx.get('brandWithDefault');
    value.should.equal('Firefox');
  });

});

