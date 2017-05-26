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
      <LocalizationProvider messages={[]}>
        <Localized>
          <div />
        </Localized>
      </LocalizationProvider>
    );
    assert.equal(wrapper.length, 1);
  });

  test('outside of a LocalizationProvider', function() {
    function render() {
      shallow(
        <Localized />
      );
    }
    assert.throws(render, /descendant of a LocalizationProvider/);
  });

  test('with a manually set context', function() {
    const wrapper = shallow(
      <Localized>
        <div />
      </Localized>,
      { context: { l10n: new ReactLocalization([]) } }
    );
    assert.equal(wrapper.length, 1);
  });

  test('without a child', function() {
    function render() {
      shallow(
        <Localized />,
        { context: { l10n: new ReactLocalization([]) } }
      );
    }
    assert.throws(render, /a single React element child/);
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
    assert.throws(render, /a single React element child/);
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
