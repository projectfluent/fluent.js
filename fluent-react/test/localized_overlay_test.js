import React from 'react';
import assert from 'assert';
import { render, shallow } from 'enzyme';
import { MessageContext } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import { parseMarkup } from '../src/markup';
import { LocalizationProvider, Localized } from '../src/index';

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

  test('& in text', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
megaman = Jumping & Shooting
`)

    const wrapper = shallow(
      <Localized id="megaman">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        Jumping & Shooting
      </div>
    ));
  });

  test('HTML entity', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
two = First &middot; Second
`)

    const wrapper = shallow(
      <Localized id="two">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        First · Second
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

  test('an element of different case is matched', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = Click <button>me</button>!
`)

    // The Button prop is capitalized whereas the <button> element in the
    // translation is all lowercase. Since we're using DOM localNames, they
    // should still match.
    const wrapper = shallow(
      <Localized id="foo" Button={<button onClick={alert}></button>}>
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

  test('non-React element prop is used in markup', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = <confirm>Sign in</confirm>.
`)

    const wrapper = shallow(
      <Localized id="foo" confirm="Not a React element">
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        Sign in.
      </div>
    ));
  });

});

suite('Localized - overlay of void elements', function() {;
  test('void prop name, void prop value, void translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <input/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('void prop name, void prop value, empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <input></input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('void prop name, void prop value, non-empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <input>Foo</input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    // The opening <input> tag is parsed as an HTMLInputElement and the closing
    // </input> is ignored. "Foo" is then parsed as a regular text node.
    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" />Foo AFTER
      </div>
    ));
  });

  test('void prop name, non-empty prop value, void translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <input/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>{""}</span> AFTER
      </div>
    ));
  });

  test('void prop name, non-empty prop value, empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <input></input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>{""}</span> AFTER
      </div>
    ));
  });

  test('void prop name, non-empty prop value, non-empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <input>Foo</input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    // The opening <input> tag is parsed as an HTMLInputElement and the closing
    // </input> is ignored. "Foo" is then parsed as a regular text node.
    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>{""}</span>Foo AFTER
      </div>
    ));
  });

  test('non-void prop name, void prop value, void translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <span/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    // XXX HTML parser breaks self-closing elements
    // https://github.com/projectfluent/fluent.js/issues/188
    // <span/> is parsed as an unclosed <span> element. Everything that follows
    // it becomes its children and is ignored because the <input> passed as a
    // prop is known to be void.
    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" />
      </div>
    ));
  });

  test('non-void prop name, void prop value, empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <span></span> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('non-void prop name, void prop value, non-empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <span>Foo</span> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('non-void prop name, non-empty prop value, void translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <span/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    // XXX HTML parser breaks self-closing elements
    // https://github.com/projectfluent/fluent.js/issues/188
    // <span/> is parsed as an unclosed <span> element. Everything that follows
    // it becomes its children and is inserted into the <span> passed as a prop.
    assert.ok(wrapper.contains(
      <div>
        BEFORE <span> AFTER</span>
      </div>
    ));
  });

  test('non-void prop name, non-empty prop value, empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <span></span> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>{""}</span> AFTER
      </div>
    ));
  });

  test('non-void prop name, non-empty prop value, non-empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <span>Foo</span> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>Foo</span> AFTER
      </div>
    ));
  });

  test('custom prop name, void prop value, void translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <text-input/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    // XXX HTML parser breaks self-closing elements
    // https://github.com/projectfluent/fluent.js/issues/188
    // <text-input/> is parsed as an unclosed <text-input> custom element.
    // Everything that follows it becomes its children which are ignored because
    // the <input> passed as a prop is known to be void.
    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" />
      </div>
    ));
  });

  test('custom prop name, void prop value, empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <text-input></text-input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('custom prop name, void prop value, non-empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <text-input>Foo</text-input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('custom prop name, non-empty prop value, void translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <text-elem/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-elem={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    // XXX HTML parser breaks self-closing elements
    // https://github.com/projectfluent/fluent.js/issues/188
    // <text-elem/> is parsed as an unclosed <text-elem> custom element.
    // Everything that follows it becomes its children which are inserted into
    // the <span> passed as a prop.
    assert.ok(wrapper.contains(
      <div>
        BEFORE <span> AFTER</span>
      </div>
    ));
  });

  test('custom prop name, non-empty prop value, empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <text-elem></text-elem> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-elem={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>{""}</span> AFTER
      </div>
    ));
  });

  test('custom prop name, non-empty prop value, non-empty translation', function() {
    const mcx = new MessageContext();
    const l10n = new ReactLocalization([mcx]);

    mcx.addMessages(`
foo = BEFORE <text-elem>Foo</text-elem> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-elem={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>Foo</span> AFTER
      </div>
    ));
  });

  test('custom markup parser passed in from LocalizationProvider', function() {
    let parseMarkupCalls = [];
    function testParseMarkup(str) {
      parseMarkupCalls.push(str);
      return parseMarkup(str);
    }

    const mcx = new MessageContext();
    mcx.addMessages(`
foo = test <text-elem>custom markup parser</text-elem>
`);

    const wrapper = render(
      <LocalizationProvider messages={[mcx]} parseMarkup={testParseMarkup}>
        <Localized id="foo" text-elem={<span>not used</span>}>
          <div/>
        </Localized>
      </LocalizationProvider>      
    );

    assert.deepEqual(parseMarkupCalls, ['test <text-elem>custom markup parser</text-elem>']);
  });

});
