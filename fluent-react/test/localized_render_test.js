import React from 'react';
import assert from 'assert';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import { FluentBundle, FluentResource } from '../../fluent-bundle/src';
import ReactLocalization from '../src/localization';
import { Localized } from '../src/index';

suite('Localized - rendering', function() {
  test('render the value', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
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
  });

  test('render an allowed attribute', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo =
    .attr = ATTR
`));

    const wrapper = shallow(
      <Localized id="foo" attrs={{attr: true}}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div attr="ATTR" />
    ));
  });

  test('only render allowed attributes', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo =
    .attr1 = ATTR 1
    .attr2 = ATTR 2
`));

    const wrapper = shallow(
      <Localized id="foo" attrs={{attr2: true}}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div attr2="ATTR 2" />
    ));
  });

  test('filter out forbidden attributes', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo =
    .attr = ATTR
`));

    const wrapper = shallow(
      <Localized id="foo" attrs={{attr: false}}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div />
    ));
  });

  test('filter all attributes if attrs not given', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo =
    .attr = ATTR
`));

    const wrapper = shallow(
      <Localized id="foo">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div />
    ));
  });

  test('preserve existing attributes when setting new ones', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo =
    .attr = ATTR
`));

    const wrapper = shallow(
      <Localized id="foo" attrs={{attr: true}}>
        <div existing={true} />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div existing={true} attr="ATTR" />
    ));
  });

  test('overwrite existing attributes if allowed', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo =
    .existing = ATTR
`));

    const wrapper = shallow(
      <Localized id="foo" attrs={{existing: true}}>
        <div existing={true} />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div existing="ATTR" />
    ));
  });

  test('protect existing attributes if setting is forbidden', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo =
    .existing = ATTR
`));

    const wrapper = shallow(
      <Localized id="foo" attrs={{existing: false}}>
        <div existing={true} />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div existing={true} />
    ));
  });

  test('protect existing attributes by default', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo =
    .existing = ATTR
`));

    const wrapper = shallow(
      <Localized id="foo">
        <div existing={true} />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div existing={true} />
    ));
  });

  test('preserve children when translation value is null', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo =
    .title = TITLE
`));

    const wrapper = shallow(
      <Localized id="foo" attrs={{title: true}}>
        <select>
          <option>Option</option>
        </select>
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <select title="TITLE">
        <option>Option</option>
      </select>
    ));
  });


  test('$arg is passed to format the value', function() {
    const bundle = new FluentBundle("en", {useIsolating: false});
    const formatPattern = sinon.spy(bundle, 'formatPattern');
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo = { $arg }
`));

    const wrapper = shallow(
      <Localized id="foo" $arg="ARG">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    const { args } = formatPattern.getCall(0);
    assert.deepEqual(args[1], { arg: 'ARG' });

    assert.ok(wrapper.contains(
      <div>ARG</div>
    ));
  });

  test('$arg is passed to format the attributes', function() {
    const bundle = new FluentBundle();
    const formatPattern = sinon.spy(bundle, 'formatPattern');
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo = { $arg }
    .title = { $arg }
`));

    const wrapper = shallow(
      <Localized id="foo" attrs={{title: true}} $arg="ARG">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    // The value.
    assert.deepEqual(formatPattern.getCall(0).args[1], { arg: 'ARG' });
    // The attribute.
    assert.deepEqual(formatPattern.getCall(1).args[1], { arg: 'ARG' });

    assert.ok(wrapper.contains(
      <div title="ARG">ARG</div>
    ));
  });

  test('A missing $arg does not break rendering', function() {
    const bundle = new FluentBundle("en", {useIsolating: false});
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo = { $arg }
    .title = { $arg }
`));

    const wrapper = shallow(
      <Localized id="foo" attrs={{title: true}}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div title="{$arg}">{"{$arg}"}</div>
    ));
  });

  test('render with a fragment and no message preserves the fragment',
  function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    const wrapper = shallow(
      <Localized id="foo">
        <React.Fragment>
          <div>Fragment content</div>
        </React.Fragment>
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.equals(
      <React.Fragment>
        <div>Fragment content</div>
      </React.Fragment>
    ));
  });

  test('render with a fragment and no message value preserves the fragment',
  function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);
    bundle.addResource(new FluentResource(`
foo =
    .attr = Attribute
`));

    const wrapper = shallow(
      <Localized id="foo">
        <React.Fragment>
          <div>Fragment content</div>
        </React.Fragment>
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.equals(
      <React.Fragment>
        <div>Fragment content</div>
      </React.Fragment>
    ));
  });

  test('render with a fragment renders the message into the fragment', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);
    bundle.addResource(new FluentResource(`
foo = Test message
`));

    const wrapper = shallow(
      <Localized id="foo">
        <React.Fragment>
          <div>Fragment content</div>
        </React.Fragment>
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.equals(
      <React.Fragment>
        Test message
      </React.Fragment>
    ));
  });

  test('render with an empty fragment and no message preserves the fragment',
  function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    const wrapper = shallow(
      <Localized id="foo">
        <React.Fragment/>
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.equals(
      <React.Fragment/>
    ));
  });

  test('render with an empty fragment and no message value preserves the fragment',
  function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);
    bundle.addResource(new FluentResource(`
foo =
    .attr = Attribute
`));

    const wrapper = shallow(
      <Localized id="foo">
        <React.Fragment/>
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.equals(
      <React.Fragment/>
    ));
  });

  test('render with an empty fragment renders the message into the fragment', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);
    bundle.addResource(new FluentResource(`
foo = Test message
`));

    const wrapper = shallow(
      <Localized id="foo">
        <React.Fragment/>
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.equals(
      <React.Fragment>
        Test message
      </React.Fragment>
    ));
  });

  test('render with a string fallback and no message returns the fallback',
  function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    const wrapper = shallow(
      <Localized id="foo">
        String fallback
      </Localized>,
      { context: { l10n } }
    );

    assert.strictEqual(wrapper.text(), 'String fallback');
  });

  test('render with a string fallback and no message value preserves the fallback',
  function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);
    bundle.addResource(new FluentResource(`
foo =
    .attr = Attribute
`));

    const wrapper = shallow(
      <Localized id="foo">
        String fallback
      </Localized>,
      { context: { l10n } }
    );

    assert.strictEqual(wrapper.text(), 'String fallback');
  });

  test('render with a string fallback returns the message', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);
    bundle.addResource(new FluentResource(`
foo = Test message
`));

    const wrapper = shallow(
      <Localized id="foo">
        String fallback
      </Localized>,
      { context: { l10n } }
    );

    assert.strictEqual(wrapper.text(), 'Test message');
  });

  test('render without a fallback and no message returns nothing',
  function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    const wrapper = shallow(
      <Localized id="foo" />,
      { context: { l10n } }
    );

    assert.strictEqual(wrapper.text(), '');
  });

  test('render without a fallback and no message value returns nothing',
  function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo =
    .attr = Attribute
`));

    const wrapper = shallow(
      <Localized id="foo" />,
      { context: { l10n } }
    );

    assert.strictEqual(wrapper.text(), '');
  });

  test('render without a fallback returns the message', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addResource(new FluentResource(`
foo = Message
`));

    const wrapper = shallow(
      <Localized id="foo" />,
      { context: { l10n } }
    );

    assert.strictEqual(wrapper.text(), 'Message');
  });

});
