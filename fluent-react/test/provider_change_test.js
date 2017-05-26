import React from 'react';
import assert from 'assert';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { LocalizationProvider } from '../src/index';

suite('LocalizationProvider - changing props', function() {
  test('does not change the ReactLocalization', function() {
    const wrapper = shallow(
      <LocalizationProvider messages={[]}>
        <div />
      </LocalizationProvider>
    );

    const oldL10n = wrapper.instance().l10n;
    wrapper.setProps({ messages: [] });
    const newL10n = wrapper.instance().l10n;

    assert.equal(oldL10n, newL10n);
  });

  test('calls the ReactLocalization\'s setMessages method', function() {
    const wrapper = shallow(
      <LocalizationProvider messages={[]}>
        <div />
      </LocalizationProvider>
    );

    const spy = sinon.spy(wrapper.instance().l10n, 'setMessages');
    const newMessages = [];
    wrapper.setProps({ messages: newMessages });
    const { args } = spy.getCall(0);
    assert.deepEqual(args, [newMessages]);
  });

  test('changes the ReactLocalization\'s messages contexts', function() {
    const wrapper = shallow(
      <LocalizationProvider messages={[]}>
        <div />
      </LocalizationProvider>
    );

    const oldContexts = wrapper.instance().l10n.contexts;
    wrapper.setProps({ messages: [] });
    const newContexts = wrapper.instance().l10n.contexts;

    assert.notEqual(oldContexts, newContexts);
  });
});
