'use strict';

function ftl(strings) {
  const [code] = strings;
  return code.replace(/^\s*/mg, '');
}


/* global window, document, assert */

describe('getResourceLinks', function() {
  it('should return an empty array if no l10n links in head', function() {
    const head = document.createElement('head');

    const result = L20n.getResourceLinks(head);

    assert.ok(result.constructor === Map);
    assert.equal(result.size, 0);
  });

  it('should collect all l10n links from head', function() {
    const links = [
      'locales/test.{locale}.l20n',
      '/shared/date/date.{locale}.l20n'];
      const head = document.createElement('head');

      for (const i in links) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'localization');
        link.setAttribute('href', links[i]);
        head.appendChild(link);
      }

      const result = L20n.getResourceLinks(head);

      assert.equal(result.size, 1);

      const main = result.get('main');
      assert.equal(main[0], links[0]);
      assert.equal(main[1], links[1]);
  });
});

describe('setAttributes', function() {
  it('should set id on an element', function() {
    const dom = new L20n.LocalizationObserver();
    const elem = document.createElement('div');
    dom.setAttributes(elem, 'l10nid1');

    assert.equal(elem.getAttribute('data-l10n-id'), 'l10nid1');
  });

  it('should set id and args on an element', function() {
    const dom = new L20n.LocalizationObserver();
    const elem = document.createElement('div');
    const l10nArgs = {
      foo: 'test1'
    };
    dom.setAttributes(elem, 'l10nid1', l10nArgs);

    assert.equal(elem.getAttribute('data-l10n-id'), 'l10nid1');
    assert.equal(
      elem.getAttribute('data-l10n-args'), JSON.stringify(l10nArgs));
  });
});

describe('getAttributes', function() {
  it('should get l10nId of an element', function() {
    const dom = new L20n.LocalizationObserver();
    const elem = document.createElement('div');
    elem.setAttribute('data-l10n-id', 'foo1');

    const ret = dom.getAttributes(elem);
    assert.equal(ret.id, 'foo1');
    assert.strictEqual(ret.args, null);
  });

  it('should get l10nId and l10nArgs of an element', function() {
    const dom = new L20n.LocalizationObserver();
    const elem = document.createElement('div');
    const l10nArgs = {
      foo: 'test1'
    };
    elem.setAttribute('data-l10n-id', 'foo1');
    elem.setAttribute('data-l10n-args', JSON.stringify(l10nArgs));

    const ret = dom.getAttributes(elem);
    assert.equal(ret.id, 'foo1');
    assert.deepEqual(ret.args, l10nArgs);
  });
}); 

describe('translateFragment', function() {
  it('should translate fragment', function() {
    const dom = new L20n.LocalizationObserver();
    const div = document.createElement('div');
    div.innerHTML = `
      <p data-l10n-id="key1"></p>
      <p data-l10n-id="key2"></p>
      <div>
        <p data-l10n-id="key3"></p>
      </div>
    `;

    function requestBundles() {
      const rb = new L20n.ResourceBundle('en-US', [
        './locales/test.ftl'
      ], {
        './locales/test.ftl': ftl`
        key1 = Value 1
        key2 = Value 2
        key3 = Value 3
      `
      });
      return Promise.resolve([
        rb
      ]);
    }

    function createContext(lang) {
      return new L20n.MessageContext(lang);
    }
    const loc = new L20n.Localization(requestBundles, createContext);
    dom.set('main', loc);
    return dom.translateFragment(div).then(() => {
      assert.equal(div.getElementsByTagName('p')[0].textContent, 'Value 1');
      assert.equal(div.getElementsByTagName('p')[1].textContent, 'Value 2');
      assert.equal(div.getElementsByTagName('p')[2].textContent, 'Value 3');
    });
  });
});

describe('MutationObserver', function() {
  it('should translate injected element', function(done) {
    const div = document.createElement('div');
    const dom = new L20n.LocalizationObserver();

    const mo = new MutationObserver(function(mutations) {
      const node = mutations[0].addedNodes[0];
      if (node.nodeType === Node.TEXT_NODE &&
          node.textContent === 'Value 4') {
        mo.disconnect(div);
        dom.disconnectRoot(div);
        done();
      }
    });

    function requestBundles() {
      const rb = new L20n.ResourceBundle('en-US', [
        './locales/test.ftl'
      ], {
        './locales/test.ftl': ftl`
        key1 = Value 4
      `
      });
      return Promise.resolve([
        rb
      ]);
    }

    function createContext(lang) {
      return new L20n.MessageContext(lang);
    }
    const loc = new L20n.Localization(requestBundles, createContext);
    dom.set('main', loc);

    dom.observeRoot(div);

    mo.observe(div, {
      attributes: true,
      characterData: false,
      childList: true,
      subtree: true,
      attributeFilter: ['data-l10n-id', 'data-l10n-args', 'data-l10n-bundle']
    });

    const p = document.createElement('p');
    p.setAttribute('data-l10n-id', 'key1');

    div.appendChild(p);
  });
});
