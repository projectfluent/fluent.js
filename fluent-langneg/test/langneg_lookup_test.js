import assert from 'assert';
import negotiateLanguages from '../src/index';

suite('Basic Language Lookup', () => {
  let nl;
  suiteSetup(() => {
    nl = function(requested, available, options = {}) {
      const resolvedOptions = Object.assign(options, {
        strategy: 'lookup',
        defaultLocale: 'und'
      });
      return negotiateLanguages(requested, available, resolvedOptions);
    };
  });


  test('exact match', () => {
    assert.deepEqual(
      nl(['en-US-mac', 'de'], ['de', 'en-US-win']), ['en-US-win']);
  });

  test('available locale is treated as a range', () => {
    assert.deepEqual(
      nl(['de-DE', 'fr'], ['fr', 'de']), ['de']);
  });

  test('requested locale as a range works', () => {
    assert.deepEqual(
      nl(['de-*', 'fr'], ['fr', 'de-DE']), ['de-DE']);
  });

  test('we match cross-region', () => {
    assert.deepEqual(
      nl(['de-DE', 'fr'], ['fr', 'de-AT']), ['de-AT']);
  });

  test('we match cross-variant', () => {
    assert.deepEqual(
      nl(['de-DE-mac', 'fr'], ['fr', 'de-DE-win']), ['de-DE-win']);
  });
});
