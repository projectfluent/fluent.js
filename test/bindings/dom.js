'use strict';

/* global window, document, assert */

var dom = L20n.dom;

describe('getResourceLinks', function() {
  it('should return an empty array if no l10n links in head', function() {
    var head = document.createElement('head');

    var result = dom.getResourceLinks(head);

    assert.ok(Array.isArray(result));
    assert.equal(result.length, 0);
  });

  it('should collect all l10n links from head', function() {
    var links = [
      'locales/test.{locale}.l20n',
      '/shared/date/date.{locale}.l20n'];
      var head = document.createElement('head');

      for (var i in links) {
        var link = document.createElement('link');
        link.setAttribute('rel', 'localization');
        link.src = links[i];
        head.appendChild(link);
      }

      var result = dom.getResourceLinks(head);

      assert.equal(result.length, 2);
      assert.equal(result[0], result[0]);
      assert.equal(result[1], result[1]);
  });

  it('should decode URI in l10n links', function() {
    var links = [
      'locales/test.{locale}.l20n',
      '/shared/date/date.{locale}.l20n'];
      var head = document.createElement('head');

      for (var i in links) {
        var link = document.createElement('link');
        link.setAttribute('rel', 'localization');
        link.src = links[i];
        head.appendChild(link);
      }

      var result = dom.getResourceLinks(head);

      assert.equal(result.length, 2);
      assert.equal(result[0], result[0]);
      assert.equal(result[1], result[1]);
  });
});

describe('setAttributes', function() {
  it('should set id on an element', function() {
    var elem = document.createElement('div');
    dom.setAttributes(elem, 'l10nid1');

    assert.equal(elem.getAttribute('data-l10n-id'), 'l10nid1');
  });

  it('should set id and args on an element', function() {
    var elem = document.createElement('div');
    var l10nArgs = {
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
    var elem = document.createElement('div');
    elem.setAttribute('data-l10n-id', 'foo1');

    var ret = dom.getAttributes(elem);
    assert.equal(ret.id, 'foo1');
    assert.strictEqual(ret.args, null);
  });

  it('should get l10nId and l10nArgs of an element', function() {
    var elem = document.createElement('div');
    var l10nArgs = {
      foo: 'test1'
    };
    elem.setAttribute('data-l10n-id', 'foo1');
    elem.setAttribute('data-l10n-args', JSON.stringify(l10nArgs));

    var ret = dom.getAttributes(elem);
    assert.equal(ret.id, 'foo1');
    assert.deepEqual(ret.args, l10nArgs);
  });
}); 
