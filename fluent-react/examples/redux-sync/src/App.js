import React from 'react';
import { connect} from 'react-redux';
import { LocalizedElement } from 'fluent-react/compat';

import { changeLocale } from './actions';

function App(props) {
  const { locales, changeLocale } = props;

  const [current] = locales;
  const available = ['en-US', 'pl'];
  const next = available[(available.indexOf(current ) + 1) % available.length];

  return (
    <div>
      <LocalizedElement id="title">
        <h1>Hello, world!</h1>
      </LocalizedElement>

      <LocalizedElement id="current" $locale={current}>
        <p>{'Current locale: { $locale }'}</p>
      </LocalizedElement>

      <LocalizedElement id="change" $locale={next}>
        <button onClick={evt => changeLocale(next)}>
          {'Change to { $locale }'}
        </button>
      </LocalizedElement>
    </div>
  );
}

const mapStateToProps = state => ({ locales: state.locales });
const mapDispatchToProps = { changeLocale };

export default connect(mapStateToProps, mapDispatchToProps)(App);
