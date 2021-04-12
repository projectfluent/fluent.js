import React from "react";
import TestRenderer from "react-test-renderer";
import {
  ReactLocalization,
  LocalizationProvider,
  Localized
} from "../esm/index";

describe("Localized - validation", () => {
  test("inside of a LocalizationProvider", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([])}>
        <Localized>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });

  test("throws an error when placed outside of a LocalizationProvider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      TestRenderer.create(
        <Localized id="example-id">
          <div />
        </Localized>
      );
    }).toThrowErrorMatchingInlineSnapshot(
      `"The <Localized /> component was not properly wrapped in a <LocalizationProvider />."`
    );

    // React also does a console.error.
    expect(console.error).toHaveBeenCalled();
  });

  test("without a child", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([])}>
        <Localized />
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`null`);
  });

  test("with multiple children", () => {
    // React also does a console.error, ignore that here.
    jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      TestRenderer.create(
        <LocalizationProvider l10n={new ReactLocalization([])}>
          <Localized>
            <div />
            <div />
          </Localized>
        </LocalizationProvider>
      );
    }).toThrow(/single/);

    expect(console.error).toHaveBeenCalled();
  });

  test("with single children inside an array", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([])}>
        <Localized children={[<div />]} />
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });

  test("without id", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([])}>
        <Localized>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });
});
