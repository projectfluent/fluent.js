import React, { useState } from "react";
import { Localized } from "@fluent/react";

export function Hello() {
  let [userName, setUserName] = useState("");

  return (
    <div>
      {userName ? (
        <Localized id="hello" vars={{ userName }}>
          <h1>{"Hello, { $userName }!"}</h1>
        </Localized>
      ) : (
        <Localized id="hello-no-name">
          <h1>Hello, stranger!</h1>
        </Localized>
      )}

      <Localized id="type-name" attrs={{ placeholder: true }}>
        <input
          type="text"
          placeholder="Type your name"
          onChange={evt => setUserName(evt.target.value)}
          value={userName}
        />
      </Localized>
    </div>
  );
}
