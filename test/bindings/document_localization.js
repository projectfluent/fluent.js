'use strict';

function ftl(strings) {
  const [code] = strings;
  return code.replace(/^\s*/mg, '');
}


/* global window, document, assert */

describe('translateFragment', function() {
  it('should translate fragment', function() {
    const div = document.createElement('div');
    div.innerHTML = `
      <p data-l10n-id="key1" data-l10n-with="main"></p>
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
      return new L20n.MessageContext(lang, { useIsolating: false });
    }

    const dom = new L20n.DocumentLocalization(requestBundles, createContext);

    return dom.translateFragment(div).then(() => {
      assert.equal(div.getElementsByTagName('p')[0].textContent, 'Value 1');
      assert.equal(div.getElementsByTagName('p')[1].textContent, 'Value 2');
      assert.equal(div.getElementsByTagName('p')[2].textContent, 'Value 3');
    });
  });
});

describe('MutationObserver', function() {
  it('should translate injected element', function(done) {
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
      return new L20n.MessageContext(lang, { useIsolating: false });
    }

    const dom = new L20n.DocumentLocalization(requestBundles, createContext);
    const div = document.createElement('div');

    const mo = new MutationObserver(function(mutations) {
      const node = mutations[0].addedNodes[0];
      if (node.nodeType === Node.TEXT_NODE &&
          node.textContent === 'Value 4') {
        mo.disconnect(div);
        dom.disconnectRoot(div);
        done();
      }
    });

    dom.connectRoot(div);

    mo.observe(div, {
      attributes: true,
      characterData: false,
      childList: true,
      subtree: true,
      attributeFilter: ['data-l10n-id', 'data-l10n-args', 'data-l10n-with']
    });

    const p = document.createElement('p');
    p.setAttribute('data-l10n-id', 'key1');

    div.appendChild(p);
  });
});
