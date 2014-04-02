'use strict';
var assert = require('assert');

var L20n = process.env.L20N_COV
  ? require('../../build/cov/lib/l20n')
  : require('../../lib/l20n');

describe('A simple context with linkResource', function() {
  var ctx;
  beforeEach(function(done) {
    ctx = L20n.getContext();
    ctx.resLinks.push(__dirname + '/fixtures/basic.properties');
    ctx.ready(done);
    ctx.requestLocales('en-US');
  });

  it('should return the string value of brandName', function() {
    var value = ctx.get('brandName');
    assert.strictEqual(value, 'Firefox');
  });
  it('should return the value of about with the value of brandName in it', function() {
    var value = ctx.get('about');
    assert.strictEqual(value, 'About Firefox');
  });
  it('should return the value of cert with the value of organization passed directly', function() {
    var value = ctx.get('cert', {organization: 'Mozilla Foundation'});
    assert.strictEqual(value, 'Certificate signed by Mozilla Foundation');
  });
  it('should return the correct plural form for 0', function() {
    var value = ctx.get('unreadMessages', {unread: 0});
    assert.strictEqual(value, '0 unread');
  });
  it('should return the correct plural form for 1', function() {
    var value = ctx.get('unreadMessages', {unread: 1});
    assert.strictEqual(value, 'One unread');
  });
  it('should return the correct plural form for 2', function() {
    var value = ctx.get('unreadMessages', {unread: 2});
    assert.strictEqual(value, '2 unread');
  });
  it('should return the correct plural form for 3', function() {
    var value = ctx.get('unreadMessages', {unread: 3});
    assert.strictEqual(value, '3 unread');
  });
});

