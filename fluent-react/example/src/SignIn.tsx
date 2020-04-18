import React from "react";
import { Localized, useTranslate } from "@fluent/react";

export function SignIn() {
  const { l10n } = useTranslate()

  function showAlert(id: string) {
    alert(l10n.getString(id));
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
