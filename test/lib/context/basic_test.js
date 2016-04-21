'use strict';

import assert from 'assert';
import { isolate as i } from '../util';
import { Env } from '../../../src/lib/env';
import { fetchResource } from '../../../src/runtime/node/io';

const path = __dirname + '/..';
const langs = [
  { code: 'en-US', src: 'app' },
];


describe('A simple context with one resource', function() {
  describe('ctx.formatEntities', function() {
    var env, ctx;

    beforeEach(function(done) {
      env = new Env(fetchResource);
      ctx = env.createContext(langs, [path + '/fixtures/basic.properties']);
      ctx.fetch().then(() => done(), done);
    });

    it('should return the string value of brandName', function(done) {
      ctx.formatEntities('brandName').then(function([{value}]) {
        assert.strictEqual(value, 'Firefox');
      }).then(done, done);
    });

    it('should return the value of about with the value' +
       ' of brandName in it', function(done) {
      ctx.formatEntities('about').then(function([{value}]) {
        assert.strictEqual(value, i('About Firefox', 'Firefox'));
      }).then(done, done);
    });

    it('should return the value of cert with the value of ' +
       'organization passed directly', function(done) {
      var args = {organization: 'Mozilla Foundation'};
      ctx.formatEntities(['cert', args]).then(function([{value}]) {
        assert.strictEqual(
          value,
          i('Certificate signed by Mozilla Foundation', 'Mozilla Foundation'));
      }).then(done, done);
    });

    it('should return the correct plural form for 0', function(done) {
      var args = {unread: 0};
      ctx.formatEntities(['unreadMessages', args]).then(
        function([{value}]) {
          assert.strictEqual(value, '0 unread');
        }
      ).then(done, done);
    });

    it('should return the correct plural form for 1', function(done) {
      var args = {unread: 1};
      ctx.formatEntities(['unreadMessages', args]).then(
        function([{value}]) {
          assert.strictEqual(value, 'One unread');
        }
      ).then(done, done);
    });

    it('should return the correct plural form for 2', function(done) {
      var args = {unread: 2};
      ctx.formatEntities(['unreadMessages', args]).then(
        function([{value}]) {
          assert.strictEqual(value, '2 unread');
        }
      ).then(done, done);
    });

    it('should return the correct plural form for 3', function(done) {
      var args = {unread: 3};
      ctx.formatEntities(['unreadMessages', args]).then(
        function([{value}]) {
          assert.strictEqual(value, '3 unread');
        }
      ).then(done, done);
    });

    it('should return ID for missing string', function(done) {
      ctx.formatEntities('missingId').then(
        function([{value, attrs}]) {
          assert.strictEqual(value, 'missingId');
          assert.strictEqual(attrs, null);
        }
      ).then(done, done);
    });

    it('should return for many', function(done) {
      ctx.formatEntities('brandName', 'about').then(
        function([brandName, about]) {
          assert.deepEqual(brandName, {value: 'Firefox', attrs: null});
          assert.deepEqual(about,
            {value: i('About Firefox', 'Firefox'), attrs: null});
        }
      ).then(done, done);
    });

    it('should return for many including a missing one', function(done) {
      ctx.formatEntities('brandName', 'missingId', 'about').then(
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
      ctx.formatEntities(
        'brandName', ['unreadMessages', args], 'about'
      ).then(function([brandName, unreadMessages, about]) {
        assert.deepEqual(brandName, {value: 'Firefox', attrs: null});
        assert.deepEqual(unreadMessages, {value: 'One unread', attrs: null});
        assert.deepEqual(about,
          {value: i('About Firefox', 'Firefox'), attrs: null});
      }).then(done, done);
    });

    it('should return for many id/args pairs', function(done) {
      ctx.formatEntities(
        ['unreadMessages', {unread: 0}],
        ['unreadMessages', {unread: 1}]
      ).then(function([unread0, unread1]) {
        assert.deepEqual(unread0, {value: '0 unread', attrs: null});
        assert.deepEqual(unread1, {value: 'One unread', attrs: null});
      }).then(done, done);
    });
  });
  describe('ctx.formatValues', function() {
    var env, ctx;

    beforeEach(function(done) {
      env = new Env(fetchResource);
      ctx = env.createContext(langs, [path + '/fixtures/basic.properties']);
      ctx.fetch().then(() => done(), done);
    });

    it('should return the string value of brandName', function(done) {
      ctx.formatValues('brandName').then(function([value]) {
        assert.strictEqual(value, 'Firefox');
      }).then(done, done);
    });

    it('should return the value of about with the value' +
       ' of brandName in it', function(done) {
      ctx.formatValues('about').then(function([value]) {
        assert.strictEqual(value, i('About Firefox', ['Firefox']));
      }).then(done, done);
    });

    it('should return the value of cert with the value of ' +
       'organization passed directly', function(done) {
      var args = {organization: 'Mozilla Foundation'};
      ctx.formatValues(['cert', args]).then(function([value]) {
        assert.strictEqual(
          value,
          i('Certificate signed by Mozilla Foundation', 'Mozilla Foundation'));
      }).then(done, done);
    });

    it('should return the correct plural form for 1', function(done) {
      var args = {unread: 1};
      ctx.formatValues(['unreadMessages', args]).then(
        function([value]) {
          assert.strictEqual(value, 'One unread');
        }
      ).then(done, done);
    });

    it('should return for missing string', function(done) {
      ctx.formatValues('missingId').then(function([value]) {
        assert.strictEqual(value, 'missingId');
      }).then(done, done);
    });

    it('should return for many', function(done) {
      ctx.formatValues(
        'brandName', 'about'
      ).then(function([brandName, about]) {
        assert.strictEqual(brandName, 'Firefox');
        assert.strictEqual(about, i('About Firefox', 'Firefox'));
      }).then(done, done);
    });

    it('should return for many including a missing one', function(done) {
      ctx.formatValues(
        'brandName', 'missingId', 'about'
      ).then(function([brandName, missingId, about]) {
        assert.strictEqual(brandName, 'Firefox');
        assert.strictEqual(missingId, 'missingId');
        assert.strictEqual(about, i('About Firefox', 'Firefox'));
      }).then(done, done);
    });

    it('should return for many including an id/args pair', function(done) {
      var args = {unread: 1};
      ctx.formatValues(
        'brandName', ['unreadMessages', args], 'about'
      ).then(function([brandName, unreadMessages, about]) {
        assert.strictEqual(brandName, 'Firefox');
        assert.strictEqual(unreadMessages, 'One unread');
        assert.strictEqual(about, i('About Firefox', 'Firefox'));
      }).then(done, done);
    });

    it('should return for many id/args pairs', function(done) {
      ctx.formatValues(
        ['unreadMessages', {unread: 0}],
        ['unreadMessages', {unread: 1}]
      ).then(function([unread0, unread1]) {
        assert.strictEqual(unread0, '0 unread');
        assert.strictEqual(unread1, 'One unread');
      }).then(done, done);
    });
  });
});
