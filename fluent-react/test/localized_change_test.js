import React from 'react';
import assert from 'assert';
import { shallow } from 'enzyme';
import { FluentBundle, FluentResource } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import { Localized } from '../src/index';

suite('Localized - change bundles', function() {
  test('relocalizing', function() {
    const bundle1 = new FluentBundle();
    const l10n = new ReactLocalization([bundle1]);

    bundle1.addResource(new FluentResource(`
foo = FOO
`));

    const wrapper = shallow(
      <Localized id="foo">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>FOO</div>
    ));

    const bundle2 = new FluentBundle();
    bundle2.addResource(new FluentResource(`
foo = BAR
`));

    l10n.setBundles([bundle2]);

    wrapper.update();
    assert.ok(wrapper.contains(
      <div>BAR</div>
    ));
  });
});
