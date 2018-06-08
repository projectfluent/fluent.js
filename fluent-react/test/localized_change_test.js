import React from 'react';
import assert from 'assert';
import { shallow } from 'enzyme';
import { MessageContext } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import CachedAsyncIterable from '../src/cached_async_iterable';
import { Localized } from '../src/index';

suite.only('Localized - change messages', function() {
  test('relocalizing', async function() {
    const mcx1 = new MessageContext();
    const contexts1 = new CachedAsyncIterable([mcx1]);
    await contexts1.touchNext(1);
    const l10n = new ReactLocalization(contexts1);

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

    const contexts2 = new CachedAsyncIterable([mcx2]);
    await contexts2.touchNext(1);
    l10n.setMessages(contexts2);

    wrapper.update();
    assert.ok(wrapper.contains(
      <div>BAR</div>
    ));
  });
});
