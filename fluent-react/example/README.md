# @fluent/react Example

This tiny React app demonstrates how `@fluent/react` can integrate with React.

## Running

The example app requires a local build of `@fluent/react`. In the root of
your `fluent.js` clone install the build tools:

    cd fluent.js/
    npm install

Then build and package `@fluent/react`:

    cd fluent.js/fluent-react/
    npm install
    make
    npm pack
    mv fluent-react-*.tgz example/fluent-react.tgz

Finally, change back to this directory, and build the example:

    cd fluent.js/fluent-react/example/
    npm install
    npm start

Open http://localhost:1234 to see the example running.
