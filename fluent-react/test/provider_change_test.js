import React from 'react';
import assert from 'assert';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { LocalizationProvider } from '../src/index';

suite('LocalizationProvider - changing props', function() {
  test('does not change the ReactLocalization', function() {
    const wrapper = shallow(
      <LocalizationProvider bundles={[]}>
        <div />
      </LocalizationProvider>
    );

    const oldL10n = wrapper.instance().l10n;
    wrapper.setProps({ bundles: [] });
    const newL10n = wrapper.instance().l10n;

    assert.strictEqual(oldL10n, newL10n);
  });

  test('calls the ReactLocalization\'s setBundles method', function() {
    const wrapper = shallow(
      <LocalizationProvider bundles={[]}>
        <div />
      </LocalizationProvider>
    );

    const spy = sinon.spy(wrapper.instance().l10n, 'setBundles');
    const newMessages = [];
    wrapper.setProps({ bundles: newMessages });
    const { args } = spy.getCall(0);
    assert.deepEqual(args, [newMessages]);
  });

  test('changes the ReactLocalization\'s bundles bundles', function() {
    const wrapper = shallow(
      <LocalizationProvider bundles={[]}>
        <div />
      </LocalizationProvider>
    );

    const oldContexts = wrapper.instance().l10n.bundles;
    wrapper.setProps({ bundles: [] });
    const newContexts = wrapper.instance().l10n.bundles;

    assert.notEqual(oldContexts, newContexts);
  });
});
