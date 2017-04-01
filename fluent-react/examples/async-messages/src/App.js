import React from 'react';
import { LocalizedElement } from 'fluent-react/compat';

export default function App() {
  return (
    <div>
      <LocalizedElement id="title">
        <h1>Hello, world!</h1>
      </LocalizedElement>
    </div>
  );
}
