import React from "react";
import TestRenderer from "react-test-renderer";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { ReactLocalization, LocalizationProvider, useLocalization } from "../esm/index";

function DummyComponent() {
  const { l10n } = useLocalization();

  return (
    <p>{l10n.getString('foo')}</p>
  );
}

describe("useLocalization", () => {
  test("render inside of a LocalizationProvider", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([])}>
        <DummyComponent />
      </LocalizationProvider>
    );
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <p>
        foo
      </p>
    `);
  });

  test("render outside of a LocalizationProvider", () => {
    const renderer = TestRenderer.create(<DummyComponent />);
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <p>
        foo
      </p>
    `);
  });

  test("useLocalization exposes getString from ReactLocalization", () => {
    const bundle = new FluentBundle("en", { useIsolating: false });
    bundle.addResource(
      new FluentResource(`
foo = FOO
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <DummyComponent />
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <p>
        FOO
      </p>
    `);
  });
});
