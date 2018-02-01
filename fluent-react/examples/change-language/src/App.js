import React from 'react';
import { Localized } from 'fluent-react/compat';

export default function App(props) {
  const { currentLocales, handleLocaleChange } = props;

  const [current] = currentLocales;
  const available = ['en-US', 'pl'];
  const next = available[(available.indexOf(current) + 1) % available.length];

  return (
    <div>
      <Localized id="title">
        <h1>Hello, world!</h1>
      </Localized>

      <Localized id="current" $locale={current}>
        <p>{'Current locale: { $locale }'}</p>
      </Localized>

      <Localized id="change" $locale={next}>
        <button onClick={evt => handleLocaleChange(next)}>
          {'Change to { $locale }'}
        </button>
      </Localized>
    </div>
  );
}
