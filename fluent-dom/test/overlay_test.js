import assert from 'assert';
import overlayElement from '../src/overlay';

function elem(name) {
  return function(str) {
    const element = document.createElement(name);
    element.innerHTML = str;
    return element;
  }
}

suite('Overlay DOM elements', function() {

  test('string value', function() {
    const element = elem('div')`Foo`;
    const translation = {
      value: 'Bar',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, 'Bar');
  });

  test('one child', function() {
    const element = elem('div')`<a href="bar"></a>`;
    const translation = {
      value: 'Foo <a title="baz">Baz</a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, 'Foo <a href="bar" title="baz">Baz</a>');
  });

  test('one child with own attributes', function() {
    const element = elem('div')`Foo <a href="bar" title="bar">Bar</a>`;
    const translation = {
      value: 'Foo <a href="baz" title="baz">Baz</a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, 'Foo <a href="bar" title="baz">Baz</a>');
  });

  test('two children of the same type', function() {
    const element = elem('div')`<a href="foo"></a> <a href="bar"></a>`;
    const translation = {
      value: '<a title="foo">Foo</a> <a title="bar">Bar</a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, '<a href="foo" title="foo">Foo</a> <a href="bar" title="bar">Bar</a>');
  });

  test('two children of different types in order', function() {
    const element = elem('div')`<a href="foo"></a> <input type="text">`;
    const translation = {
      value: '<a title="foo">Foo</a> <input placeholder="Bar" />',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, '<a href="foo" title="foo">Foo</a> <input type="text" placeholder="Bar">');
  });

  test('two children of different types not in order', function() {
    const element = elem('div')`<a href="foo"></a> <input type="text">`;
    const translation = {
      value: '<input placeholder="Bar" /> <a title="foo">Foo</a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, '<input type="text" placeholder="Bar"> <a href="foo" title="foo">Foo</a>');
  });

});

suite('Allowing elements in translation', function() {

  test('allowed element', function() {
    const element = elem('div')`Foo`;
    const translation = {
      value: 'Foo <em>Bar</em> Baz',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, 'Foo <em>Bar</em> Baz');
  });

  test('forbidden element', function() {
    const element = elem('div')`Foo`;
    const translation = {
      value: 'Foo <img src="img.png" />',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, 'Foo ');
  });

});
