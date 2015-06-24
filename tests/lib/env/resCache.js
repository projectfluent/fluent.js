'use strict';

import assert from 'assert';
import { Env } from '../../../src/lib/env';
import { fetch } from '../../../src/runtime/node/io';
import { L10nError } from '../../../src/lib/errors';

const path = __dirname + '/..';
const langs = [
  { code: 'en-US', src: 'app', dir: 'ltr' },
];

describe('Caching resources', function() {
  var env, ctx1, ctx2;
  var res1 = path + '/fixtures/basic.properties';
  var res2 = path + '/fixtures/{locale}.properties';
  var res3 = path + '/fixtures/missing.properties';

  beforeEach(function(done) {
    env = new Env('en-US', fetch);
    ctx1 = env.createContext([res1, res3]);
    ctx2 = env.createContext([res1, res2]);
    Promise.all([
      ctx1.fetch(langs),
      ctx2.fetch(langs)]).then(
        // discard resolutions
        function() {}).then(
          done, done);
  });

  it('caches resources', function() {
    assert(env._resCache[res1 + 'en-USapp']);
    assert(env._resCache[res2 + 'en-USapp']);
    assert(env._resCache[res3 + 'en-USapp'] instanceof L10nError);
  });

  // destroyContext has been removed in PR #39
  it.skip('clears the cache only if no other ctx uses the resource',
    function() {

    env.destroyContext(ctx2);
    assert(env._resCache[res1]['en-US'].app);
    assert(!env._resCache[res2]);
    assert(env._resCache[res3]['en-US'].app instanceof L10nError);
  });

});
