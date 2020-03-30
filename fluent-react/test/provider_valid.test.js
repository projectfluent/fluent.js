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

  test("is memoized (no re-render) when props are the same", () => {
    const l10n = new ReactLocalization([]);
    const mockFn = jest.fn();

    function MockComponent() {
      mockFn();
      return "A mock component";
    }

    let renderer = TestRenderer.create(
      <LocalizationProvider l10n={l10n}>
        <MockComponent />
      </LocalizationProvider>
    );
    act(() => {
      renderer = renderer.update(
        <LocalizationProvider l10n={l10n}>
          <MockComponent />
        </LocalizationProvider>
      );
    });
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
