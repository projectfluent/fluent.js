import React from 'react';
import assert from 'assert';
import sinon from 'sinon';
import { mount } from 'enzyme';
import MessageContext from './message_context_stub';
import ReactLocalization from '../src/localization';
import { Localized } from '../src/index';

suite('Localized - change messages', function() {
  test('relocalizing', function() {
    const mcx1 = new MessageContext();
    const l10n = new ReactLocalization([mcx1]);

    const wrapper = mount(
      <Localized id="foo">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>FOO</div>
    ));

    const mcx2 = new MessageContext();
    sinon.stub(mcx2, 'getMessage').returns('BAR');
    l10n.setMessages([mcx2]);

    assert.ok(wrapper.contains(
      <div>BAR</div>
    ));
  });
});
