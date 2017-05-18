import assert from 'assert';
import parseHeaderIntoArray from '../src/headers';

suite('parse headers', () => {
  test('without quality values', () => {
    assert.deepStrictEqual(
      parseHeaderIntoArray('en-US, fr, pl'), [
        'en-US',
        'fr',
        'pl'
      ]
    );
    assert.deepStrictEqual(
      parseHeaderIntoArray('sr-Latn'), [
        'sr-Latn'
      ]
    );
  });

  test('with quality values', () => {
    assert.deepStrictEqual(
      parseHeaderIntoArray('fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5'), [
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
      assert.throws(parseHeaderIntoArray.bind(null, arg), TypeError);
    });
  });
});
