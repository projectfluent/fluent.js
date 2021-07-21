import React from "react";
import TestRenderer from "react-test-renderer";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import {
  ReactLocalization,
  LocalizationProvider,
  useLocalization
} from "../esm/index.js";

function DummyComponent() {
  const { l10n } = useLocalization();

  return <p>{l10n.getString("foo")}</p>;
}

describe("useLocalization", () => {
  function createBundle() {
    const bundle = new FluentBundle("en", { useIsolating: false });
    bundle.addResource(new FluentResource("foo = FOO\n"));
    return bundle;
  }

  test("render inside of a LocalizationProvider", () => {

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([createBundle()])}>
        <DummyComponent />
      </LocalizationProvider>
    );
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <p>
        FOO
      </p>
    `);
  });

  test("throws an error when rendered outside of a LocalizationProvider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      TestRenderer.create(<DummyComponent />);
    }).toThrowErrorMatchingInlineSnapshot(
      `"useLocalization was used without wrapping it in a <LocalizationProvider />."`
    );

    // React also does a console.error.
    expect(console.error).toHaveBeenCalled();
  });

  test("useLocalization exposes getString from ReactLocalization", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([createBundle()])}>
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
