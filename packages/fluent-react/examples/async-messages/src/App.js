import React from 'react';
import { Localized } from 'fluent-react/compat';

export default function App() {
  return (
    <div>
      <Localized id="title">
        <h1>Something went wrong.</h1>
      </Localized>
    </div>
  );
}
