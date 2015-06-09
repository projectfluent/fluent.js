/* global assert:true, it, describe, beforeEach */
/* global navigator, __dirname */
'use strict';

if (typeof navigator !== 'undefined') {
  var L20n = navigator.mozL10n._getInternalAPI();
  var path =
    'app://sharedtest.gaiamobile.org/test/unit/l10n/lib';
} else {
  var assert = require('assert');
  var L20n = {
    Env: require('../../../src/lib/env'),
    io: require('../../../src/runtime/node/io')
  };
  var path = __dirname + '/..';
}

var fetch = L20n.io.fetch.bind(L20n.io);
var langs = [
  { code: 'en-US', src: 'app', dir: 'ltr' },
];


describe('A simple context with one resource', function() {
  var env, ctx;

  beforeEach(function() {
    env = new L20n.Env('en-US', fetch);
    ctx = env.createContext([path + '/fixtures/basic.properties']);
  });

  it('should return the string value of brandName', function(done) {
    ctx.formatValue(langs, 'brandName').then(function(value) {
      assert.strictEqual(value, 'Firefox');
    }).then(done, done);
  });

  it('should return the value of about with the value' +
     ' of brandName in it', function(done) {
    ctx.formatValue(langs, 'about').then(function(value) {
      assert.strictEqual(value, 'About Firefox');
    }).then(done, done);
  });

  it('should return the value of cert with the value of ' +
     'organization passed directly', function(done) {
    var args = {organization: 'Mozilla Foundation'};
    ctx.formatValue(langs, 'cert', args).then(function(value) {
      assert.strictEqual(value, 'Certificate signed by Mozilla Foundation');
    }).then(done, done);
  });

  it('should return the correct plural form for 0', function(done) {
    var args = {unread: 0};
    ctx.formatValue(langs, 'unreadMessages', args).then(function(value) {
      assert.strictEqual(value, '0 unread');
    }).then(done, done);
  });

  it('should return the correct plural form for 1', function(done) {
    var args = {unread: 1};
    ctx.formatValue(langs, 'unreadMessages', args).then(function(value) {
      assert.strictEqual(value, 'One unread');
    }).then(done, done);
  });

  it('should return the correct plural form for 2', function(done) {
    var args = {unread: 2};
    ctx.formatValue(langs, 'unreadMessages', args).then(function(value) {
      assert.strictEqual(value, '2 unread');
    }).then(done, done);
  });

  it('should return the correct plural form for 3', function(done) {
    var args = {unread: 3};
    ctx.formatValue(langs, 'unreadMessages', args).then(function(value) {
      assert.strictEqual(value, '3 unread');
    }).then(done, done);
  });
});
