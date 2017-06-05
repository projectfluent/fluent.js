# fluent-web

`fluent-web` is a runtime polyfill that binds `Fluent` and `FluentDOM` into
a vanilla Web platform (HTML, DOM, JS).

## Installation

`fluent-web` provides a glue code that is executed at runtime to construct
`DOMLocalization`, bind it to `document.l10n`, perform initial document
translation and set the event listeners and MutationObserver.

The result `fluent-web.js` file should be included in the HTML file
and any code executing after it will have access to the FluentWeb API.


## How to use

The primary access point is the `document.l10n` object of class
`DOMLocalization`. It is already constructed based on the resources
linked from the document and localized into languages negotiated based
on the available languages from the `<meta>` tag and languages
requested via `navigator.languages`.

```html
<html>
  <head>
    <meta name="defaultLanguage" content="en-US">
    <meta name="availableLanguages" content="en-US, fr">
    <link rel="localization" href="locales/{locale}/main.ftl">
    <link rel="localization" href="locales/{locale}/head.ftl">
    <script defer src="./src/fluent-web.js"></script>
  </head>
  <body>
    <h1 data-l10n-id="hello-world"/>
  </body>
</html>
```

```javascript

function showMessage() {
  let msg = await document.l10n.formatValue('confirm-msg')
  alert(msg);
}

let h1 = document.querySelector('h1');
document.l10n.setAttributes(h1, 'welcome', { user: 'Anna' });
```

## Learn more

Find out more about Project Fluent at [projectfluent.io][], including
documentation of the Fluent file format ([FTL][]), links to other packages and
implementations, and information about how to get involved.


[projectfluent.io]: http://projectfluent.io
[FTL]: http://projectfluent.io/fluent/guide/
