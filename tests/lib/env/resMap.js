/* global assert:true, it, describe, beforeEach */
'use strict';

import assert from 'assert';
import { Env } from '../../../src/lib/env';
import { fetch } from '../../../src/runtime/node/io';

const path = __dirname + '/..';

// resMap has been removed in PR #39
describe.skip('Creating a context', function() {
  var env, ctx1, ctx2;
  var res1 = path + '/fixtures/basic.properties';
  var res2 = path + '/fixtures/en-US.properties';

  beforeEach(function() {
    env = new Env('en-US', fetch);
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
