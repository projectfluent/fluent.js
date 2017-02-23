import React from 'react';
import { LocalizedElement } from 'fluent-react';

export default function App(props) {
  const { locales, handleLocaleChange } = props;

  const [current] = locales;
  const available = ['en-US', 'pl'];
  const next = available[(available.indexOf(current) + 1) % available.length];

  return (
    <div>
      <LocalizedElement id="title">
        <h1>Hello, world!</h1>
      </LocalizedElement>

      <LocalizedElement id="current" $locale={current}>
        <p>{'Current locale: { $locale }'}</p>
      </LocalizedElement>

      <LocalizedElement id="change" $locale={next}>
        <button onClick={evt => handleLocaleChange(next)}>
          {'Change to { $locale }'}
        </button>
      </LocalizedElement>
    </div>
  );
}
