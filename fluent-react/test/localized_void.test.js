import React from "react";
import TestRenderer from "react-test-renderer";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { ReactLocalization, LocalizationProvider, Localized }
  from "../esm/index";

describe("Localized - void elements", function() {
  test("do not render the value in void elements", function() {
    const bundle = new FluentBundle();

    bundle.addResource(new FluentResource(`
foo = FOO
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo">
          <input />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<input />`);
  });

  test("render attributes in void elements", function() {
    const bundle = new FluentBundle();

    bundle.addResource(new FluentResource(`
foo =
    .title = TITLE
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" attrs={{ title: true }}>
          <input />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <input
        title="TITLE"
      />
    `);
  });

  test("render attributes but not value in void elements", function() {
    const bundle = new FluentBundle();

    bundle.addResource(new FluentResource(`
foo = FOO
    .title = TITLE
`));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <Localized id="foo" attrs={{ title: true }}>
          <input />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <input
        title="TITLE"
      />
    `);
  });
});
