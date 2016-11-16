'use strict';

function ftl(strings) {
  const [code] = strings;
  return code.replace(/^\s*/mg, '');
}

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


describe('setAttributes', function() {
  it('should set id on an element', function() {
    const dom = new L20n.DOMLocalization(requestBundles, createContext, 'test');
    const elem = document.createElement('div');
    dom.setAttributes(elem, 'l10nid1');

    assert.equal(elem.getAttribute('data-l10n-id'), 'l10nid1');
  });

  it('should set id and args on an element', function() {
    const dom = new L20n.DOMLocalization(requestBundles, createContext, 'test');
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
    const dom = new L20n.DOMLocalization(requestBundles, createContext, 'test');
    const elem = document.createElement('div');
    elem.setAttribute('data-l10n-id', 'foo1');

    const ret = dom.getAttributes(elem);
    assert.equal(ret.id, 'foo1');
    assert.strictEqual(ret.args, null);
  });

  it('should get l10nId and l10nArgs of an element', function() {
    const dom = new L20n.DOMLocalization(requestBundles, createContext, 'test');
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
    const div = document.createElement('div');
    div.innerHTML = `
      <p data-l10n-id="key1" data-l10n-with="test"></p>
      <p data-l10n-id="key2" data-l10n-with="test"></p>
      <div>
        <p data-l10n-id="key3" data-l10n-with="test"></p>
      </div>
    `;

    const dom = new L20n.DOMLocalization(requestBundles, createContext, 'test');

    return dom.translateFragment(div).then(() => {
      assert.equal(div.getElementsByTagName('p')[0].textContent, 'Value 1');
      assert.equal(div.getElementsByTagName('p')[1].textContent, 'Value 2');
      assert.equal(div.getElementsByTagName('p')[2].textContent, 'Value 3');
    });
  });
});
