'use strict';

import assert from 'assert';
import { Env } from '../../../src/lib/env';
import { fetchResource } from '../../../src/runtime/node/io';
import { L10nError } from '../../../src/lib/errors';

const path = __dirname + '/..';
const langs = [
  { code: 'en-US', src: 'app' },
];

describe('Caching resources', function() {
  var env, ctx1, ctx2;
  var res1 = path + '/fixtures/basic.properties';
  var res2 = path + '/fixtures/{locale}.properties';
  var res3 = path + '/fixtures/missing.properties';

  beforeEach(function(done) {
    env = new Env(fetchResource);
    ctx1 = env.createContext([res1, res3]);
    ctx2 = env.createContext([res1, res2]);
    Promise.all([
      ctx1.fetch(langs),
      ctx2.fetch(langs)
    ]).then(() => undefined).then(done, done);
  });

  it('caches resources', function() {
    assert(env._resCache.get(res1 + 'en-USapp'));
    assert(env._resCache.get(res2 + 'en-USapp'));
    assert(env._resCache.get(res3 + 'en-USapp') instanceof L10nError);
  });

  it('clears the cache only if no other ctx uses the resource', function() {
    env.destroyContext(ctx2);
    assert(env._resCache.get(res1 + 'en-USapp'));
    assert(!env._resCache.has(res2 + 'en-USapp'));
    assert(env._resCache.get(res3 + 'en-USapp') instanceof L10nError);
  });

});
