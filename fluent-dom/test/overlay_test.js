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

suite('Filtering top-level attributes', function() {
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
      'FOO <a title="BAZ" href="bar">BAZ</a>');
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
      'FOO <a title="BAZ" href="bar">BAZ</a>');
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
      '<a title="FOO" href="foo">FOO</a> <a title="BAR" href="bar">BAR</a>');
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
      '<a title="FOO" href="foo">FOO</a> <em class="bar">BAR</em>');
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
      '<em class="bar">BAR</em> <a title="FOO" href="foo">FOO</a>');
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
      'FOO <a title="BAZ" href="bar">BAZ</a>');
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
      'FOO <a title="BAZ" href="bar">BAZ</a>');
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
      'FOO <a title="BAZ" href="bar">BAZ</a>');
  });
});

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
