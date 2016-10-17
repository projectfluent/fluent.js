===================
Using L20n in Gecko
===================

L20n is a localization framework for Firefox.  L20n keeps simple things simple 
and at the same time makes complex things possible.  Users should be able to 
benefit from the entire expressive power of their language.


Using L20n in DOM
===========================

L20n has been designed as a Web-first technology.  Using it with DOM is as
simple as including a ``<script>`` element and specifying the translation 
resources with a ``<link>``.

L20n is most powerful when it’s used declaratively in the DOM. The localization 
happens on the runtime and gracefully falls back to the next language in case 
of errors. L20n doesn’t force developers to programmatically create string 
bundles, request raw strings from them and manually interpolate variables.

Instead, L20n uses a ``MutationObserver`` which is notified about changes to 
``data-l10n-*`` attributes in the DOM tree. The complexity of the language 
negotiation, resource loading, error fallback and string interpolation is 
hidden in the mutation handler. It is still possible to use the JavaScript API 
to request a translation manually in rare situations when DOM is not available 
(e.g. OS notifications).

In L20n, broken translations never break the UI. L20n tries its best to display 
a meaningful message to the user in case of errors. It may try to fall back to 
the next language preferred by the user if it’s available. As the last resort 
L20n will show the identifier of the message.


Create An FTL Translation Resource
----------------------------------

Translations for L20n are stored in ``.ftl`` files.  To learn more about
the FTL file format, see `Syntax`_.

.. _Syntax: https://github.com/l20n/l20n.js/blob/master/docs/syntax.rst

Packaging FTL files in Firefox is done by adding their directory to jar.mn.
Please only package complete directory structures, and keep the same directory
layout as in the source.

The top-level directory like ``browser`` is close to where your code is.
Inside ``browser/locales/en-US``, the first directory clarifies the target
audience of the feature::

    [localization] @AB_CD@.jar:
        browser                                        (%browser/**/*.ftl)


You can refer to them via the path relative to the locale directory.  This
is called the Resource Identifier.  For instance, the resource identifier for 
``browser/locale/en-US/browser/menubar.ftl`` is ``/browser/menubar.ftl``.


Link Resources
--------------

Once you've created the resources include them in the ``<head>`` of your HTML::

    <link rel="localization" href="/browser/about-dialog.ftl">
    <link rel="localization" href="/browser/new-tab.ftl">

You can group resources under a name with the ``name`` attribute::

    <link rel="localization" name="main" href="/browser/about-dialogftl">
    <link rel="localization" name="new-tab" href="/browser/new-tab.ftl">

If the ``name`` attribute is not defined, ``main`` is assumed.


Link The l20n.js Script
-----------------------

Finally include the l20n.js script right below the links to resources::

    <link rel="localization" href="/browser/about-dialog.ftl">
    <link rel="localization" href="/browser/new-tab.ftl">
    <script type="application/javascript"
      src="chrome://global/content/l20n.js"></script>


Make DOM Elements Localizable
-----------------------------

L20n automatically monitors the document DOM tree for changes to localizable 
elements.  Use the `data-l10n-id` attribute on a node to mark it as localizable::

    <p data-l10n-id="about"></p>

By default, the translations will be looked up in the main `Localization` 
object.  If needed you can use the `data-l10n-bundle` to specify a different 
`Localization` object::

    <p data-l10n-id="warning-message" data-l10n-bundle="new-tab"></p>

Notice that you don't have to put the text content in the DOM anymore (you 
still can if you want to).  All content lives in the localization resources.

Use the `data-l10n-args` attribute to pass additional data into translations 
which will be interpolated via the `{ }` syntax.  The data should be 
serialized JSON::

    <h1 data-l10n-id="hello" data-l10n-args='{"username": "Mary"}'></h1>

Given the following translation::

    hello = Hello, { $username }!

…the result will be::

    <h1>Hello, Mary!</h1>


DOM Overlays
============

L20n allows semantic markup in translations. Localizers can use safe text-level 
DOM elements to create translations which obey the rules of typography and 
punctuation. Developers can also embed interactive elements inside of 
translations and attach event handlers to them in the DOM. L20n will
overlay translations on top of the source DOM tree preserving the identity of 
elements and the event listeners.

Only a safe subset of HTML elements (e.g. em, sup), attributes (e.g. title) and 
entities is allowed in translations. In addition to the pre-defined whitelists, 
any element found in the original source HTML is allowed in the translation as 
well. Consider the following source HTML::

    <p data-l10n-id="save">
        <input type="submit">
        <a
            href="/main"
            class="btn-cancel"
        ></a>
    </p>

Assume the following malicious translation::

    save =
        | <input value="Save" type="text"> or
        | <a
        |     href="http://myevilwebsite.com"
        |     onclick="alert('pwnd!')"
        |     title="Back to the homepage"
        | >
        |     cancel
        | </a>.

The result will be::

    <p data-l10n-id="back">
        <input value="Save" type="submit"> or
        <a
            href="/main"
            class="btn-cancel"
            title="Back to the homepage"
        >
            cancel
        </a>.
    </p>


The ``input`` element is not on the default whitelist but since it's present in 
the source HTML, it is also allowed in the translation. The ``value`` attribute 
is allowed on ``input`` elements, but ``type`` is not.  Similarly, ``href`` and 
``onclick`` attributes are not allowed in translations and they are not 
inserted in the final DOM. However, the ``title`` attribute is safe.

It is important to note that applying translations doesn't replace DOM 
elements but only modifies their text nodes and their attributes. This makes 
it possible to use L20n in conjunction with MVC frameworks.


The JavaScript API
==================

It is also possible to use L20n programmatically, for instance in order to 
localize dynamic content.  The API is exposed on `document.l10n`.  Refer to 
the API docs in this folder for more information.
