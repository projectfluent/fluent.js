import React, { Component } from 'react';
import { LocalizedElement } from 'fluent-react/compat';

function Header(props) {
  const { children } = props;
  return (
    <h1>{children}</h1>
  );
}

export default class App extends Component {
  state = {
    name: ''
  };

  handleNameChange(name) {
    this.setState({ name });
  }

  render() {
    const { name } = this.state;

    return (
      <div>
        { name ?
            <LocalizedElement id="hello" $username={name}>
              <Header>{'Hello, { $username }!'}</Header>
            </LocalizedElement>
          :
            <LocalizedElement id="hello-no-name">
              <Header>Hello, stranger!</Header>
            </LocalizedElement>
        }

        <LocalizedElement id="type-name">
          <input
            type="text"
            placeholder="Your name"
            onChange={evt => this.handleNameChange(evt.target.value)}
            value={name}
          />
        </LocalizedElement>
      </div>
    );
  }
}
