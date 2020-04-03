import React, { Component } from "react";
import { Localized } from "@fluent/react";

export class Hello extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userName: ''
    };
  }

  handleNameChange(userName) {
    this.setState({ userName });
  }

  render() {
    const { userName } = this.state;

    return (
      <div>
        { userName ?
            <Localized id="hello" vars={{userName}}>
              <h1>{'Hello, { $userName }!'}</h1>
            </Localized>
          :
            <Localized id="hello-no-name">
              <h1>Hello, stranger!</h1>
            </Localized>
        }

        <Localized id="type-name" attrs={{placeholder: true}}>
          <input
            type="text"
            placeholder="Type your name"
            onChange={evt => this.handleNameChange(evt.target.value)}
            value={userName}
          />
        </Localized>
      </div>
    );
  }
}
