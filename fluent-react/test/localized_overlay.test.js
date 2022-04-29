import React from "react";
import TestRenderer from "react-test-renderer";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { createParseMarkup } from "../esm/markup.js";
import {
  ReactLocalization,
  LocalizationProvider,
  Localized,
} from "../esm/index.js";

describe("Localized - overlay", () => {
  test("< in text", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
true = 0 < 3 is true.
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="true">
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div>
                    0 &lt; 3 is true.
                  </div>
            `);
  });

  test("& in text", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
megaman = Jumping & Shooting
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="megaman">
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
            <div>
              Jumping & Shooting
            </div>
        `);
  });

  test("HTML entity", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
two = First &middot; Second
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="two">
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                <div>
                  First · Second
                </div>
          `);
  });

  test("one element is matched", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = Click <button>me</button>!
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized
          id="foo"
          elems={{ button: <button onClick={alert}></button> }}
        >
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        Click 
        <button
          onClick={[Function]}
        >
          me
        </button>
        !
      </div>
    `);
  });

  test("an element of different case is lowercased and matched", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = Click <button>me</button>!
`)
    );

    // The Button prop is capitalized whereas the <button> element in the
    // translation is lowercase.
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized
          id="foo"
          elems={{ Button: <button onClick={alert}></button> }}
        >
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        Click 
        <button
          onClick={[Function]}
        >
          me
        </button>
        !
      </div>
    `);
  });

  test("two elements are matched", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = <confirm>Sign in</confirm> or <cancel>cancel</cancel>.
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized
          id="foo"
          elems={{
            confirm: <button className="confirm"></button>,
            cancel: <button className="cancel"></button>,
          }}
        >
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        <button
          className="confirm"
        >
          Sign in
        </button>
         or 
        <button
          className="cancel"
        >
          cancel
        </button>
        .
      </div>
    `);
  });

  test("unexpected child is reduced to text", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = <confirm>Sign in</confirm> or <cancel>cancel</cancel>.
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized
          id="foo"
          elems={{
            confirm: <button className="confirm"></button>,
          }}
        >
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        <button
          className="confirm"
        >
          Sign in
        </button>
         or 
        cancel
        .
      </div>
    `);
  });

  test("element not found in the translation is removed", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = <confirm>Sign in</confirm>.
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized
          id="foo"
          elems={{
            confirm: <button className="confirm"></button>,
            cancel: <button className="cancel"></button>,
          }}
        >
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div>
                    <button
                      className="confirm"
                    >
                      Sign in
                    </button>
                    .
                  </div>
            `);
  });

  test("attributes on translated children are ignored", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = Click <button className="foo">me</button>!
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized
          id="foo"
          elems={{ button: <button onClick={alert}></button> }}
        >
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        Click 
        <button
          onClick={[Function]}
        >
          me
        </button>
        !
      </div>
    `);
  });

  test("nested children are ignored", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = Click <button><em>me</em></button>!
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized
          id="foo"
          elems={{ button: <button onClick={alert}></button> }}
        >
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        Click 
        <button
          onClick={[Function]}
        >
          me
        </button>
        !
      </div>
    `);
  });

  test("non-React element prop is used in markup", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = <confirm>Sign in</confirm>.
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ confirm: "Not a React element" }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
            <div>
              Sign in
              .
            </div>
        `);
  });
});

describe("Localized - overlay of void elements", () => {
  let parseMarkup = createParseMarkup();

  test("void prop name, void prop value, void translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <input/> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ input: <input type="text" /> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <input
          type="text"
        />
         AFTER
      </div>
    `);
  });

  test("void prop name, void prop value, empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <input></input> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ input: <input type="text" /> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <input
          type="text"
        />
         AFTER
      </div>
    `);
  });

  test("void prop name, void prop value, non-empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <input>Foo</input> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ input: <input type="text" /> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    // The opening <input> tag is parsed as an HTMLInputElement and the closing
    // </input> is ignored. "Foo" is then parsed as a regular text node.
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <input
          type="text"
        />
        Foo AFTER
      </div>
    `);
  });

  test("void prop name, non-empty prop value, void translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <input/> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ input: <span>Hardcoded</span> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <span>
          
        </span>
         AFTER
      </div>
    `);
  });

  test("void prop name, non-empty prop value, empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <input></input> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ input: <span>Hardcoded</span> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <span>
          
        </span>
         AFTER
      </div>
    `);
  });

  test("void prop name, non-empty prop value, non-empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <input>Foo</input> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ input: <span>Hardcoded</span> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    // The opening <input> tag is parsed as an HTMLInputElement and the closing
    // </input> is ignored. "Foo" is then parsed as a regular text node.
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <span>
          
        </span>
        Foo AFTER
      </div>
    `);
  });

  test("non-void prop name, void prop value, void translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <span/> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ span: <input type="text" /> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    // XXX HTML parser breaks self-closing elements
    // https://github.com/projectfluent/fluent.js/issues/188
    // <span/> is parsed as an unclosed <span> element. Everything that follows
    // it becomes its children and is ignored because the <input> passed as a
    // prop is known to be void.
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <input
          type="text"
        />
      </div>
    `);
  });

  test("non-void prop name, void prop value, empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <span></span> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ span: <input type="text" /> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <input
          type="text"
        />
         AFTER
      </div>
    `);
  });

  test("non-void prop name, void prop value, non-empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <span>Foo</span> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ span: <input type="text" /> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <input
          type="text"
        />
         AFTER
      </div>
    `);
  });

  test("non-void prop name, non-empty prop value, void translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <span/> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ span: <span>Hardcoded</span> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    // XXX HTML parser breaks self-closing elements
    // https://github.com/projectfluent/fluent.js/issues/188
    // <span/> is parsed as an unclosed <span> element. Everything that follows
    // it becomes its children and is inserted into the <span> passed as a prop.
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <span>
           AFTER
        </span>
      </div>
    `);
  });

  test("non-void prop name, non-empty prop value, empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <span></span> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ span: <span>Hardcoded</span> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <span>
          
        </span>
         AFTER
      </div>
    `);
  });

  test("non-void prop name, non-empty prop value, non-empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <span>Foo</span> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ span: <span>Hardcoded</span> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <span>
          Foo
        </span>
         AFTER
      </div>
    `);
  });

  test("custom prop name, void prop value, void translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <text-input/> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ "text-input": <input type="text" /> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    // XXX HTML parser breaks self-closing elements
    // https://github.com/projectfluent/fluent.js/issues/188
    // <text-input/> is parsed as an unclosed <text-input> custom element.
    // Everything that follows it becomes its children which are ignored because
    // the <input> passed as a prop is known to be void.
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <input
          type="text"
        />
      </div>
    `);
  });

  test("custom prop name, void prop value, empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <text-input></text-input> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ "text-input": <input type="text" /> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <input
          type="text"
        />
         AFTER
      </div>
    `);
  });

  test("custom prop name, void prop value, non-empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <text-input>Foo</text-input> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ "text-input": <input type="text" /> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <input
          type="text"
        />
         AFTER
      </div>
    `);
  });

  test("custom prop name, non-empty prop value, void translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <text-elem/> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ "text-elem": <span>Hardcoded</span> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    // XXX HTML parser breaks self-closing elements
    // https://github.com/projectfluent/fluent.js/issues/188
    // <text-elem/> is parsed as an unclosed <text-elem> custom element.
    // Everything that follows it becomes its children which are inserted into
    // the <span> passed as a prop.
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <span>
           AFTER
        </span>
      </div>
    `);
  });

  test("custom prop name, non-empty prop value, empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <text-elem></text-elem> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ "text-elem": <span>Hardcoded</span> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <span>
          
        </span>
         AFTER
      </div>
    `);
  });

  test("custom prop name, non-empty prop value, non-empty translation", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = BEFORE <text-elem>Foo</text-elem> AFTER
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" elems={{ "text-elem": <span>Hardcoded</span> }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        BEFORE 
        <span>
          Foo
        </span>
         AFTER
      </div>
    `);
  });
});

describe("Localized - custom parseMarkup", () => {
  test("disables the overlay logic if null", () => {
    const bundle = new FluentBundle();
    bundle.addResource(
      new FluentResource(`
foo = test <em>null markup parser</em>
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle], null)}>
        <Localized id="foo">
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        test &lt;em&gt;null markup parser&lt;/em&gt;
      </div>
    `);
  });

  test("is called if defined in the context", () => {
    let parseMarkupCalls = [];

    function parseMarkup(str) {
      parseMarkupCalls.push(str);
      return createParseMarkup()(str);
    }

    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
# We must use an HTML tag to trigger the overlay logic.
foo = test <em>custom markup parser</em>
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle], parseMarkup)}>
        <Localized id="foo">
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(parseMarkupCalls).toEqual(["test <em>custom markup parser</em>"]);
  });

  test("custom sanitization logic", () => {
    function parseMarkup(str) {
      return [
        {
          nodeName: "#text",
          textContent: str.toUpperCase(),
        },
      ];
    }

    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
# We must use an HTML tag to trigger the overlay logic.
foo = test <em>custom markup parser</em>
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle], parseMarkup)}>
        <Localized id="foo">
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        TEST &lt;EM&gt;CUSTOM MARKUP PARSER&lt;/EM&gt;
      </div>
    `);
  });
});
