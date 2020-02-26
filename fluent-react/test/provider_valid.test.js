import React from "react";
import TestRenderer, {act} from "react-test-renderer";
import { LocalizationProvider } from "../esm/index";

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
      <LocalizationProvider bundles={[]}>
        <div />
      </LocalizationProvider>
    );
    expect(renderer.toJSON()).toMatchInlineSnapshot(`<div />`);
  });

  test("without a child", () => {
    expect(() => {
      TestRenderer.create(<LocalizationProvider bundles={[]} />);
    }).toThrow(/required/);
  });

  test("without bundles", () => {
    expect(() => {
      TestRenderer.create(<LocalizationProvider />);
    }).toThrow(/is required/);
  });

  test("without iterable bundles", () => {
    expect(() => {
      TestRenderer.create(<LocalizationProvider bundles={0} />);
    }).toThrow(/must be an iterable/);
  });

  test("is memoized (no re-render) when props are the same", () => {
    const bundles = [];
    const spy = jest.spyOn(bundles, Symbol.iterator);
    let renderer = TestRenderer.create(<LocalizationProvider bundles={bundles} />);
    act(() => {
      renderer = renderer.update(<LocalizationProvider bundles={bundles} />);
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
