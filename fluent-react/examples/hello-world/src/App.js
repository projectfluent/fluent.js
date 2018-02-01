import React from 'react';
import { Localized } from 'fluent-react/compat';

export default function App() {
  return (
    <div>
      <Localized id="title">
        <h1>Hello, world!</h1>
      </Localized>
      <Localized id='today-is' $date={new Date()}>
        <p>
          {'Today is { DATETIME($date, month: "long", day: "numeric") }.'}
        </p>
      </Localized>
    </div>
  );
}
