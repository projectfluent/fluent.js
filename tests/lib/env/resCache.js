/* global Promise, assert:true, it, describe, beforeEach */
/* global navigator, __dirname */
'use strict';

if (typeof navigator !== 'undefined') {
  var L20n = navigator.mozL10n._getInternalAPI();
  var path =
    'app://sharedtest.gaiamobile.org/test/unit/l10n/lib';
} else {
  var assert = require('assert');
  var L20n = {
    Env: require('../../../src/lib/env').Env,
    fetch: require('../../../src/runtime/node/io').fetch,
    L10nError: require('../../../src/lib/errors').L10nError
  };
  var path = __dirname + '/..';
}

var langs = [
  { code: 'en-US', src: 'app', dir: 'ltr' },
];


describe('Caching resources', function() {
  var env, ctx1, ctx2;
  var res1 = path + '/fixtures/basic.properties';
  var res2 = path + '/fixtures/{locale}.properties';
  var res3 = path + '/fixtures/missing.properties';

  beforeEach(function(done) {
    env = new L20n.Env('en-US', L20n.fetch);
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
    assert(env._resCache[res3 + 'en-USapp'] instanceof L20n.L10nError);
  });

  // destroyContext has been removed in PR #39
  it.skip('clears the cache only if no other ctx uses the resource',
    function() {

    env.destroyContext(ctx2);
    assert(env._resCache[res1]['en-US'].app);
    assert(!env._resCache[res2]);
    assert(env._resCache[res3]['en-US'].app instanceof L20n.L10nError);
  });

});
