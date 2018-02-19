# Void HTML Elements

This directory contains MIT-licensed source files from React DOM's codebase
which define a list of void HTML elements. React DOM doesn't allow these
elements to contain any children.

In `fluent-react`, a broken translation may have a value where none is
expected. `<Localized>` components must protect wrapped void elements from
having this unexpected value inserted as children. React throws when trying
to set children of void elements, breaking the entire app.

See [PR #155](https://github.com/projectfluent/fluent.js/pull/155) for more
information.

The files were sourced from the `v16.2.0` tag of React DOM:

  - [omittedCloseTags.js](https://github.com/facebook/react/blob/v16.2.0/packages/react-dom/src/shared/omittedCloseTags.js),
  - [voidElementTags.js](https://github.com/facebook/react/blob/v16.2.0/packages/react-dom/src/shared/voidElementTags.js).
