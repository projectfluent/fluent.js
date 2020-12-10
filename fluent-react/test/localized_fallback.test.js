import React from "react";
import TestRenderer from "react-test-renderer";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import {
  ReactLocalization,
  LocalizationProvider,
  Localized
} from "../esm/index";

test("uses message from 1st bundle", () => {
  const bundle1 = new FluentBundle();
  bundle1.addResource(
    new FluentResource(`
foo = FOO
`)
  );

  const renderer = TestRenderer.create(
    <LocalizationProvider l10n={new ReactLocalization([bundle1])}>
      <Localized id="foo">
        <div>Bar</div>
      </Localized>
    </LocalizationProvider>
  );

  expect(renderer.toJSON()).toMatchInlineSnapshot(`
    <div>
      FOO
    </div>
  `);
});

test("uses message from the 2nd bundle", function() {
  const bundle1 = new FluentBundle();
  const bundle2 = new FluentBundle();

  bundle1.addResource(
    new FluentResource(`
not-foo = NOT FOO
`)
  );
  bundle2.addResource(
    new FluentResource(`
foo = FOO
`)
  );

  const renderer = TestRenderer.create(
    <LocalizationProvider l10n={new ReactLocalization([bundle1, bundle2])}>
      <Localized id="foo">
        <div>Bar</div>
      </Localized>
    </LocalizationProvider>
  );

  expect(renderer.toJSON()).toMatchInlineSnapshot(`
    <div>
      FOO
    </div>
  `);
});

test("falls back back for missing message", function() {
  const bundle1 = new FluentBundle();
  bundle1.addResource(
    new FluentResource(`
not-foo = NOT FOO
`)
  );

  const renderer = TestRenderer.create(
    <LocalizationProvider l10n={new ReactLocalization([bundle1])}>
      <Localized id="foo">
        <div>Bar</div>
      </Localized>
    </LocalizationProvider>
  );

  expect(renderer.toJSON()).toMatchInlineSnapshot(`
    <div>
      Bar
    </div>
  `);
});
