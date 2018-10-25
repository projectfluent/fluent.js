import React, { Component } from 'react';
import { Localized } from 'fluent-react/compat';

function Header(props) {
  const { children } = props;
  return (
    <h1>{children}</h1>
  );
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: ''
    };
  }

  handleNameChange(name) {
    this.setState({ name });
  }

  render() {
    const { name } = this.state;

    return (
      <div>
        { name ?
            <Localized id="hello" $username={name}>
              <Header>{'Hello, { $username }!'}</Header>
            </Localized>
          :
            <Localized id="hello-no-name">
              <Header>Hello, stranger!</Header>
            </Localized>
        }

        <Localized id="type-name" attrs={{placeholder: true}}>
          <input
            type="text"
            placeholder="Type your name"
            onChange={evt => this.handleNameChange(evt.target.value)}
            value={name}
          />
        </Localized>
      </div>
    );
  }
}
