import React from 'react';
import assert from 'assert';
import { shallow } from 'enzyme';
import { MessageContext } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import { withLocalization, LocalizationProvider } from '../src';

function DummyComponent() {
  return <div />;
}

suite('withLocalization', function() {
  test('render inside of a LocalizationProvider', function() {
    const EnhancedComponent = withLocalization(DummyComponent);

    const wrapper = shallow(
      <LocalizationProvider messages={[]}>
        <EnhancedComponent />
      </LocalizationProvider>
    );
    assert.equal(wrapper.length, 1);
  });

  test('render outside of a LocalizationProvider', function() {
    const EnhancedComponent = withLocalization(DummyComponent);

    const wrapper = shallow(
      <EnhancedComponent />,
    );
    assert.equal(wrapper.length, 1);
  });

  test('getString with access to the l10n context', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);
    const EnhancedComponent = withLocalization(DummyComponent);

    mcx.addMessages(`
foo = FOO
`);

    const wrapper = shallow(
      <EnhancedComponent />,
      { context: { l10n } }
    );

    const getString = wrapper.prop('getString');
    // Returns the translation.
    assert.equal(getString('foo', {}), 'FOO');
  });

  test('getString with access to the l10n context, with fallback value', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);
    const EnhancedComponent = withLocalization(DummyComponent);

    mcx.addMessages(`
foo = FOO
`);

    const wrapper = shallow(
      <EnhancedComponent />,
      { context: { l10n } }
    );

    const getString = wrapper.prop('getString');
    // Returns the translation, even if fallback value provided.
    assert.equal(getString('bar', {}, 'fallback'), 'fallback');
  });

  test('getString without access to the l10n context', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);
    const EnhancedComponent = withLocalization(DummyComponent);

    mcx.addMessages(`
foo = FOO
`);

    const wrapper = shallow(
      <EnhancedComponent />
    );

    const getString = wrapper.prop('getString');
    // Returns the id if no fallback.
    assert.equal(getString('foo', {arg: 1}), 'foo');
  });

  test('getString without access to the l10n context, with fallback value', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);
    const EnhancedComponent = withLocalization(DummyComponent);

    mcx.addMessages(`
foo = FOO
`);

    const wrapper = shallow(
      <EnhancedComponent />
    );

    const getString = wrapper.prop('getString');
    // Returns the fallback if provided.
    assert.equal(getString('foo', {arg: 1}, 'fallback message'), 'fallback message');
  });
});
