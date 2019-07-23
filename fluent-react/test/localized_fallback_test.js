import React from 'react';
import assert from 'assert';
import { shallow } from 'enzyme';
import { FluentBundle, FluentResource } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import { Localized } from '../src/index';

suite('Localized - fallback', function() {
  test('message id in the first context', function() {
    const bundle1 = new FluentBundle();
    const l10n = new ReactLocalization([bundle1]);

    bundle1.addResource(new FluentResource(`
foo = FOO
`));

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
    const bundle1 = new FluentBundle();
    const bundle2 = new FluentBundle();
    const l10n = new ReactLocalization([bundle1, bundle2]);

    bundle1.addResource(new FluentResource(`
not-foo = NOT FOO
`));
    bundle2.addResource(new FluentResource(`
foo = FOO
`));

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
    const bundle1 = new FluentBundle();
    const l10n = new ReactLocalization([bundle1]);

    bundle1.addResource(new FluentResource(`
not-foo = NOT FOO
`));

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
