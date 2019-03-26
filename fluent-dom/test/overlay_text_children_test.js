import assert from 'assert';
import translateElement from '../src/overlay';
import {elem} from './index';

suite('Text-semantic argument elements', function() {
  test('without data-l10n-name', function() {
    const element = elem('div')`
      <em class="bar"></em>`;
    const translation = {
      value: '<em title="FOO">FOO</em>',
      attributes: null
    };

    translateElement(element, translation);
    assert.equal(
      element.innerHTML,
      '<em class="bar" title="FOO">FOO</em>'
    );
  });

  test('mismatched types', function() {
    const element = elem('div')`
      <button data-l10n-name="foo"></button>`;
    const translation = {
      value: '<em data-l10n-name="foo" title="FOO">FOO</em>',
      attributes: null
    };

    translateElement(element, translation);
    assert.equal(
      element.innerHTML,
      'FOO<button data-l10n-name="foo"></button>'
    );
  });

  test('types and names match', function() {
    const element = elem('div')`
      <em data-l10n-name="foo" class="foo"></em>`;
    const translation = {
      value: '<em data-l10n-name="foo" title="FOO">FOO</em>',
      attributes: null
    };

    translateElement(element, translation);
    assert.equal(
      element.innerHTML,
      '<em data-l10n-name="foo" class="foo" title="FOO">FOO</em>'
    );
  });
});
