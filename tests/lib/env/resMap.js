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


describe('Creating a context', function() {
  var env, ctx1, ctx2;
  var res1 = path + '/fixtures/basic.properties';
  var res2 = path + '/fixtures/en-US.properties';

  beforeEach(function() {
    env = new L20n.Env('test', 'en-US', fetch);
  });

  it('populates resMap with one ctx', function() {
    ctx1 = env.createContext([res1]);
    assert(env._resMap[res1].has(ctx1));
  });

  it('populates resMap with two contexts', function() {
    ctx1 = env.createContext([res1]);
    ctx2 = env.createContext([res1, res2]);
    assert(env._resMap[res1].size === 2);
    assert(env._resMap[res1].has(ctx2));
    assert(env._resMap[res2].has(ctx2));
  });

  it('removes ctx from resMap when destroyed', function() {
    ctx1 = env.createContext([res1]);
    ctx2 = env.createContext([res1, res2]);
    env.destroyContext(ctx2);
    assert(env._resMap[res1].size === 1);
    assert(!env._resMap[res1].has(ctx2));
    assert(!env._resMap[res2].has(ctx2));
    assert(env._resMap[res1].has(ctx1));
  });
});
