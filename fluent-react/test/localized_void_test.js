import React from 'react';
import assert from 'assert';
import { shallow } from 'enzyme';
import { FluentBundle } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import { Localized } from '../src/index';

suite('Localized - void elements', function() {
  test('do not render the value in void elements', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = FOO
`)

    const wrapper = shallow(
      <Localized id="foo">
        <input />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <input />
    ));
  });

  test('render attributes in void elements', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo =
    .title = TITLE
`)

    const wrapper = shallow(
      <Localized id="foo" attrs={{title: true}}>
        <input />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <input title="TITLE" />
    ));
  });

  test('render attributes but not value in void elements', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = FOO
    .title = TITLE
`)

    const wrapper = shallow(
      <Localized id="foo" attrs={{title: true}}>
        <input />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <input title="TITLE" />
    ));
  });
});
