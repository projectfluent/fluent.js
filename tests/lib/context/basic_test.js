'use strict';

import assert from 'assert';
import { isolate as i } from '../util';
import { Env } from '../../../src/lib/env';
import { fetch } from '../../../src/runtime/node/io';

const path = __dirname + '/..';
const langs = [
  { code: 'en-US', src: 'app' },
];


describe('A simple context with one resource', function() {
  describe('ctx.resolveEntities', function() {
    var env, ctx;

    beforeEach(function(done) {
      env = new Env('en-US', fetch);
      ctx = env.createContext([path + '/fixtures/basic.properties']);
      ctx.fetch(langs).then(() => done(), done);
    });

    it('should return the string value of brandName', function(done) {
      ctx.resolveEntities(langs, ['brandName']).then(function([{value}]) {
        assert.strictEqual(value, 'Firefox');
      }).then(done, done);
    });

    it('should return the value of about with the value' +
       ' of brandName in it', function(done) {
      ctx.resolveEntities(langs, ['about']).then(function([{value}]) {
        assert.strictEqual(value, i('About Firefox', 'Firefox'));
      }).then(done, done);
    });

    it('should return the value of cert with the value of ' +
       'organization passed directly', function(done) {
      var args = {organization: 'Mozilla Foundation'};
      ctx.resolveEntities(langs, [['cert', args]]).then(function([{value}]) {
        assert.strictEqual(
          value,
          i('Certificate signed by Mozilla Foundation', 'Mozilla Foundation'));
      }).then(done, done);
    });

    it('should return the correct plural form for 0', function(done) {
      var args = {unread: 0};
      ctx.resolveEntities(langs, [['unreadMessages', args]]).then(
        function([{value}]) {
          assert.strictEqual(value, '0 unread');
        }
      ).then(done, done);
    });

    it('should return the correct plural form for 1', function(done) {
      var args = {unread: 1};
      ctx.resolveEntities(langs, [['unreadMessages', args]]).then(
        function([{value}]) {
          assert.strictEqual(value, 'One unread');
        }
      ).then(done, done);
    });

    it('should return the correct plural form for 2', function(done) {
      var args = {unread: 2};
      ctx.resolveEntities(langs, [['unreadMessages', args]]).then(
        function([{value}]) {
          assert.strictEqual(value, '2 unread');
        }
      ).then(done, done);
    });

    it('should return the correct plural form for 3', function(done) {
      var args = {unread: 3};
      ctx.resolveEntities(langs, [['unreadMessages', args]]).then(
        function([{value}]) {
          assert.strictEqual(value, '3 unread');
        }
      ).then(done, done);
    });

    it('should return ID for missing string', function(done) {
      ctx.resolveEntities(langs, ['missingId']).then(
        function([{value, attrs}]) {
          assert.strictEqual(value, 'missingId');
          assert.strictEqual(attrs, null);
        }
      ).then(done, done);
    });

    it('should return for many', function(done) {
      ctx.resolveEntities(langs, ['brandName', 'about']).then(
        function([brandName, about]) {
          assert.deepEqual(brandName, {value: 'Firefox', attrs: null});
          assert.deepEqual(about,
            {value: i('About Firefox', 'Firefox'), attrs: null});
        }
      ).then(done, done);
    });

    it('should return for many including a missing one', function(done) {
      ctx.resolveEntities(langs, ['brandName', 'missingId', 'about']).then(
        function([brandName, missingId, about]) {
          assert.deepEqual(brandName, {value: 'Firefox', attrs: null});
          assert.deepEqual(missingId, {value: 'missingId', attrs: null});
          assert.deepEqual(about,
            {value: i('About Firefox', 'Firefox'), attrs: null});
        }
      ).then(done, done);
    });

    it('should return for many including an id/args pair', function(done) {
      var args = {unread: 1};
      ctx.resolveEntities(langs, [
        'brandName',
        ['unreadMessages', args],
        'about']).then(function([brandName, unreadMessages, about]) {
          assert.deepEqual(brandName, {value: 'Firefox', attrs: null});
          assert.deepEqual(unreadMessages, {value: 'One unread', attrs: null});
          assert.deepEqual(about,
            {value: i('About Firefox', 'Firefox'), attrs: null});
        }
      ).then(done, done);
    });

    it('should return for many id/args pairs', function(done) {
      ctx.resolveEntities(langs, [
        ['unreadMessages', {unread: 0}],
        ['unreadMessages', {unread: 1}]]).then(
        function([unread0, unread1]) {
          assert.deepEqual(unread0, {value: '0 unread', attrs: null});
          assert.deepEqual(unread1, {value: 'One unread', attrs: null});
        }
      ).then(done, done);
    });
  });
  describe('ctx.resolveValues', function() {
    var env, ctx;

    beforeEach(function(done) {
      env = new Env('en-US', fetch);
      ctx = env.createContext([path + '/fixtures/basic.properties']);
      ctx.fetch(langs).then(() => done(), done);
    });

    it('should return the string value of brandName', function(done) {
      ctx.resolveValues(langs, ['brandName']).then(function([value]) {
        assert.strictEqual(value, 'Firefox');
      }).then(done, done);
    });

    it('should return the value of about with the value' +
       ' of brandName in it', function(done) {
      ctx.resolveValues(langs, ['about']).then(function([value]) {
        assert.strictEqual(value, i('About Firefox', ['Firefox']));
      }).then(done, done);
    });

    it('should return the value of cert with the value of ' +
       'organization passed directly', function(done) {
      var args = {organization: 'Mozilla Foundation'};
      ctx.resolveValues(langs, [['cert', args]]).then(function([value]) {
        assert.strictEqual(
          value,
          i('Certificate signed by Mozilla Foundation', 'Mozilla Foundation'));
      }).then(done, done);
    });

    it('should return the correct plural form for 1', function(done) {
      var args = {unread: 1};
      ctx.resolveValues(langs, [['unreadMessages', args]]).then(
        function([value]) {
          assert.strictEqual(value, 'One unread');
        }
      ).then(done, done);
    });

    it('should return for missing string', function(done) {
      ctx.resolveValues(langs, ['missingId']).then(function([value]) {
        assert.strictEqual(value, 'missingId');
      }).then(done, done);
    });

    it('should return for many', function(done) {
      ctx.resolveValues(langs, ['brandName', 'about']).then(
        function([brandName, about]) {
          assert.strictEqual(brandName, 'Firefox');
          assert.strictEqual(about, i('About Firefox', 'Firefox'));
        }
      ).then(done, done);
    });

    it('should return for many including a missing one', function(done) {
      ctx.resolveValues(langs, ['brandName', 'missingId', 'about']).then(
        function([brandName, missingId, about]) {
          assert.strictEqual(brandName, 'Firefox');
          assert.strictEqual(missingId, 'missingId');
          assert.strictEqual(about, i('About Firefox', 'Firefox'));
        }
      ).then(done, done);
    });

    it('should return for many including an id/args pair', function(done) {
      var args = {unread: 1};
      ctx.resolveValues(langs, [
        'brandName',
        ['unreadMessages', args],
        'about']).then(function([brandName, unreadMessages, about]) {
          assert.strictEqual(brandName, 'Firefox');
          assert.strictEqual(unreadMessages, 'One unread');
          assert.strictEqual(about, i('About Firefox', 'Firefox'));
        }
      ).then(done, done);
    });

    it('should return for many id/args pairs', function(done) {
      ctx.resolveValues(langs, [
        ['unreadMessages', {unread: 0}],
        ['unreadMessages', {unread: 1}]]).then(
        function([unread0, unread1]) {
          assert.strictEqual(unread0, '0 unread');
          assert.strictEqual(unread1, 'One unread');
        }
      ).then(done, done);
    });
  });
});
