import React from "react";
import TestRenderer from "react-test-renderer";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import {
  ReactLocalization,
  LocalizationProvider,
  withLocalization,
} from "../esm/index.js";

function DummyComponent() {
  return <div />;
}

describe("withLocalization", () => {
  test("render inside of a LocalizationProvider", () => {
    const EnhancedComponent = withLocalization(DummyComponent);

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([])}>
        <EnhancedComponent />
      </LocalizationProvider>
    );
    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });

  test("thows an error when rendered outside of a LocalizationProvider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    const EnhancedComponent = withLocalization(DummyComponent);

    expect(() => {
      TestRenderer.create(<EnhancedComponent />);
    }).toThrowErrorMatchingInlineSnapshot(
      `"withLocalization was used without wrapping it in a <LocalizationProvider />."`
    );

    // React also does a console.error.
    expect(console.error).toHaveBeenCalled();
  });

  test("getString with access to the l10n context", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const bundle = new FluentBundle("en", { useIsolating: false });
    const EnhancedComponent = withLocalization(DummyComponent);

    bundle.addResource(
      new FluentResource(`
foo = FOO
bar = BAR {$arg}
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <EnhancedComponent />
      </LocalizationProvider>
    );

    const { getString } = renderer.root.findByType(DummyComponent).props;

    // Returns the translation.
    expect(getString("foo", {})).toBe("FOO");
    expect(getString("bar", { arg: "ARG" })).toBe("BAR ARG");

    // It reports an error on formatting errors, but doesn't throw.
    expect(getString("bar", {})).toBe("BAR {$arg}");
    expect(console.warn.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "[@fluent/react] ReferenceError: Unknown variable: $arg",
        ],
      ]
    `);
  });

  test("getString with access to the l10n context, with fallback value", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const bundle = new FluentBundle("en", { useIsolating: false });
    const EnhancedComponent = withLocalization(DummyComponent);

    bundle.addResource(
      new FluentResource(`
foo = FOO
bar = BAR {$arg}
`)
    );

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([bundle])}>
        <EnhancedComponent />
      </LocalizationProvider>
    );

    const { getString } = renderer.root.findByType(DummyComponent).props;
    // Returns the translation, even if fallback value provided.
    expect(getString("foo", {}, "fallback")).toBe("FOO");
    // Returns the fallback.
    expect(getString("missing", {}, "fallback")).toBe("fallback");
    expect(getString("bar", { arg: "ARG" })).toBe("BAR ARG");
    // Doesn't throw on formatting errors.
    expect(getString("bar", {})).toBe("BAR {$arg}");
    expect(console.warn.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "[@fluent/react] Error: The id \\"missing\\" did not match any messages in the localization bundles.",
        ],
        Array [
          "[@fluent/react] ReferenceError: Unknown variable: $arg",
        ],
      ]
    `);
  });

  test("getString with an empty bundle list", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const EnhancedComponent = withLocalization(DummyComponent);
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([])}>
        <EnhancedComponent />
      </LocalizationProvider>
    );

    const { getString } = renderer.root.findByType(DummyComponent).props;
    // Returns the id if no fallback.
    expect(getString("foo", { arg: 1 })).toBe("foo");
    expect(console.warn.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "[@fluent/react] Error: Attempting to get a string when no localization bundles are present.",
        ],
      ]
    `);
  });

  test("getString with an empty bundle list, with fallback value", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});

    const EnhancedComponent = withLocalization(DummyComponent);
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([])}>
        <EnhancedComponent />
      </LocalizationProvider>
    );

    const { getString } = renderer.root.findByType(DummyComponent).props;
    // Returns the fallback if provided.
    expect(getString("foo", { arg: 1 }, "fallback message")).toBe(
      "fallback message"
    );

    expect(console.warn.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "[@fluent/react] Error: Attempting to get a string when no localization bundles are present.",
        ],
      ]
    `);
  });

  test("getString with access to the l10n context, with message changes", () => {
    const initialBundle = new FluentBundle();
    const EnhancedComponent = withLocalization(({ getString }) =>
      getString("foo")
    );

    initialBundle.addResource(new FluentResource("foo = FOO"));

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([initialBundle])}>
        <EnhancedComponent />
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`"FOO"`);

    const newBundle = new FluentBundle();
    newBundle.addResource(new FluentResource("foo = BAR"));

    renderer.update(
      <LocalizationProvider l10n={new ReactLocalization([newBundle])}>
        <EnhancedComponent />
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`"BAR"`);
  });
});
