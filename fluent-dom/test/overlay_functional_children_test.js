import assert from 'assert';
import translateElement from '../src/overlay';
import {elem} from './index';

suite('Child without name', function() {
  test('in source', function() {
    const element = elem('div')`
      <button>Foo</button>`;
    const translation = {
      value: 'FOO',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      'FOO'
    );
  });

  test('in translation', function() {
    const element = elem('div')`Foo`;
    const translation = {
      value: '<button>FOO</button>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      'FOO'
    );
  });

  test('in both', function() {
    const element = elem('div')`
      <button>Foo</button>`;
    const translation = {
      value: '<button>FOO</button>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      'FOO'
    );
  });
});

suite('Child with name', function() {
  test('in source', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">Foo</button>`;
    const translation = {
      value: '<button>FOO</button>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      'FOO'
    );
  });

  test('in translation', function() {
    const element = elem('div')`
      <button>Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo">FOO</button>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      'FOO'
    );
  });

  test('in both', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo">FOO</button>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      '<button data-l10n-name="foo">FOO</button>'
    );
  });

  test('translation without text content', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo"></button>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      '<button data-l10n-name="foo"></button>'
    );
  });

  test('different names', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="bar">BAR</button>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      'BAR'
    );
  });

  test('of different type', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">Foo</button>`;
    const translation = {
      value: '<div data-l10n-name="foo">FOO</div>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      'FOO'
    );
  });

  test('used twice', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo">FOO 1</button> <button data-l10n-name="foo">FOO 2</button>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      '<button data-l10n-name="foo">FOO 1</button> FOO 2'
    );
  });
});

suite('Two named children', function() {
  test('in order', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">Foo</button>
      <button data-l10n-name="bar">Bar</button>`;
    const translation = {
      value: '<button data-l10n-name="foo">FOO</button><button data-l10n-name="bar">BAR</button>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      '<button data-l10n-name="foo">FOO</button><button data-l10n-name="bar">BAR</button>'
    );
  });

  test('out of order', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">Foo</button>
      <button data-l10n-name="bar">Bar</button>`;
    const translation = {
      value: '<button data-l10n-name="bar">BAR</button><button data-l10n-name="foo">FOO</button>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      '<button data-l10n-name="bar">BAR</button><button data-l10n-name="foo">FOO</button>'
    );
  });

  test('nested in source', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">
        Foo 1
        <button data-l10n-name="bar">Bar</button>
        Foo 2
      </button>`;
    const translation = {
      value: '<button data-l10n-name="foo">FOO</button><button data-l10n-name="bar">BAR</button>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      '<button data-l10n-name="foo">FOO</button><button data-l10n-name="bar">BAR</button>'
    );
  });

  test('nested in translation', function() {
    // Buttons can't be nested. Let's use divs for this test.
    const element = elem('div')`
      <div data-l10n-name="foo">Foo</div>
      <div data-l10n-name="bar">Bar</div>`;
    const translation = {
      value: '<div data-l10n-name="foo">FOO 1 <div data-l10n-name="bar">BAR</div> FOO 2</div>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(
      element.innerHTML,
      '<div data-l10n-name="foo">FOO 1 BAR FOO 2</div>'
    );
  });
});

suite('Child attributes', function() {
  test('functional attribute in source', function() {
    const element = elem('div')`
      <button data-l10n-name="foo" class="foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo">FOO</a>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML,
      '<button data-l10n-name="foo" class="foo">FOO</button>');
  });

  test('functional attribute in translation', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo" class="bar">FOO</a>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML,
      '<button data-l10n-name="foo">FOO</button>');
  });

  test('functional attribute in both', function() {
    const element = elem('div')`
      <button data-l10n-name="foo" class="foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo" class="bar">FOO</a>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML,
      '<button data-l10n-name="foo" class="foo">FOO</button>');
  });

  test('localizable attribute in source', function() {
    const element = elem('div')`
      <button data-l10n-name="foo" title="Foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo">FOO</a>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML,
      '<button data-l10n-name="foo">FOO</button>');
  });

  test('localizable attribute in translation', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo" title="FOO">FOO</a>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML,
      '<button data-l10n-name="foo" title="FOO">FOO</button>');
  });

  test('localizable attribute in both', function() {
    const element = elem('div')`
      <button data-l10n-name="foo" title="Foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo" title="BAR">FOO</a>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML,
      '<button data-l10n-name="foo" title="BAR">FOO</button>');
  });

  test('localizable attribute does not leak on retranslation', function() {
    const element = elem('div')`
      <button data-l10n-name="foo">Foo</button>`;
    const translationA = {
      value: '<button data-l10n-name="foo" title="FOO A">FOO A</a>',
      attributes: null
    };
    const translationB = {
      value: '<button data-l10n-name="foo">FOO B</a>',
      attributes: null
    };

    translateElement(element, translationA);
    assert.strictEqual(element.innerHTML,
      '<button data-l10n-name="foo" title="FOO A">FOO A</button>');
    translateElement(element, translationB);
    assert.strictEqual(element.innerHTML,
      '<button data-l10n-name="foo">FOO B</button>');
  });
});

suite('Child attributes overrides', function() {
  test('the source can override child\'s attributes', function() {
    const element = elem('div')`
      <button data-l10n-name="foo" data-l10n-attrs="class" class="foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo" class="FOO">FOO</a>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML,
      '<button data-l10n-name="foo" data-l10n-attrs="class" class="FOO">FOO</button>');
  });

  test('the translation cannot override child\'s attributes', function() {
    const element = elem('div')`
      <button data-l10n-name="foo" class="foo">Foo</button>`;
    const translation = {
      value: '<button data-l10n-name="foo" data-l10n-attrs="class" class="FOO">FOO</a>',
      attributes: null
    };

    translateElement(element, translation);
    assert.strictEqual(element.innerHTML,
      '<button data-l10n-name="foo" class="foo">FOO</button>');
  });
});
