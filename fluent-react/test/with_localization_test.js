import React from 'react';
import assert from 'assert';
import { mount, shallow } from 'enzyme';
import { FluentBundle, FluentResource } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import { withLocalization, LocalizationProvider } from '../src';

function DummyComponent() {
  return <div />;
}

suite('withLocalization', function() {
  test('render inside of a LocalizationProvider', function() {
    const EnhancedComponent = withLocalization(DummyComponent);

    const wrapper = shallow(
      <LocalizationProvider bundles={[]}>
        <EnhancedComponent />
      </LocalizationProvider>
    );
    assert.strictEqual(wrapper.length, 1);
  });

  test('render outside of a LocalizationProvider', function() {
    const EnhancedComponent = withLocalization(DummyComponent);

    const wrapper = shallow(
      <EnhancedComponent />,
    );
    assert.strictEqual(wrapper.length, 1);
  });

  test('getString with access to the l10n context', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);
    const EnhancedComponent = withLocalization(DummyComponent);

    bundle.addResource(new FluentResource(`
foo = FOO
`));

    const wrapper = shallow(
      <EnhancedComponent />,
      { context: { l10n } }
    );

    const getString = wrapper.prop('getString');
    // Returns the translation.
    assert.strictEqual(getString('foo', {}), 'FOO');
  });

  test('getString with access to the l10n context, with fallback value', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);
    const EnhancedComponent = withLocalization(DummyComponent);

    bundle.addResource(new FluentResource(`
foo = FOO
`));

    const wrapper = shallow(
      <EnhancedComponent />,
      { context: { l10n } }
    );

    const getString = wrapper.prop('getString');
    // Returns the translation, even if fallback value provided.
    assert.strictEqual(getString('bar', {}, 'fallback'), 'fallback');
  });

  test('getString without access to the l10n context', function() {
    const EnhancedComponent = withLocalization(DummyComponent);

    const wrapper = shallow(
      <EnhancedComponent />
    );

    const getString = wrapper.prop('getString');
    // Returns the id if no fallback.
    assert.strictEqual(getString('foo', {arg: 1}), 'foo');
  });

  test('getString without access to the l10n context, with fallback value', function() {
    const EnhancedComponent = withLocalization(DummyComponent);

    const wrapper = shallow(
      <EnhancedComponent />
    );

    const getString = wrapper.prop('getString');
    // Returns the fallback if provided.
    assert.strictEqual(getString('foo', {arg: 1}, 'fallback message'), 'fallback message');
  });

  test('getString with access to the l10n context, with message changes', function() {
    const initialBundle = new FluentBundle();
    const l10n = new ReactLocalization([initialBundle]);
    const EnhancedComponent = withLocalization(({ getString }) => getString('foo'));

    initialBundle.addResource(new FluentResource('foo = FOO'));

    const wrapper = mount(
      <EnhancedComponent />,
      { context: { l10n } }
    );

    assert.strictEqual(wrapper.text(), 'FOO');

    const newBundle = new FluentBundle();
    newBundle.addResource(new FluentResource('foo = BAR'));
    l10n.setBundles([newBundle]);

    wrapper.update();
    assert.strictEqual(wrapper.text(), 'BAR');
  })
});
