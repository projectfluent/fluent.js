import React from 'react';
import assert from 'assert';
import { shallow } from 'enzyme';
import { LocalizationProvider } from '../src/index';

suite('LocalizationProvider - validation', function() {
  suiteSetup(function() {
    this.error = console.error;
    console.error = () => {};
  });

  suiteTeardown(function() {
    console.error = this.error;
  });

  test('valid use', function() {
    const wrapper = shallow(
      <LocalizationProvider bundles={[]}>
        <div />
      </LocalizationProvider>
    );
    assert.strictEqual(wrapper.length, 1);
  });

  test('without a child', function() {
    function render() {
      shallow(
        <LocalizationProvider bundles={[]} />
      );
    }
    assert.throws(render, /a single React element child/);
  });

  test('with multiple children', function() {
    function render() {
      shallow(
        <LocalizationProvider bundles={[]}>
          <div />
          <div />
        </LocalizationProvider>
      );
    }
    assert.throws(render, /a single React element child/);
  });

  test('without bundles', function() {
    function render() {
      shallow(
        <LocalizationProvider />
      );
    }
    assert.throws(render, /must receive the bundles prop/);
  });

  test('without iterable bundles', function() {
    function render() {
      shallow(
        <LocalizationProvider bundles={0}/>
      );
    }
    assert.throws(render, /must be an iterable/);
  });
});
