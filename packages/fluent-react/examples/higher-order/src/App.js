import React from 'react';
import { Localized, withLocalization } from 'fluent-react/compat';

function App(props) {
  function showAlert() {
    const { getString } = props;
    alert(getString('hello'));
  }

  return (
    <div>
      <Localized id="button-show-alert">
        <button onClick={showAlert}>Click me!</button>
      </Localized>
    </div>
  );
}

export default withLocalization(App);
