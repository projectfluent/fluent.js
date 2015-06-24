'use strict';

import assert from 'assert';
import { Env } from '../../../src/lib/env';
import { fetch } from '../../../src/runtime/node/io';

const path = __dirname + '/..';
const langs = [
  { code: 'pl', src: 'app', dir: 'ltr' },
  { code: 'en-US', src: 'app', dir: 'ltr' },
];

function assertPromise(promise, expected, done) {
  promise.then(function(value) {
    assert.strictEqual(value, expected);
  }).then(done, done);
}

describe('One fallback locale', function() {
  var env, ctx;

  beforeEach(function() {
    env = new Env('en-US', fetch);
    ctx = env.createContext([path + '/fixtures/{locale}.properties']);
  });

  describe('Translation in the first locale exists and is OK', function() {
    it('[e]', function(done) {
      assertPromise(ctx.formatValue(langs, 'e'), 'E pl', done);
    });
  });

  describe('ValueError in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[ve]', function(done) {
        assertPromise(ctx.formatValue(langs, 've'), 'VE {{ boo }} pl', done);
      });
    });

    describe('ValueError in second locale:', function() {
      it('[vv]', function(done) {
        assertPromise(ctx.formatValue(langs, 'vv'), 'VV {{ boo }} pl', done);
      });
    });

    describe('IndexError in second locale:', function() {
      it('[vi]', function(done) {
        assertPromise(ctx.formatValue(langs, 'vi'), 'VI {{ boo }} pl', done);
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[vm]', function(done) {
        assertPromise(ctx.formatValue(langs, 'vm'), 'VM {{ boo }} pl', done);
      });
    });
  });

  describe('IndexError in first locale', function() {
    describe('Entity exists in second locale', function() {
      it('[ie]', function(done) {
        assertPromise(ctx.formatValue(langs, 'ie'), 'ie', done);
      });
    });

    describe('ValueError in second locale', function() {
      it('[iv]', function(done) {
        assertPromise(ctx.formatValue(langs, 'iv'), 'iv', done);
      });
    });

    describe('IndexError in second locale', function() {
      it('[ii]', function(done) {
        assertPromise(ctx.formatValue(langs, 'ii'), 'ii', done);
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[im]', function(done) {
        assertPromise(ctx.formatValue(langs, 'im'), 'im', done);
      });
    });
  });

  describe('Entity not found in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[me]', function(done) {
        assertPromise(ctx.formatValue(langs, 'me'), 'ME en-US', done);
      });
    });

    describe('ValueError in second locale:', function() {
      it('[mv]', function(done) {
        assertPromise(
          ctx.formatValue(langs, 'mv'), 'MV {{ boo }} en-US', done);
      });
    });

    describe('IndexError in second locale:', function() {
      it('[mi]', function(done) {
        assertPromise(ctx.formatValue(langs, 'mi'), 'mi', done);
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[mm]', function(done) {
        assertPromise(ctx.formatValue(langs, 'mm'), 'mm', done);
      });
    });
  });
});
