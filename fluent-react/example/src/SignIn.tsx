import React from "react";
import { Localized, withLocalization, WithLocalizationProps } from "@fluent/react";

function SignIn(props: WithLocalizationProps) {
  function showAlert(id: string) {
    const { getString } = props;
    alert(getString(id));
  }

  return (
    <div>
      <Localized
        id="sign-in-or-cancel"
        elems={{
          signin: <button onClick={() => showAlert('clicked-sign-in')}></button>,
          cancel: <button className="text" onClick={() => showAlert('clicked-cancel')}></button>
        }}
      >
        <p>{'<signin>Sign in</signin> or <cancel>cancel</cancel>.'}</p>
      </Localized>
    </div>
  );
}

export const LocalizedSignIn = withLocalization(SignIn);
