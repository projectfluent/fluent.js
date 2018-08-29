import React from 'react';
import assert from 'assert';
import { shallow } from 'enzyme';
import { FluentBundle } from '../../fluent/src';
import ReactLocalization from '../src/localization';
import createParseMarkup from '../src/markup';
import { Localized } from '../src/index';

suite('Localized - overlay', function() {;
  let parseMarkup = createParseMarkup();

  test('< in text', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
true = 0 < 3 is true.
`)

    const wrapper = shallow(
      <Localized id="true">
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        0 {'<'} 3 is true.
      </div>
    ));
  });

  test('& in text', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
megaman = Jumping & Shooting
`)

    const wrapper = shallow(
      <Localized id="megaman">
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        Jumping & Shooting
      </div>
    ));
  });

  test('HTML entity', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
two = First &middot; Second
`)

    const wrapper = shallow(
      <Localized id="two">
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        First · Second
      </div>
    ));
  });

  test('one element is matched', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = Click <button>me</button>!
`)

    const wrapper = shallow(
      <Localized id="foo" button={<button onClick={alert}></button>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        Click <button onClick={alert}>me</button>!
      </div>
    ));
  });

  test('an element of different case is matched', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = Click <button>me</button>!
`)

    // The Button prop is capitalized whereas the <button> element in the
    // translation is all lowercase. Since we're using DOM localNames, they
    // should still match.
    const wrapper = shallow(
      <Localized id="foo" Button={<button onClick={alert}></button>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        Click <button onClick={alert}>me</button>!
      </div>
    ));
  });

  test('two elements are matched', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = <confirm>Sign in</confirm> or <cancel>cancel</cancel>.
`)

    const wrapper = shallow(
      <Localized id="foo"
        confirm={<button className="confirm"></button>}
        cancel={<button className="cancel"></button>}
      >
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        <button className="confirm">Sign in</button> or <button className="cancel">cancel</button>.
      </div>
    ));
  });

  test('unexpected child is reduced to text', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = <confirm>Sign in</confirm> or <cancel>cancel</cancel>.
`)

    const wrapper = shallow(
      <Localized id="foo"
        confirm={<button className="confirm"></button>}
      >
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        <button className="confirm">Sign in</button> or cancel.
      </div>
    ));
  });

  test('element not found in the translation is removed', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = <confirm>Sign in</confirm>.
`)

    const wrapper = shallow(
      <Localized id="foo"
        confirm={<button className="confirm"></button>}
        cancel={<button className="cancel"></button>}
      >
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        <button className="confirm">Sign in</button>.
      </div>
    ));
  });

  test('attributes on translated children are ignored', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = Click <button className="foo">me</button>!
`)

    const wrapper = shallow(
      <Localized id="foo" button={<button onClick={alert}></button>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        Click <button onClick={alert}>me</button>!
      </div>
    ));
  });

  test('nested children are ignored', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = Click <button><em>me</em></button>!
`)

    const wrapper = shallow(
      <Localized id="foo" button={<button onClick={alert}></button>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        Click <button onClick={alert}>me</button>!
      </div>
    ));
  });

  test('non-React element prop is used in markup', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = <confirm>Sign in</confirm>.
`)

    const wrapper = shallow(
      <Localized id="foo" confirm="Not a React element">
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        Sign in.
      </div>
    ));
  });

  test("markup in element's child are used for missing message", function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);
  
    // Message is not defined in the bundle, but we can default to 
    // the elements child if it is just a string.
    const wrapper = shallow(
      <Localized id="foo" button={<button onClick={alert}></button>}>
        <div>
          {"Click <button>me</button>!"}
        </div>
      </Localized>,
      { context: { l10n, parseMarkup } }
    );
  
    assert.ok(wrapper.contains(
      <div>
        Click <button onClick={alert}>me</button>!
      </div>
    ));
  });
});

suite('Localized - overlay of void elements', function() {;
  let parseMarkup = createParseMarkup();

  test('void prop name, void prop value, void translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <input/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('void prop name, void prop value, empty translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <input></input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('void prop name, void prop value, non-empty translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <input>Foo</input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
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
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <input/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>{""}</span> AFTER
      </div>
    ));
  });

  test('void prop name, non-empty prop value, empty translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <input></input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>{""}</span> AFTER
      </div>
    ));
  });

  test('void prop name, non-empty prop value, non-empty translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <input>Foo</input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" input={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
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
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <span/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
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
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <span></span> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('non-void prop name, void prop value, non-empty translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <span>Foo</span> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('non-void prop name, non-empty prop value, void translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <span/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
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
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <span></span> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>{""}</span> AFTER
      </div>
    ));
  });

  test('non-void prop name, non-empty prop value, non-empty translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <span>Foo</span> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" span={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>Foo</span> AFTER
      </div>
    ));
  });

  test('custom prop name, void prop value, void translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <text-input/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
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
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <text-input></text-input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('custom prop name, void prop value, non-empty translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <text-input>Foo</text-input> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-input={<input type="text" />}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <input type="text" /> AFTER
      </div>
    ));
  });

  test('custom prop name, non-empty prop value, void translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <text-elem/> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-elem={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
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
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <text-elem></text-elem> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-elem={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>{""}</span> AFTER
      </div>
    ));
  });

  test('custom prop name, non-empty prop value, non-empty translation', function() {
    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
foo = BEFORE <text-elem>Foo</text-elem> AFTER
`)

    const wrapper = shallow(
      <Localized id="foo" text-elem={<span>Hardcoded</span>}>
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        BEFORE <span>Foo</span> AFTER
      </div>
    ));
  });
});

suite('Localized - custom parseMarkup', function() {;
  test('is called if defined in the context', function() {
    let parseMarkupCalls = [];
    function parseMarkup(str) {
      parseMarkupCalls.push(str);
      return createParseMarkup()(str);
    }

    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
# We must use an HTML tag to trigger the overlay logic.
foo = test <em>custom markup parser</em>
`);

    shallow(
      <Localized id="foo">
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.deepEqual(parseMarkupCalls, ['test <em>custom markup parser</em>']);
  });

  test('custom sanitization logic', function() {
    function parseMarkup(str) {
      return [
        {
          TEXT_NODE: 3,
          nodeType: 3,
          textContent: str.toUpperCase()
        }
      ];
    }

    const bundle = new FluentBundle();
    const l10n = new ReactLocalization([bundle]);

    bundle.addMessages(`
# We must use an HTML tag to trigger the overlay logic.
foo = test <em>custom markup parser</em>
`);

    const wrapper = shallow(
      <Localized id="foo">
        <div />
      </Localized>,
      { context: { l10n, parseMarkup } }
    );

    assert.ok(wrapper.contains(
      <div>
        TEST &lt;EM&gt;CUSTOM MARKUP PARSER&lt;/EM&gt;
      </div>
    ));
  });
});