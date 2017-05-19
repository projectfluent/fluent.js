import React from 'react';
import assert from 'assert';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import MessageContext from './message_context_stub';
import Localization from '../src/localization';
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

  test('formatString with access to the l10n context', function() {
    const mcx = new MessageContext();
    const l10n = new Localization([mcx]);
    const EnhancedComponent = withLocalization(DummyComponent);

    const wrapper = shallow(
      <EnhancedComponent />,
      { context: { l10n } }
    );

    const formatString = wrapper.prop('formatString');
    assert.equal(formatString('foo'), 'FOO');
  });

  test('formatString without access to the l10n context', function() {
    const mcx = new MessageContext();
    const l10n = new Localization([mcx]);
    const EnhancedComponent = withLocalization(DummyComponent);

    const wrapper = shallow(
      <EnhancedComponent />
    );

    const formatString = wrapper.prop('formatString');
    assert.throws(formatString, /descendant of a LocalizationProvider/);
  });
});
