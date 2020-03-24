import React from "react";
import TestRenderer from "react-test-renderer";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { ReactLocalization, LocalizationProvider, Localized }
  from "../esm/index";

test("relocalizes", () => {
  const Root = ({ l10n }) => (
    <LocalizationProvider l10n={l10n}>
      <Localized id="foo">
        <div />
      </Localized>
    </LocalizationProvider>
  );

  const bundle1 = new FluentBundle();
  bundle1.addResource(new FluentResource(`
foo = FOO
`));
  const renderer = TestRenderer.create(<Root l10n={new ReactLocalization([bundle1])} />);
  expect(renderer.toJSON()).toMatchInlineSnapshot(`
    <div>
      FOO
    </div>
  `);

  const bundle2 = new FluentBundle();
  bundle2.addResource(new FluentResource(`
foo = BAR
`));
  renderer.update(<Root l10n={new ReactLocalization([bundle2])} />);
  expect(renderer.toJSON()).toMatchInlineSnapshot(`
    <div>
      BAR
    </div>
  `);
});
