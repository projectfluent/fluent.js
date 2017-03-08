import assert from 'assert';
import Locale from '../src/locale';

function isLocaleEqual(str, ref) {
  const locale = new Locale(str);
  return locale.isEqual(ref);
}

suite('Parses simple locales', () => {
  test('language part', () => {
    assert.ok(isLocaleEqual('en', {
      language: 'en',
    }));

    assert.ok(isLocaleEqual('lij', {
      language: 'lij',
    }));
  });

  test('script part', () => {
    assert.ok(isLocaleEqual('en-Latn', {
      language: 'en',
      script: 'Latn'
    }));

    assert.ok(isLocaleEqual('lij-Arab', {
      language: 'lij',
      script: 'Arab'
    }));
  });

  test('region part', () => {
    assert.ok(isLocaleEqual('en-Latn-US', {
      language: 'en',
      script: 'Latn',
      region: 'US'
    }));

    assert.ok(isLocaleEqual('lij-Arab-FA', {
      language: 'lij',
      script: 'Arab',
      region: 'FA'
    }));
  });

  test('variant part', () => {
    assert.ok(isLocaleEqual('en-Latn-US-mac', {
      language: 'en',
      script: 'Latn',
      region: 'US',
      variant: 'mac'
    }));

    assert.ok(isLocaleEqual('lij-Arab-FA-linux', {
      language: 'lij',
      script: 'Arab',
      region: 'FA',
      variant: 'linux'
    }));
  });

  test('skipping script part', () => {
    assert.ok(isLocaleEqual('en-US', {
      language: 'en',
      region: 'US',
    }));

    assert.ok(isLocaleEqual('lij-FA-linux', {
      language: 'lij',
      region: 'FA',
      variant: 'linux'
    }));
  });

  test('skipping variant part', () => {
    assert.ok(isLocaleEqual('en-US', {
      language: 'en',
      region: 'US',
    }));

    assert.ok(isLocaleEqual('lij-FA-linux', {
      language: 'lij',
      region: 'FA',
      variant: 'linux'
    }));
  });
});

suite('Parses locale ranges', () => {
  test('language part', () => {
    assert.ok(isLocaleEqual('*', {
      language: '*',
    }));

    assert.ok(isLocaleEqual('*-Latn', {
      language: '*',
      script: 'Latn'
    }));

    assert.ok(isLocaleEqual('*-US', {
      language: '*',
      region: 'US'
    }));
  });

  test('script part', () => {
    assert.ok(isLocaleEqual('en-*', {
      language: 'en',
      script: '*'
    }));

    assert.ok(isLocaleEqual('en-*-US', {
      language: 'en',
      script: '*',
      region: 'US'
    }));
  });

  test('region part', () => {
    assert.ok(isLocaleEqual('en-Latn-*', {
      language: 'en',
      script: 'Latn',
      region: '*'
    }));
  });

  test('variant part', () => {
    assert.ok(isLocaleEqual('en-Latn-US-*', {
      language: 'en',
      script: 'Latn',
      region: 'US',
      variant: '*'
    }));
  });
});
