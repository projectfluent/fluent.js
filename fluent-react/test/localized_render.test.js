import React from "react";
import TestRenderer from "react-test-renderer";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { ReactLocalization, LocalizationProvider, Localized }
  from "../esm/index";

describe("Localized - rendering", () => {
  test("render the value", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo = FOO
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div>
                    FOO
                  </div>
            `);
  });

  test("render an allowed attribute", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo =
    .attr = ATTR
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" attrs={{ attr: true }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div
                    attr="ATTR"
                  />
            `);
  });

  test("only render allowed attributes", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo =
    .attr1 = ATTR 1
    .attr2 = ATTR 2
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" attrs={{ attr2: true }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div
                    attr2="ATTR 2"
                  />
            `);
  });

  test("filter out forbidden attributes", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo =
    .attr = ATTR
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" attrs={{ attr: false }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });

  test("filter all attributes if attrs not given", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo =
    .attr = ATTR
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });

  test("preserve existing attributes when setting new ones", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo =
    .attr = ATTR
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" attrs={{ attr: true }}>
          <div existing={true} />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div
                    attr="ATTR"
                    existing={true}
                  />
            `);
  });

  test("overwrite existing attributes if allowed", () => {
    const bundle = new FluentBundle();

    bundle.addResource(
      new FluentResource(`
foo =
    .existing = ATTR
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" attrs={{ existing: true }}>
          <div existing={true} />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div
                    existing="ATTR"
                  />
            `);
  });

  test("protect existing attributes if setting is forbidden", () => {
    const bundle = new FluentBundle();

    bundle.addResource(new FluentResource(`
foo =
    .existing = ATTR
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" attrs={{ existing: false }}>
          <div existing={true} />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div
                    existing={true}
                  />
            `);
  });

  test("protect existing attributes by default", () => {
    const bundle = new FluentBundle();

    bundle.addResource(new FluentResource(`
foo =
    .existing = ATTR
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">
          <div existing={true} />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div
                    existing={true}
                  />
            `);
  });

  test("preserve children when translation value is null", () => {
    const bundle = new FluentBundle();

    bundle.addResource(new FluentResource(`
foo =
    .title = TITLE
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" attrs={{ title: true }}>
          <select>
            <option>Option</option>
          </select>
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <select
                    title="TITLE"
                  >
                    <option>
                      Option
                    </option>
                  </select>
            `);
  });

  test("$arg is passed to format the value", () => {
    const bundle = new FluentBundle("en", { useIsolating: false });
    const format = jest.spyOn(bundle, "formatPattern");

    bundle.addResource(new FluentResource(`
foo = { $arg }
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" vars={{arg: "ARG"}}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        ARG
      </div>
    `);

    expect(format).toHaveBeenCalledWith(expect.anything(), { arg: "ARG" }, expect.anything());
  });

  test("$arg is passed to format the attributes", () => {
    const bundle = new FluentBundle();
    const format = jest.spyOn(bundle, "formatPattern");

    bundle.addResource(
      new FluentResource(`
foo = { $arg }
    .title = { $arg }
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" attrs={{ title: true }} vars={{arg: "ARG"}}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div
        title="ARG"
      >
        ARG
      </div>
    `);

    // The value.
    expect(format).toHaveBeenNthCalledWith(1, expect.anything(), {
      arg: "ARG"
    }, expect.anything());
    // The attribute.
    expect(format).toHaveBeenNthCalledWith(2, expect.anything(), {
      arg: "ARG"
    }, expect.anything());
  });

  test("render with a fragment and no message preserves the fragment", () => {
    const bundle = new FluentBundle();

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">
          <React.Fragment>
            <div>Fragment content</div>
          </React.Fragment>
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div>
                    Fragment content
                  </div>
            `);
  });

  test("A missing $arg does not break rendering", () => {
    const bundle = new FluentBundle("en", { useIsolating: false });

    bundle.addResource(
      new FluentResource(`
foo = { $arg }
    .title = { $arg }
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" attrs={{ title: true }}>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
            <div
              title="{$arg}"
            >
              {$arg}
            </div>
        `);
  });

  test("render with a fragment and no message value preserves the fragment", () => {
    const bundle = new FluentBundle();
    bundle.addResource(new FluentResource(`
foo =
    .attr = Attribute
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">
          <React.Fragment>
            <div>Fragment content</div>
          </React.Fragment>
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
                  <div>
                    Fragment content
                  </div>
            `);
  });

  test("render with a fragment renders the message into the fragment", () => {
    const bundle = new FluentBundle();
    bundle.addResource(new FluentResource(`
foo = Test message
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">
          <React.Fragment>
            <div>Fragment content</div>
          </React.Fragment>
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`"Test message"`);
  });

  test("render with an empty fragment and no message preserves the fragment", () => {
    const bundle = new FluentBundle();

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">
          <React.Fragment />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`null`);
  });

  test("render with an empty fragment and no message value preserves the fragment", () => {
    const bundle = new FluentBundle();
    bundle.addResource(new FluentResource(`
foo =
    .attr = Attribute
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">
          <React.Fragment />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`null`);
  });

  test("render with an empty fragment renders the message into the fragment", () => {
    const bundle = new FluentBundle();
    bundle.addResource(new FluentResource(`
foo = Test message
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">
          <React.Fragment />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`"Test message"`);
  });

  test("render with a string fallback and no message returns the fallback", () => {
    const bundle = new FluentBundle();

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">String fallback</Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`"String fallback"`);
  });

  test("render with a string fallback returns the message", () => {
    const bundle = new FluentBundle();
    bundle.addResource(new FluentResource(`
foo = Test message
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">String fallback</Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`"Test message"`);
  });

  test("render without a fallback returns the message", () => {
    const bundle = new FluentBundle();

    bundle.addResource(new FluentResource(`
foo = Message
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" />
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`"Message"`);
  });

  test("render without a fallback and no message returns nothing", () => {
    const bundle = new FluentBundle();

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" />
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`null`);
  });
});
