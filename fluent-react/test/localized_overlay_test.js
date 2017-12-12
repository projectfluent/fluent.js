import React from 'react';
import assert from 'assert';
import { shallow } from 'enzyme';
import { MessageContext } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import { Localized } from '../src/index';

suite('Localized - overlay', function() {;

  test('< in text', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
true = 0 < 3 is true.
`)

    const wrapper = shallow(
      <Localized id="true">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        0 {'<'} 3 is true.
      </div>
    ));
  });

  test('one element is matched', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = Click <button>me</button>!
`)

    const wrapper = shallow(
      <Localized id="foo" button={<button onClick={alert}></button>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        Click <button onClick={alert}>me</button>!
      </div>
    ));
  });

  test('two elements are matched', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = <confirm>Sign in</confirm> or <cancel>cancel</cancel>.
`)

    const wrapper = shallow(
      <Localized id="foo"
        confirm={<button className="confirm"></button>}
        cancel={<button className="cancel"></button>}
      >
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        <button className="confirm">Sign in</button> or <button className="cancel">cancel</button>.
      </div>
    ));
  });

  test('unexpected child is reduced to text', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = <confirm>Sign in</confirm> or <cancel>cancel</cancel>.
`)

    const wrapper = shallow(
      <Localized id="foo"
        confirm={<button className="confirm"></button>}
      >
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        <button className="confirm">Sign in</button> or cancel.
      </div>
    ));
  });

  test('element not found in the translation is removed', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = <confirm>Sign in</confirm>.
`)

    const wrapper = shallow(
      <Localized id="foo"
        confirm={<button className="confirm"></button>}
        cancel={<button className="cancel"></button>}
      >
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        <button className="confirm">Sign in</button>.
      </div>
    ));
  });

  test('void element is matched', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = My name is <input/>.
`)

    const wrapper = shallow(
      <Localized id="foo" input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        My name is <input type="text" />.
      </div>
    ));
  });

  // XXX https://github.com/projectfluent/fluent.js/issues/105
  test.skip('void element with invalid content', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = My name is <input>invalid text content</input>.
`)

    const wrapper = shallow(
      <Localized id="foo" input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        My name is <input type="text" />.
      </div>
    ));
  });

  test('attributes on translated children are ignored', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = Click <button className="foo">me</button>!
`)

    const wrapper = shallow(
      <Localized id="foo" button={<button onClick={alert}></button>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        Click <button onClick={alert}>me</button>!
      </div>
    ));
  });

  test('nested children are ignored', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = Click <button><em>me</em></button>!
`)

    const wrapper = shallow(
      <Localized id="foo" button={<button onClick={alert}></button>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        Click <button onClick={alert}>me</button>!
      </div>
    ));
  });

});
