'use strict';

import assert from 'assert';
import '../src/index';

describe('Polyfill', function() {

  it('Intl.PluralRules exists', function() {
    assert.strictEqual(typeof Intl.PluralRules, 'function');
  });

  it('select method exists', function() {
    const pr = new Intl.PluralRules('fr');
    assert.strictEqual(typeof pr.select, 'function');
  });

});

describe('Plural rules', function() {

  it('known language: en', function() {
    const pr = new Intl.PluralRules('en');
    assert.strictEqual(pr.select(0), 'other');
    assert.strictEqual(pr.select(1), 'one');
    assert.strictEqual(pr.select(3), 'other');
    assert.strictEqual(pr.select(5), 'other');
    assert.strictEqual(pr.select(12), 'other');
    assert.strictEqual(pr.select(22), 'other');
  });

  it('known language: pl', function() {
    const pr = new Intl.PluralRules('pl');
    assert.strictEqual(pr.select(0), 'many');
    assert.strictEqual(pr.select(1), 'one');
    assert.strictEqual(pr.select(3), 'few');
    assert.strictEqual(pr.select(5), 'many');
    assert.strictEqual(pr.select(12), 'many');
    assert.strictEqual(pr.select(22), 'few');
  });

  it('unknown languages uses en-US', function() {
    const pr = new Intl.PluralRules('xxx');
    assert.strictEqual(pr.select(0), 'other');
    assert.strictEqual(pr.select(1), 'one');
    assert.strictEqual(pr.select(3), 'other');
    assert.strictEqual(pr.select(5), 'other');
    assert.strictEqual(pr.select(12), 'other');
    assert.strictEqual(pr.select(22), 'other');
  });

});
