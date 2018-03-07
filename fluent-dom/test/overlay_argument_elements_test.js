import assert from 'assert';
import overlayElement from '../src/overlay';
import {elem} from './util';

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
