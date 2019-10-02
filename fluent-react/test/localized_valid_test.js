import React from 'react';
import assert from 'assert';
import { shallow } from 'enzyme';
import { LocalizationProvider, Localized } from '../src/index';
import ReactLocalization from '../src/localization';

suite('Localized - validation', function() {
  suiteSetup(function() {
    this.error = console.error;
    console.error = () => {};
  });

  suiteTeardown(function() {
    console.error = this.error;
  });

  test('inside of a LocalizationProvider', function() {
    const wrapper = shallow(
      <LocalizationProvider bundles={[]}>
        <Localized>
          <div />
        </Localized>
      </LocalizationProvider>
    );
    assert.strictEqual(wrapper.length, 1);
  });

  test('outside of a LocalizationProvider', function() {
    const wrapper = shallow(
      <Localized>
        <div />
      </Localized>
    );
    assert.strictEqual(wrapper.find('div').length, 1);
  });

  test('with a manually set context', function() {
    const wrapper = shallow(
      <Localized>
        <div />
      </Localized>,
      { context: { l10n: new ReactLocalization([]) } }
    );
    assert.strictEqual(wrapper.length, 1);
  });

  test('without a child', function() {
    const wrapper = shallow(
      <Localized />,
      { context: { l10n: new ReactLocalization([]) } }
    );
    assert.strictEqual(wrapper.length, 1);
  });

  test('with multiple children', function() {
    function render() {
      shallow(
        <Localized>
          <div />
          <div />
        </Localized>,
        { context: { l10n: new ReactLocalization([]) } }
      );
    }
    assert.throws(render, /a single React node child/);
  });

  test('without id', function() {
    const wrapper = shallow(
      <Localized>
        <div />
      </Localized>,
      { context: { l10n: new ReactLocalization([]) } }
    );
    assert.ok(wrapper.contains(
      <div />
    ));
  });
});
