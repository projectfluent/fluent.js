import React from 'react';
import { connect} from 'react-redux';
import { Localized } from 'fluent-react/compat';

import { changeLocales } from './actions';

function App(props) {
  const { currentLocales, isFetching, changeLocales } = props;

  const [current] = currentLocales;
  const available = ['en-US', 'pl'];
  const next = available[(available.indexOf(current ) + 1) % available.length];

  return (
    <div>
      <Localized id="title">
        <h1>Hello, world!</h1>
      </Localized>

      <Localized id="current" $locale={current}>
        <p>{'Current locale: { $locale }'}</p>
      </Localized>

      <Localized id="change" $locale={next}>
        <button disabled={isFetching} onClick={evt => changeLocales([next])}>
          {'Change to { $locale }'}
        </button>
      </Localized>
    </div>
  );
}

const mapStateToProps = state => ({
  currentLocales: state.currentLocales,
  isFetching: state.isFetching
});
const mapDispatchToProps = { changeLocales };

export default connect(mapStateToProps, mapDispatchToProps)(App);
