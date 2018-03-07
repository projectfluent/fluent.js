import assert from 'assert';
import overlayElement from '../src/overlay';
import {elem} from './util';

suite('Retranslation', function() {
  // XXX https://bugzilla.mozilla.org/show_bug.cgi?id=922577
  test('top-level attributes do not leak', function() {
    const element = elem('div')`Foo`;
    const translationA = {
      value: 'FOO A',
      attrs: [
        ['title', 'TITLE A']
      ]
    };
    const translationB = {
      value: 'FOO B',
      attrs: null
    };

    overlayElement(element, translationA);
    assert.equal(element.outerHTML,
      '<div title="TITLE A">FOO A</div>');
    overlayElement(element, translationB);
    assert.equal(element.outerHTML,
      '<div>FOO B</div>');
  });

  test('attributes of children do not leak', function() {
    const element = elem('div')`
      <a href="foo">Foo</a>`;
    const translationA = {
      value: '<a title="FOO A">FOO A</em>',
      attrs: null
    };
    const translationB = {
      value: '<a>FOO B</em>',
      attrs: null
    };

    overlayElement(element, translationA);
    assert.equal(element.innerHTML,
      '<a title="FOO A" href="foo">FOO A</a>');
    overlayElement(element, translationB);
    assert.equal(element.innerHTML,
      '<a href="foo">FOO B</a>');
  });

  test('attributes of inserted children do not leak', function() {
    const element = elem('div')`Foo`;
    const translationA = {
      value: 'FOO <em title="A">A</em>',
      attrs: null
    };
    const translationB = {
      value: 'FOO <em>B</em>',
      attrs: null
    };

    overlayElement(element, translationA);
    assert.equal(element.innerHTML,
      'FOO <em title="A">A</em>');
    overlayElement(element, translationB);
    assert.equal(element.innerHTML,
      'FOO <em>B</em>');
  });
});
