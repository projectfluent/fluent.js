import React from 'react';
import assert from 'assert';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { MessageContext } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import { Localized } from '../src/index';

suite('Localized - rendering', function() {
  test('rendering the value', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = FOO
`)

    const wrapper = shallow(
      <Localized id="foo">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>FOO</div>
    ));
  });

  test('rendering the attributes', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo
    .attr = ATTR
`)

    const wrapper = shallow(
      <Localized id="foo">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div attr="ATTR" />
    ));
  });

  test('preserves existing attributes', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo
    .attr = ATTR
`)

    const wrapper = shallow(
      <Localized id="foo">
        <div existing={true} />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div existing={true} attr="ATTR" />
    ));
  });

  test('$arg is passed to format the value', function() {
    const mcx = new MessageContext();
    const format = sinon.spy(mcx, 'format');
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = { $arg }
`)

    const wrapper = shallow(
      <Localized id="foo" $arg="ARG">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    const { args } = format.getCall(0);
    assert.deepEqual(args[1], { arg: 'ARG' });
  });

  test('$arg is passed to format the attributes', function() {
    const mcx = new MessageContext();
    const format = sinon.spy(mcx, 'format');
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = { $arg }
    .attr = { $arg }
`)

    const wrapper = shallow(
      <Localized id="foo" $arg="ARG">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    const { args } = format.getCall(0);
    assert.deepEqual(args[1], { arg: 'ARG' });
  });
});
