'use strict';

import assert from 'assert';

import '../../src/intl/polyfill';
import Localization from '../../src/lib/localization';

import { ftl } from '../util';
import MockResourceBundle, { withData } from './mock_resource_bundle';

function createLocalization(data) {
  function requestBundles() {
    return Promise.resolve(
      data.map(
        ([lang, ...translations]) => withData(translations)(
          new MockResourceBundle(lang)
        )
      )
    );
  }

  function createContext(lang) {
    return new Intl.MessageContext(lang);
  }

  return new Localization(requestBundles, createContext);
}

describe('No fallback - best case scenario', function() {
  let l10n, _consolewarn;

  before(function() {
    _consolewarn = console.warn;
    console.warn = () => {};

    l10n = createLocalization([
      [
        'pl', ftl`
          foo = Foo (pl)
          bar = { foo } Bar (pl)
        `
      ],
      [
        'en', ftl`
          foo = Foo (en)
          bar = { foo } Bar (en)
        `
      ],
    ]);
  }); 

  after(function() {
    console.warn = _consolewarn;
  });

  it('formats in the first language', function() {
    return l10n.formatValues('foo').then(
      ([foo]) => assert.equal(foo, 'Foo (pl)')
    );
  });

  it('formats in the first language', function() {
    return l10n.formatValues('bar').then(
      ([bar]) => assert.equal(bar, 'Foo (pl) Bar (pl)')
    );
  });
});

describe('Fallback in case of missing translations', function() {
  let l10n, _consolewarn;

  before(function() {
    _consolewarn = console.warn;
    console.warn = () => {};

    l10n = createLocalization([
      [
        'pl', ftl`
          foo = Foo (pl)
        `
      ],
      [
        'en', ftl`
          foo = Foo (en)
          bar = Bar (en)
        `
      ]
    ]);
  }); 

  after(function() {
    console.warn = _consolewarn;
  });

  it('falls back to the second language', function() {
    return l10n.formatValues('bar').then(
      ([bar]) => assert.equal(bar, 'Bar (en)')
    );
  });

  it('falls back to the identifier', function() {
    return l10n.formatValues('baz').then(
      ([baz]) => assert.equal(baz, 'baz')
    );
  });
});

describe('Fallback in case of broken translations', function() {
  let l10n, _consolewarn;

  before(function() {
    _consolewarn = console.warn;
    console.warn = () => {};

    l10n = createLocalization([
      [
        'pl', ftl`
          bar = { foo } Bar (pl)
        `
      ],
      [
        'en', ftl`
          foo = Foo (en)
          bar = { foo } Bar (en)
        `
      ]
    ]);
  }); 

  after(function() {
    console.warn = _consolewarn;
  });

  it('uses the salvaged translation from the first language', function() {
    return l10n.formatValues('bar').then(
      ([bar]) => assert.equal(bar, 'foo Bar (pl)')
    );
  });

  it('uses the 2nd language bar if fallback was triggered by foo', function() {
    return l10n.formatValues('foo', 'bar').then(
      ([foo, bar]) => {
        assert.equal(foo, 'Foo (en)');
        assert.equal(bar, 'Foo (en) Bar (en)');
      }
    );
  });

  it('ignores order of ids passed to formatValues', function() {
    return l10n.formatValues('bar', 'foo').then(
      ([bar, foo]) => {
        assert.equal(foo, 'Foo (en)');
        assert.equal(bar, 'Foo (en) Bar (en)');
      }
    );
  });
});

describe('Fallback translation is missing', function() {
  let l10n, _consolewarn;

  before(function() {
    _consolewarn = console.warn;
    console.warn = () => {};

    l10n = createLocalization([
      [
        'pl', ftl`
          bar = { foo } Bar (pl)
        `
      ],
      [
        'en', ftl`
          foo = Foo (en)
        `
      ]
    ]);
  }); 

  after(function() {
    console.warn = _consolewarn;
  });

  it('prefers broken translation from the 1st language over id', function() {
    return l10n.formatValues('foo', 'bar').then(
      ([foo, bar]) => {
        assert.equal(foo, 'Foo (en)');
        assert.equal(bar, 'foo Bar (pl)');
      }
    );
  });
});

describe('Fallback translation is broken', function() {
  let l10n, _consolewarn;

  before(function() {
    _consolewarn = console.warn;
    console.warn = () => {};

    l10n = createLocalization([
      [
        'pl', ftl`
          bar = { foo } Bar (pl)
        `
      ],
      [
        'en', ftl`
          foo = Foo (en) { baz }
          bar = Bar (en) { baz }
        `
      ]
    ]);
  }); 

  after(function() {
    console.warn = _consolewarn;
  });

  it('prefers broken translation from the 1st language over ' +
     'the translation from the 2nd language', function() {
    return l10n.formatValues('foo', 'bar').then(
      ([foo, bar]) => {
        assert.equal(foo, 'Foo (en) baz');
        assert.equal(bar, 'foo Bar (pl)');
      }
    );
  });
});
