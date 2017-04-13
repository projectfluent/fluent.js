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
      <LocalizationProvider messages={[]}>
        <div />
      </LocalizationProvider>
    );
    assert.equal(wrapper.length, 1);
  });

  test('without a child', function() {
    function render() {
      shallow(
        <LocalizationProvider messages={[]} />
      );
    }
    assert.throws(render, /a single React element child/);
  });

  test('with multiple children', function() {
    function render() {
      shallow(
        <LocalizationProvider messages={[]}>
          <div />
          <div />
        </LocalizationProvider>
      );
    }
    assert.throws(render, /a single React element child/);
  });

  test('without messages', function() {
    function render() {
      shallow(
        <LocalizationProvider />
      );
    }
    assert.throws(render, /must receive the messages prop/);
  });

  test('without iterable messages', function() {
    function render() {
      shallow(
        <LocalizationProvider messages={0}/>
      );
    }
    assert.throws(render, /must be an iterable/);
  });
});
