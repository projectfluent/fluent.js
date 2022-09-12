import React from "react";
import TestRenderer from "react-test-renderer";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import {
  ReactLocalization,
  LocalizationProvider,
  useLocalization,
} from "../esm/index.js";

function DummyComponent() {
  const { l10n } = useLocalization();

  return (
    <div>
      <p>{l10n.getString("foo")}</p>
      <p>{l10n.getElement(<></>, "bar", { elems: { elem: <b/> } })}</p>
      {l10n.getElement(<p/>, "bar", { elems: { elem: <i/> }, attrs: { "title": true } })}
    </div>
  );
}

describe("useLocalization", () => {
  function createBundle() {
    const bundle = new FluentBundle("en");
    bundle.addResource(new FluentResource("foo = FOO\nbar = BAR<elem>BAZ</elem>\n\t.title = QUX\n"));
    return bundle;
  }

  test("render inside of a LocalizationProvider", () => {
    const renderer = TestRenderer.create(
      <LocalizationProvider l10n={new ReactLocalization([createBundle()])}>
        <DummyComponent />
      </LocalizationProvider>
    );
    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        <p>
          FOO
        </p>
        <p>
          BAR
          <b>
            BAZ
          </b>
        </p>
        <p
          title="QUX"
        >
          BAR
          <i>
            BAZ
          </i>
        </p>
      </div>
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
      <div>
        <p>
          FOO
        </p>
        <p>
          BAR
          <b>
            BAZ
          </b>
        </p>
        <p
          title="QUX"
        >
          BAR
          <i>
            BAZ
          </i>
        </p>
      </div>
    `);
  });
});
