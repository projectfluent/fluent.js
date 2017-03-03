import assert from 'assert';
import negotiateLanguages from '../src/index';

describe('Basic Language Negotiation', () => {
  const nl = negotiateLanguages;

  it('should match on an exact match', () => {
    assert.deepEqual(nl(['en'], ['en']), ['en']);

    assert.deepEqual(nl(['en-US'], ['en-US']), ['en-US']);

    assert.deepEqual(nl(['en-Latn-US'], ['en-Latn-US']), ['en-Latn-US']);

    assert.deepEqual(
      nl(['en-Latn-US-mac'], ['en-Latn-US-mac']), ['en-Latn-US-mac']
    );

    assert.deepEqual(nl(['fr-FR'], ['de', 'it', 'fr-FR']), ['fr-FR']);

    assert.deepEqual(
      nl(['fr', 'pl', 'de-DE'], ['pl', 'en-US', 'de-DE']),
      ['pl', 'de-DE']);
  });

  it('should match on available locale treated as a range', () => {
    assert.deepEqual(nl(['en-US'], ['en']), ['en']);

    assert.deepEqual(nl(['en-Latn-US'], ['en-US']), ['en-US']);

    assert.deepEqual(nl(['en-Latn-US-mac'], ['en-Latn-US']), ['en-Latn-US']);

    assert.deepEqual(nl(['en-US-mac'], ['en-US']), ['en-US']);

    assert.deepEqual(nl(['fr-CA', 'de-DE'], ['fr', 'it', 'de']), ['fr', 'de']);

    assert.deepEqual(nl(['ja-JP-mac'], ['ja']), ['ja']);

    assert.deepEqual(
      nl(['en-Latn-GB', 'en-Latn-IN'], ['en-IN', 'en-GB']),
      ['en-GB', 'en-IN']);
  });

  it('should match on a likely subtag', () => {
    assert.deepEqual(
      nl(['en'], ['en-GB', 'de', 'en-US']),
      ['en-US']);

    assert.deepEqual(
      nl(['fr'], ['fr-CA', 'fr-FR']),
      ['fr-FR']);

    assert.deepEqual(
      nl(['az-IR'], ['az-Latn', 'az-Arab']),
      ['az-Arab']);

    assert.deepEqual(
      nl(['sr-RU'], ['sr-Cyrl', 'sr-Latn']),
      ['sr-Latn']);

    assert.deepEqual(
      nl(['sr'], ['sr-Latn', 'sr-Cyrl']),
      ['sr-Cyrl']);

    assert.deepEqual(
      nl(['zh-GB'], ['zh-Hans', 'zh-Hant']),
      ['zh-Hant']);

    assert.deepEqual(
      nl(['sr', 'ru'], ['sr-Latn', 'ru']),
      ['ru']);

    assert.deepEqual(
      nl(['sr-RU'], ['sr-Latn-RO', 'sr-Cyrl']),
      ['sr-Latn-RO']);
  });

  it('should match on a requested locale as a range', () => {
    assert.deepEqual(nl(['en-*-US'], ['en-US']), ['en-US']);

    assert.deepEqual(nl(['en-Latn-US-*'], ['en-Latn-US']), ['en-Latn-US']);

    assert.deepEqual(nl(['en-*-US-*'], ['en-US']), ['en-US']);
  });

  it('should match cross-region', () => {
    assert.deepEqual(nl(['en'], ['en-US']), ['en-US']);

    assert.deepEqual(nl(['en-US'], ['en-GB']), ['en-GB']);

    assert.deepEqual(nl(['en-Latn-US'], ['en-Latn-GB']), ['en-Latn-GB']);

    assert.deepEqual(nl(['en-US-mac'], ['en-GB-mac']), ['en-GB-mac']);

    // This is a cross-region check, because the requested Locale
    // is really lang: en, script: *, region: undefined
    assert.deepEqual(nl(['en-*'], ['en-US']), ['en-US']);
  });

  it('should match cross-variant', () => {
    assert.deepEqual(nl(['en-US-mac'], ['en-US-win']), ['en-US-win']);
  });

  it('should prioritize properly', () => {
    // exact match first
    assert.deepEqual(nl(['en-US'], ['en-US-mac', 'en', 'en-US']), ['en-US']);

    // available as range second
    assert.deepEqual(nl(['en-Latn-US'], ['en-GB', 'en-US']), ['en-US']);

    // we're skipping likelySubtags here

    // variant range fourth
    assert.deepEqual(
      nl(['en-US-mac'], ['en-US-win', 'en-GB-mac']), ['en-US-win']
    );

    // regional range fourth
    assert.deepEqual(
      nl(['en-US-mac'], ['en-GB-win']), ['en-GB-win']
    );

  });

  it('should prioritiz properly (extra tests)', () => {
    // we pick generic range locale over other region first
    assert.deepEqual(nl(['en-US'], ['en-GB', 'en']), ['en']);
  });

  it('should handle default locale properly', () => {
    assert.deepEqual(nl(['fr'], ['de', 'it']), []);

    assert.deepEqual(nl(['fr'], ['de', 'it'], {
      defaultLocale: 'en-US'
    }), ['en-US']);

    assert.deepEqual(nl(['fr'], ['de', 'en-US'], {
      defaultLocale: 'en-US'
    }), ['en-US']);

    assert.deepEqual(
      nl(['fr', 'de-DE'], ['de-DE', 'fr-CA'], {
        defaultLocale: 'en-US'
      }),
      ['fr-CA', 'de-DE', 'en-US']);
  });

  it('should handle all matches on the 1st higher than any on the 2nd', () => {
    assert.deepEqual(
      nl(['fr-CA-mac', 'de-DE'], ['de-DE', 'fr-FR-win']),
      ['fr-FR-win', 'de-DE']);
  });

});
