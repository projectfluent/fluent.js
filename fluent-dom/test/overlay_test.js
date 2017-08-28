import assert from 'assert';
import overlayElement from '../src/overlay';

function elem(name) {
  return function(str) {
    const element = document.createElement(name);
    element.innerHTML = str;
    return element;
  }
}

suite('Filtering elements in translation', function() {
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

suite('Filtering attributes in translation', function() {
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
});

suite('Filtering attributes on the main elment', function() {
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
});

suite('Overlay DOM elements', function() {

  test('string value', function() {
    const element = elem('div')`Foo`;
    const translation = {
      value: 'BAR',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML, 'BAR');
  });

  test('one child', function() {
    const element = elem('div')`
      <a href="bar"></a>`;
    const translation = {
      value: 'FOO <a title="BAZ">BAZ</a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      'FOO <a href="bar" title="BAZ">BAZ</a>');
  });

  test('one child with own attributes', function() {
    const element = elem('div')`
      Foo <a href="bar" title="bar">Bar</a>`;
    const translation = {
      value: 'FOO <a href="baz" title="BAZ">BAZ</a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      'FOO <a href="bar" title="BAZ">BAZ</a>');
  });

  test('two children of the same type', function() {
    const element = elem('div')`
      <a href="foo"></a> <a href="bar"></a>`;
    const translation = {
      value: '<a title="FOO">FOO</a> <a title="BAR">BAR</a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      '<a href="foo" title="FOO">FOO</a> <a href="bar" title="BAR">BAR</a>');
  });

  test('two children of different types in order', function() {
    const element = elem('div')`
      <a href="foo"></a> <em class="bar"></em>`;
    const translation = {
      value: '<a title="FOO">FOO</a> <em>BAR</em>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      '<a href="foo" title="FOO">FOO</a> <em class="bar">BAR</em>');
  });

  test('two children of different types not in order', function() {
    const element = elem('div')`
      <a href="foo"></a> <em class="bar"></em>`;
    const translation = {
      value: '<em>BAR</em> <a title="FOO">FOO</a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      '<em class="bar">BAR</em> <a href="foo" title="FOO">FOO</a>');
  });

  test('HTML missing in translation', function() {
    const element = elem('div')`
      Foo <a href="bar" title="bar">Bar</a>`;
    const translation = {
      value: 'FOO BAZ',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      'FOO BAZ');
  });

  test('nested HTML in source', function() {
    const element = elem('div')`
      Foo <a href="bar" title="bar"><em title="qux">Bar</em></a>`;
    const translation = {
      value: 'FOO <a title="BAZ">BAZ</a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      'FOO <a href="bar" title="BAZ">BAZ</a>');
  });

  test('nested HTML in translation', function() {
    const element = elem('div')`
      Foo <a href="bar" title="bar">Bar</a>`;
    const translation = {
      value: 'FOO <a href="baz" title="BAZ"><em>BAZ</em></a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      'FOO <a href="bar" title="BAZ">BAZ</a>');
  });

  test('nested HTML in both', function() {
    const element = elem('div')`
      Foo <a href="bar" title="bar"><em title="qux">Bar</em></a>`;
    const translation = {
      value: 'FOO <a href="baz" title="BAZ"><em>BAZ</em></a>',
      attrs: null
    };

    overlayElement(element, translation);
    assert.equal(element.innerHTML,
      'FOO <a href="bar" title="BAZ">BAZ</a>');
  });
});
