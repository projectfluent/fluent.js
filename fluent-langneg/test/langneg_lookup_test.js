import assert from 'assert';
import negotiateLanguages from '../src/index';

describe('Basic Language Lookup', () => {
  let nl;
  before(() => {
    nl = function(requested, available, options = {}) {
      const resolvedOptions = Object.assign(options, {
        strategy: 'lookup',
        defaultLocale: 'und'
      });
      return negotiateLanguages(requested, available, resolvedOptions);
    };
  });


  it('exact match', () => {
    assert.deepEqual(
      nl(['en-US-mac', 'de'], ['de', 'en-US-win']), ['en-US-win']);
  });

  it('available locale is treated as a range', () => {
    assert.deepEqual(
      nl(['de-DE', 'fr'], ['fr', 'de']), ['de']);
  });

  it('requested locale as a range works', () => {
    assert.deepEqual(
      nl(['de-*', 'fr'], ['fr', 'de-DE']), ['de-DE']);
  });

  it('we match cross-region', () => {
    assert.deepEqual(
      nl(['de-DE', 'fr'], ['fr', 'de-AT']), ['de-AT']);
  });

  it('we match cross-variant', () => {
    assert.deepEqual(
      nl(['de-DE-mac', 'fr'], ['fr', 'de-DE-win']), ['de-DE-win']);
  });
});
