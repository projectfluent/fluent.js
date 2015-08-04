'use strict';

import assert from 'assert';
import { isolate as i } from '../util';
import { Env } from '../../../src/lib/env';
import { fetch } from '../../../src/runtime/node/io';

const path = __dirname + '/..';
const langs = [
  { code: 'en-US', src: 'app', dir: 'ltr' },
];


describe('A simple context with one resource', function() {
  var env, ctx;

  beforeEach(function(done) {
    env = new Env('en-US', fetch);
    ctx = env.createContext([path + '/fixtures/basic.properties']);
    ctx.fetch(langs).then(() => done(), done);
  });

  it('should return the string value of brandName', function(done) {
    ctx.resolve(langs, 'brandName').then(function({value}) {
      assert.strictEqual(value, 'Firefox');
    }).then(done, done);
  });

  it('should return the value of about with the value' +
     ' of brandName in it', function(done) {
    ctx.resolve(langs, 'about').then(function({value}) {
      assert.strictEqual(value, i('About Firefox', 'Firefox'));
    }).then(done, done);
  });

  it('should return the value of cert with the value of ' +
     'organization passed directly', function(done) {
    var args = {organization: 'Mozilla Foundation'};
    ctx.resolve(langs, 'cert', args).then(function({value}) {
      assert.strictEqual(
        value,
        i('Certificate signed by Mozilla Foundation', 'Mozilla Foundation'));
    }).then(done, done);
  });

  it('should return the correct plural form for 0', function(done) {
    var args = {unread: 0};
    ctx.resolve(langs, 'unreadMessages', args).then(function({value}) {
      assert.strictEqual(value, i('0 unread', '0'));
    }).then(done, done);
  });

  it('should return the correct plural form for 1', function(done) {
    var args = {unread: 1};
    ctx.resolve(langs, 'unreadMessages', args).then(function({value}) {
      assert.strictEqual(value, 'One unread');
    }).then(done, done);
  });

  it('should return the correct plural form for 2', function(done) {
    var args = {unread: 2};
    ctx.resolve(langs, 'unreadMessages', args).then(function({value}) {
      assert.strictEqual(value, i('2 unread', '2'));
    }).then(done, done);
  });

  it('should return the correct plural form for 3', function(done) {
    var args = {unread: 3};
    ctx.resolve(langs, 'unreadMessages', args).then(function({value}) {
      assert.strictEqual(value, i('3 unread', '3'));
    }).then(done, done);
  });
});
