import assert from 'assert';
import overlayElement from '../src/overlay';
import {elem} from './util';

suite('Filter elements in translation', function() {
  test('allowed element', function() {
    const element = elem('div')`Foo`;
    const translation = {
      value: 'FOO <em>BAR</em> BAZ',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, 'FOO <em>BAR</em> BAZ');
  });

  test('forbidden element', function() {
    const element = elem('div')`Foo`;
    const translation = {
      value: 'FOO <img src="img.png" />',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, 'FOO ');
  });

  test('forbidden element with text', function() {
    const element = elem('div')`Foo`;
    const translation = {
      value: 'FOO <button>BUTTON</button>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, 'FOO BUTTON');
  });

  test('nested HTML is forbidden', function() {
    const element = elem('div')`Foo`;
    const translation = {
      value: 'FOO <em><strong>BAR</strong></em> BAZ',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, 'FOO <em>BAR</em> BAZ');
  });
});

suite('Filter attributes in translation', function() {
  test('allowed attribute', function() {
    const element = elem('div')`Foo Bar`;
    const translation = {
      value: 'FOO <em title="BAR">BAR</em>',
      attrs: null,
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      'FOO <em title="BAR">BAR</em>');
  });

  test('forbidden attribute', function() {
    const element = elem('div')`Foo Bar`;
    const translation = {
      value: 'FOO <a href="BAR" title="BAR">BAR</a>',
      attrs: null,
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      'FOO <a title="BAR">BAR</a>');
  });

  test('attributes of source children do not leak', function() {
    const element = elem('div')`
      <a href="foo" title="Foo">Foo</a>`;
    const translation = {
      value: '<a>FOO</a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      '<a href="foo">FOO</a>');
  });
});
