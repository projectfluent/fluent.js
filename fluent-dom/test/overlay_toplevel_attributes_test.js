import assert from 'assert';
import overlayElement from '../src/overlay';
import {elem} from './util';

suite('Filter top-level attributes', function() {
  test('allowed attribute', function() {
    const element = elem('div')``;
    const translation = {
      value: null,
      attrs: [
        ['title', 'FOO']
      ]
    };

    overlayElement(element, translation);
    assert.equal(element.outerHTML,
      '<div title="FOO"></div>');
  });

  test('forbidden attribute', function() {
    const element = elem('input')``;
    const translation = {
      value: null,
      attrs: [
        ['disabled', 'DISABLED']
      ]
    };

    overlayElement(element, translation);
    assert.equal(element.outerHTML, '<input>');
  });

  test('attributes of the source element do not leak', function() {
    const element = elem('div')`Foo`;
    element.setAttribute('title', 'Title');

    const translation = {
      value: 'FOO',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.outerHTML,
      '<div>FOO</div>');
  });
});
