import React from 'react';
import { Localized } from 'fluent-react/compat';

export default function App() {
  return (
    <div>
      <Localized id="title">
        <h1>Hello, world!</h1>
      </Localized>

      <Localized id="learn-more">
        <p>Consult the <a href="https://github.com/projectfluent/fluent.js/wiki/React-Bindings">documentation</a> to learn more about fluent-react.</p>
      </Localized>
    </div>
  );
}
