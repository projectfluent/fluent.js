# FTLType

The `FTLType` class is the base of FTL's type system.

FTL types wrap JavaScript values and store additional configuration for
them, which can then be used in the `toString` method together with a proper
`Intl` formatter.

## constructor

Create an `FTLType` instance.

**Parameters**

-   `value` **Any** JavaScript value to wrap.
-   `opts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** Configuration.

Returns **[FTLType](#ftltype)** 

## valueOf

Get the JavaScript value wrapped by this `FTLType` instance.

Returns **Any** 

## toString

Stringify an instance of `FTLType`.

This method can use `Intl` formatters memoized by the `MessageContext`
instance passed as an argument.

**Parameters**

-   `ctx` **[MessageContext](#messagecontext)** 

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

# FTLDateTime

# MessageContext

Message contexts are single-language stores of translations.  They are
responsible for parsing translation resources in the FTL syntax and can
format translation units (entities) to strings.

Always use `MessageContext.format` to retrieve translation units from
a context.  Translations can contain references to other entities or
external arguments, conditional logic in form of select expressions, traits
which describe their grammatical features, and can use FTL builtins which
make use of the `Intl` formatters to format numbers, dates, lists and more
into the context's language.  See the documentation of the FTL syntax for
more information.

## constructor

Create an instance of `MessageContext`.

The `lang` argument is used to instantiate `Intl` formatters used by
translations.  The `options` object can be used to configure the context.

Examples:

    const ctx = new MessageContext(lang);

    const ctx = new MessageContext(lang, { useIsolating: false });

    const ctx = new MessageContext(lang, {
      useIsolating: true,
      functions: {
        NODE_ENV: () => process.env.NODE_ENV
      }
    });

Available options:

-   `functions` - an object of additional functions available to
                  translations as builtins.

-   `useIsolating` - boolean specifying whether to use Unicode isolation
                   marks (FSI, PDI) for bidi interpolations.

**Parameters**

-   `lang` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Language of the context.
-   `options` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** 
-   `$1` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)
    -   `$1.functions`   (optional, default `{}`)
    -   `$1.useIsolating`   (optional, default `true`)

Returns **[MessageContext](#messagecontext)** 

## addMessages

Add a translation resource to the context.

The translation resource must use the FTL syntax.  It will be parsed by
the context and each translation unit (message) will be available in the
`messages` map by its identifier.

    ctx.addMessages('foo = Foo');
    ctx.messages.get('foo');

    // Returns a raw representation of the 'foo' message.

Parsed entities should be formatted with the `format` method in case they
contain logic (references, select expressions etc.).

**Parameters**

-   `source` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** Text resource with translations.

Returns **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)>** 

## format

Format a message to a string or null.

Format a raw `message` from the context's `messages` map into a string (or
a null if it has a null value).  `args` will be used to resolve references
to external arguments inside of the translation.

In case of errors `format` will try to salvage as much of the translation
as possible and will still return a string.  For performance reasons, the
encountered errors are not returned but instead are appended to the
`errors` array passed as the third argument.

    const errors = [];
    ctx.addMessages('hello = Hello, { $name }!');
    const hello = ctx.messages.get('hello');
    ctx.format(hello, { name: 'Jane' }, errors);

    // Returns 'Hello, Jane!' and `errors` is empty.

    ctx.format(hello, undefined, errors);

    // Returns 'Hello, name!' and `errors` is now:

    [<ReferenceError: Unknown external: name>]

**Parameters**

-   `message` **([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String))** 
-   `args` **([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [undefined](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined))** 
-   `errors` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)** 

Returns **?[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

# EntriesParser

The `Parser` class is responsible for parsing FTL resources.

It's only public method is `getResource(source)` which takes an FTL
string and returns a two element Array with an Object of entries
generated from the source as the first element and an array of L10nError
objects as the second.

This parser is optimized for runtime performance.

There is an equivalent of this parser in ftl/ast/parser which is
generating full AST which is useful for FTL tools.

## getResource

**Parameters**

-   `string` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** 

# FTLKeyword

# resolver

Format a translation into an `FTLType`.

The return value must be sringified with its `toString` method by the
caller.

**Parameters**

-   `ctx` **[MessageContext](#messagecontext)** 
-   `args` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `message` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `errors` **\[[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)](default \[])** 

Returns **[FTLType](#ftltype)** 
