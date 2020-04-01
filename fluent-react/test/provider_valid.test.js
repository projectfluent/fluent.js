import React from "react";
import TestRenderer, {act} from "react-test-renderer";
import { ReactLocalization, LocalizationProvider } from "../esm/index";

describe("LocalizationProvider - validation", () => {
  let consoleError = console.error;

  beforeAll(() => {
    console.error = (message) => {
      if (/(Failed prop type)/.test(message)) {
        throw new Error(message);
      }
    };
  });

  afterAll(() => {
    console.error = consoleError;
  });

  test("valid use", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([])}>
        <div />
      </LocalizationProvider>
    );
    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });

  test("without a child", () => {
    expect(() => {
      TestRenderer.create(<LocalizationProvider l10n={new ReactLocalization([])} />);
    }).toThrow(/required/);
  });

  test("without the l10n prop", () => {
    expect(() => {
      TestRenderer.create(<LocalizationProvider />);
    }).toThrow(/marked as required/);
  });
});
