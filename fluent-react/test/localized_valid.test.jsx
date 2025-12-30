import React from "react";
import TestRenderer from "react-test-renderer";
import {
  ReactLocalization,
  LocalizationProvider,
  Localized,
} from "../esm/index.js";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { expect, vi } from "vitest";

describe("Localized - validation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createValidBundle() {
    const validBundle = new FluentBundle();
    validBundle.addResource(
      new FluentResource("example-id = Example localized text\n")
    );
    return validBundle;
  }

  test("renders with no errors or warnings when correctly created inside of a LocalizationProvider", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([createValidBundle()])}>
        <Localized id="example-id">
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        Example localized text
      </div>
    `);
  });

  test("throws an error when placed outside of a LocalizationProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      TestRenderer.create(
        <Localized id="example-id">
          <div />
        </Localized>
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `[Error: The <Localized /> component was not properly wrapped in a <LocalizationProvider />.]`
    );

    // React also does a console.error.
    expect(console.error).toHaveBeenCalled();
  });

  test("renders the localized text when no child is provided", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([createValidBundle()])}>
        <Localized id="example-id" />
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`"Example localized text"`);
  });

  test("throws when multiple children are provided", () => {
    // React also does a console.error, ignore that here.
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      TestRenderer.create(
        <LocalizationProvider
          l10n={new ReactLocalization([createValidBundle()])}
        >
          <Localized id="example-id">
            <div />
            <div />
          </Localized>
        </LocalizationProvider>
      );
    }).toThrow(/single/);

    expect(console.error).toHaveBeenCalled();
  });

  test("is valid to have a children array with a single element inside", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([createValidBundle()])}>
        <Localized id="example-id" children={[<div />]} />
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        Example localized text
      </div>
    `);
  });

  test("has a warning when no id is provided", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([])}>
        <Localized>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);

    expect(console.warn.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "[@fluent/react] Error: No string id was provided when localizing a component.",
        ],
      ]
    `);
  });

  test("Calls provided logger function, instead of default, when no id is provided", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const mockReportError = vi.fn();
    const renderer = TestRenderer.create(
      <LocalizationProvider
        l10n={new ReactLocalization([], null, mockReportError)}
      >
        <Localized>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
    expect(console.warn).not.toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledWith(
      new Error("No string id was provided when localizing a component.")
    );
  });
});
