import assert from 'assert';
import {acceptedLanguages} from '../esm/accepted_languages.js';

suite('parse headers', () => {
  test('without quality values', () => {
    assert.deepStrictEqual(
      acceptedLanguages('en-US, fr, pl'), [
        'en-US',
        'fr',
        'pl'
      ]
    );
    assert.deepStrictEqual(
      acceptedLanguages('sr-Latn'), [
        'sr-Latn'
      ]
    );
  });

  test('with quality values', () => {
    assert.deepStrictEqual(
      acceptedLanguages('fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5'), [
        'fr-CH',
        'fr',
        'en',
        'de',
        '*'
      ]
    );
  });

  test('edge cases', () => {
    const args = [
      null,
      NaN,
      Infinity,
      [],
      {}
    ];

    args.forEach(arg => {
      assert.throws(acceptedLanguages.bind(null, arg), TypeError);
    });
  });
});
