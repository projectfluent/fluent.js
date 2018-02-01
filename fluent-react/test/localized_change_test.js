import React from 'react';
import assert from 'assert';
import { shallow } from 'enzyme';
import { MessageContext } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import { Localized } from '../src/index';

suite('Localized - change messages', function() {
  test('relocalizing', function() {
    const mcx1 = new MessageContext();
    const l10n = new ReactLocalization([mcx1]);

    mcx1.addMessages(`
foo = FOO
`);

    const wrapper = shallow(
      <Localized id="foo">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>FOO</div>
    ));

    const mcx2 = new MessageContext();
    mcx2.addMessages(`
foo = BAR
`);

    l10n.setMessages([mcx2]);

    wrapper.update();
    assert.ok(wrapper.contains(
      <div>BAR</div>
    ));
  });
});
