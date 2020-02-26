import React from "react";
import TestRenderer from "react-test-renderer";
import { LocalizationProvider, Localized } from "../esm/index";

describe("Localized - validation", () => {
  let consoleError = console.error;

  beforeAll(() => {
    console.error = () => {};
  });

  afterAll(() => {
    console.error = consoleError;
  });

  test("inside of a LocalizationProvider", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider bundles={[]}>
        <Localized>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });

  test("outside of a LocalizationProvider", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider bundles={[]}>
        <Localized>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });

  test("with a manually set context", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider bundles={[]}>
        <Localized>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });

  test("without a child", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider bundles={[]}>
        <Localized />
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`null`);
  });

  test("with multiple children", () => {
    expect(() => {
      TestRenderer.create(
        <LocalizationProvider bundles={[]}>
          <Localized>
            <div />
            <div />
          </Localized>
        </LocalizationProvider>
      )
    }).toThrow(/single/)
  });

  test("without id", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider bundles={[]}>
        <Localized>
          <div />
        </Localized>
      </LocalizationProvider>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });
});
