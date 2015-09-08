'use strict';

import assert from 'assert';
import { isolate as i } from '../util';
import { Env } from '../../../src/lib/env';
import { fetch } from '../../../src/runtime/node/io';

const path = __dirname + '/..';
const langs = [
  { code: 'pl', src: 'app', dir: 'ltr' },
  { code: 'en-US', src: 'app', dir: 'ltr' },
];

function assertValue(promise, expected, done) {
  promise.then(function({value}) {
    assert.strictEqual(value, expected);
  }).then(done, done);
}

describe('One fallback locale', function() {
  var env, ctx;

  beforeEach(function(done) {
    env = new Env('en-US', fetch);
    ctx = env.createContext([path + '/fixtures/{locale}.properties']);
    ctx.fetch(langs).then(() => done(), done);
  });

  describe('Translation in the first locale exists and is OK', function() {
    it('[e]', function(done) {
      assertValue(ctx.resolveEntity(langs, 'e'), 'E pl', done);
    });
  });

  describe('ValueError in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[ve]', function(done) {
        assertValue(
          ctx.resolveEntity(langs, 've'),
          i('VE {{ boo }} pl', '{{ boo }}'),
          done);
      });
    });

    describe('ValueError in second locale:', function() {
      it('[vv]', function(done) {
        assertValue(
          ctx.resolveEntity(langs, 'vv'),
          i('VV {{ boo }} pl', '{{ boo }}'),
          done);
      });
    });

    describe('IndexError in second locale:', function() {
      it('[vi]', function(done) {
        assertValue(
          ctx.resolveEntity(langs, 'vi'),
          i('VI {{ boo }} pl', '{{ boo }}'),
          done);
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[vm]', function(done) {
        assertValue(
          ctx.resolveEntity(langs, 'vm'),
          i('VM {{ boo }} pl', '{{ boo }}'),
          done);
      });
    });
  });

  describe('IndexError in first locale', function() {
    describe('Entity exists in second locale', function() {
      it('[ie]', function(done) {
        assertValue(ctx.resolveEntity(langs, 'ie'), 'ie', done);
      });
    });

    describe('ValueError in second locale', function() {
      it('[iv]', function(done) {
        assertValue(ctx.resolveEntity(langs, 'iv'), 'iv', done);
      });
    });

    describe('IndexError in second locale', function() {
      it('[ii]', function(done) {
        assertValue(ctx.resolveEntity(langs, 'ii'), 'ii', done);
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[im]', function(done) {
        assertValue(ctx.resolveEntity(langs, 'im'), 'im', done);
      });
    });
  });

  describe('Entity not found in first locale', function() {
    describe('Entity exists in second locale:', function() {
      it('[me]', function(done) {
        assertValue(ctx.resolveEntity(langs, 'me'), 'ME en-US', done);
      });
    });

    describe('ValueError in second locale:', function() {
      it('[mv]', function(done) {
        assertValue(
          ctx.resolveEntity(langs, 'mv'),
          i('MV {{ boo }} en-US', '{{ boo }}'),
          done);
      });
    });

    describe('IndexError in second locale:', function() {
      it('[mi]', function(done) {
        assertValue(ctx.resolveEntity(langs, 'mi'), 'mi', done);
      });
    });

    describe('Entity missing in second locale:', function() {
      it('[mm]', function(done) {
        assertValue(ctx.resolveEntity(langs, 'mm'), 'mm', done);
      });
    });
  });
});
