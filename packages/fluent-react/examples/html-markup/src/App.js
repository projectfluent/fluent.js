import React from 'react';
import { Localized, withLocalization } from 'fluent-react/compat';

function App(props) {
  function showAlert(id) {
    const { getString } = props;
    alert(getString(id));
  }

  return (
    <div>
      <Localized id="sign-in-or-cancel"
        signin={<button onClick={() => showAlert('clicked-sign-in')}></button>}
        cancel={<button className="text" onClick={() => showAlert('clicked-cancel')}></button>}
      >
        <p>{'<signin>Sign in</signin> or <cancel>cancel</cancel>.'}</p>
      </Localized>

      <Localized id="agree-prompt"
        input={<input type="text" />}
        button={<button onClick={() => showAlert('agree-alert')}></button>}
      >
        <p>{'My name is <input/> and <button>I agree</button>.'}</p>
      </Localized>
    </div>
  );
}

export default withLocalization(App);
