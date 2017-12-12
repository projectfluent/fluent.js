import React from 'react';
import assert from 'assert';
import { shallow } from 'enzyme';
import { MessageContext } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import { Localized } from '../src/index';

suite('Localized - fallback', function() {
  test('message id in the first context', function() {
    const mcx1 = new MessageContext();
    const l10n = new ReactLocalization([mcx1]);

    mcx1.addMessages(`
foo = FOO
`);

    const wrapper = shallow(
      <Localized id="foo">
        <div>Bar</div>
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>FOO</div>
    ));
  });

  test('message id in the second context', function() {
    const mcx1 = new MessageContext();
    const mcx2 = new MessageContext();
    const l10n = new ReactLocalization([mcx1, mcx2]);

    mcx1.addMessages(`
not-foo = NOT FOO
`);
    mcx2.addMessages(`
foo = FOO
`);

    const wrapper = shallow(
      <Localized id="foo">
        <div>Bar</div>
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>FOO</div>
    ));
  });

  test('missing message', function() {
    const mcx1 = new MessageContext();
    const l10n = new ReactLocalization([mcx1]);

    mcx1.addMessages(`
not-foo = NOT FOO
`);

    const wrapper = shallow(
      <Localized id="foo">
        <div>Bar</div>
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>Bar</div>
    ));
  });
});
