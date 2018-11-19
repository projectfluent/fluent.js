import React from 'react';
import { Localized } from 'fluent-react/compat';

export default function App() {
  return (
    <div>
      <p>
        <em>This example is hardcoded to use <code>['pl', 'en-US']</code>.</em>
      </p>

      <Localized id="foo">
        <p>Foo</p>
      </Localized>

      <Localized id="bar">
        <p>Bar</p>
      </Localized>

      <Localized id="baz">
        <p>Baz is missing from all locales</p>
      </Localized>

      <Localized id="qux" $baz="Baz">
        <p>{'Qux is like { $baz }: missing from all locales.'}</p>
      </Localized>
    </div>
  );
}
