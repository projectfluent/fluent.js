import React from 'react';
import assert from 'assert';
import { mount, shallow } from 'enzyme';
import { FluentBundle, FluentResource } from '../../fluent-bundle/src';
import ReactLocalization from '../src/localization';
import { withLocalization, LocalizationProvider } from '../src';

class DummyComponent extends React.Component {
  static doStaticThing() {
    return "done";
  }

  render() {
    return <div />;
  }
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
    const bundle = new FluentBundle("en", {useIsolating: false});
    const l10n = new ReactLocalization([bundle]);
    const EnhancedComponent = withLocalization(DummyComponent);

    bundle.addResource(new FluentResource(`
foo = FOO
bar = BAR {$arg}
`));

    const wrapper = shallow(
      <EnhancedComponent />,
      { context: { l10n } }
    );

    const getString = wrapper.prop('getString');
    // Returns the translation.
    assert.strictEqual(getString('foo', {}), 'FOO');
    assert.strictEqual(getString('bar', {arg: 'ARG'}), 'BAR ARG');
    // Doesn't throw on formatting errors.
    assert.strictEqual(getString('bar', {}), 'BAR {$arg}');
  });

  test('getString with access to the l10n context, with fallback value', function() {
    const bundle = new FluentBundle("en", {useIsolating: false});
    const l10n = new ReactLocalization([bundle]);
    const EnhancedComponent = withLocalization(DummyComponent);

    bundle.addResource(new FluentResource(`
foo = FOO
bar = BAR {$arg}
`));

    const wrapper = shallow(
      <EnhancedComponent />,
      { context: { l10n } }
    );

    const getString = wrapper.prop('getString');
    // Returns the translation, even if fallback value provided.
    assert.strictEqual(getString('foo', {}, 'fallback'), 'FOO');
    // Returns the fallback.
    assert.strictEqual(getString('missing', {}, 'fallback'), 'fallback');
    assert.strictEqual(getString('bar', {arg: 'ARG'}), 'BAR ARG');
    // Doesn't throw on formatting errors.
    assert.strictEqual(getString('bar', {}), 'BAR {$arg}');
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

  test('static function is hoisted onto the wrapped component', function() {
    const EnhancedComponent = withLocalization(DummyComponent);
    const result = EnhancedComponent.doStaticThing();
    assert.strictEqual(result, "done");
  })
});
