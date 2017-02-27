import assert from 'assert';
import negotiateLanguages from '../src/index';

describe('Basic Language Negotiation without likelySubtags', () => {
  let nl;
  before(() => {
    nl = function(requested, available, options = {}) {
      const resolvedOptions = Object.assign(options, {
        strategy: 'matching'
      });
      return negotiateLanguages(requested, available, resolvedOptions);
    };
  });


  it('exact match', () => {
    assert.deepEqual(nl(['en-US'], ['en-US', 'en']), ['en-US', 'en']);

    assert.deepEqual(
      nl(['en-Latn-US'], ['en-Latn-US', 'en-US']), ['en-Latn-US', 'en-US']);
  });
});
