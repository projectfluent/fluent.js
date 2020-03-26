import React from "react";
import TestRenderer from "react-test-renderer";
import { FluentBundle, FluentResource } from "@fluent/bundle";
import { LocalizationProvider, Localized } from "../esm/index";

test("relocalizes", () => {
  const Root = ({ bundle }) => (
    <LocalizationProvider bundles={[bundle]}>
      <Localized id="foo">
        <div />
      </Localized>
    </LocalizationProvider>
  );

  const bundle1 = new FluentBundle();
  bundle1.addResource(new FluentResource(`
foo = FOO
`));
  const renderer = TestRenderer.create(<Root bundle={bundle1} />);
  expect(renderer.toJSON()).toMatchInlineSnapshot(`
    <div>
      FOO
    </div>
  `);

  const bundle2 = new FluentBundle();
  bundle2.addResource(new FluentResource(`
foo = BAR
`));
  renderer.update(<Root bundle={bundle2} />);
  expect(renderer.toJSON()).toMatchInlineSnapshot(`
    <div>
      BAR
    </div>
  `);
});
