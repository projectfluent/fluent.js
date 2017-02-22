## Classes

<dl>
<dt><a href="#FTLType">FTLType</a></dt>
<dd><p>The <code>FTLType</code> class is the base of FTL&#39;s type system.</p>
<p>FTL types wrap JavaScript values and store additional configuration for
them, which can then be used in the <code>toString</code> method together with a proper
<code>Intl</code> formatter.</p>
</dd>
<dt><a href="#FTLType">FTLType</a></dt>
<dd></dd>
<dt><a href="#RuntimeParser">RuntimeParser</a></dt>
<dd><p>The <code>Parser</code> class is responsible for parsing FTL resources.</p>
<p>It&#39;s only public method is <code>getResource(source)</code> which takes an FTL string
and returns a two element Array with an Object of entries generated from the
source as the first element and an array of SyntaxError objects as the
second.</p>
<p>This parser is optimized for runtime performance.</p>
<p>There is an equivalent of this parser in syntax/parser which is
generating full AST which is useful for FTL tools.</p>
</dd>
<dt><a href="#MessageContext">MessageContext</a></dt>
<dd><p>Message contexts are single-language stores of translations.  They are
responsible for parsing translation resources in the FTL syntax and can
format translation units (entities) to strings.</p>
<p>Always use <code>MessageContext.format</code> to retrieve translation units from
a context.  Translations can contain references to other entities or
external arguments, conditional logic in form of select expressions, traits
which describe their grammatical features, and can use FTL builtins which
make use of the <code>Intl</code> formatters to format numbers, dates, lists and more
into the context&#39;s language.  See the documentation of the FTL syntax for
more information.</p>
</dd>
<dt><a href="#MessageContext">MessageContext</a></dt>
<dd></dd>
</dl>

<a name="FTLType"></a>

## FTLType
The `FTLType` class is the base of FTL's type system.

FTL types wrap JavaScript values and store additional configuration for
them, which can then be used in the `toString` method together with a proper
`Intl` formatter.

**Kind**: global class  

* [FTLType](#FTLType)
    * [new FTLType(value, opts)](#new_FTLType_new)
    * [.valueOf()](#FTLType+valueOf) ⇒ <code>Any</code>
    * [.toString(ctx)](#FTLType+toString) ⇒ <code>string</code>


-

<a name="new_FTLType_new"></a>

### new FTLType(value, opts)
Create an `FTLType` instance.


| Param | Type | Description |
| --- | --- | --- |
| value | <code>Any</code> | JavaScript value to wrap. |
| opts | <code>Object</code> | Configuration. |


-

<a name="FTLType+valueOf"></a>

### ftlType.valueOf() ⇒ <code>Any</code>
Get the JavaScript value wrapped by this `FTLType` instance.

**Kind**: instance method of <code>[FTLType](#FTLType)</code>  

-

<a name="FTLType+toString"></a>

### ftlType.toString(ctx) ⇒ <code>string</code>
Stringify an instance of `FTLType`.

This method can use `Intl` formatters memoized by the `MessageContext`
instance passed as an argument.

**Kind**: instance method of <code>[FTLType](#FTLType)</code>  

| Param | Type |
| --- | --- |
| ctx | <code>[MessageContext](#MessageContext)</code> | 


-

<a name="FTLType"></a>

## FTLType
**Kind**: global class  

* [FTLType](#FTLType)
    * [new FTLType(value, opts)](#new_FTLType_new)
    * [.valueOf()](#FTLType+valueOf) ⇒ <code>Any</code>
    * [.toString(ctx)](#FTLType+toString) ⇒ <code>string</code>


-

<a name="new_FTLType_new"></a>

### new FTLType(value, opts)
Create an `FTLType` instance.


| Param | Type | Description |
| --- | --- | --- |
| value | <code>Any</code> | JavaScript value to wrap. |
| opts | <code>Object</code> | Configuration. |


-

<a name="FTLType+valueOf"></a>

### ftlType.valueOf() ⇒ <code>Any</code>
Get the JavaScript value wrapped by this `FTLType` instance.

**Kind**: instance method of <code>[FTLType](#FTLType)</code>  

-

<a name="FTLType+toString"></a>

### ftlType.toString(ctx) ⇒ <code>string</code>
Stringify an instance of `FTLType`.

This method can use `Intl` formatters memoized by the `MessageContext`
instance passed as an argument.

**Kind**: instance method of <code>[FTLType](#FTLType)</code>  

| Param | Type |
| --- | --- |
| ctx | <code>[MessageContext](#MessageContext)</code> | 


-

<a name="RuntimeParser"></a>

## RuntimeParser
The `Parser` class is responsible for parsing FTL resources.

It's only public method is `getResource(source)` which takes an FTL string
and returns a two element Array with an Object of entries generated from the
source as the first element and an array of SyntaxError objects as the
second.

This parser is optimized for runtime performance.

There is an equivalent of this parser in syntax/parser which is
generating full AST which is useful for FTL tools.

**Kind**: global class  

-

<a name="RuntimeParser+getResource"></a>

### runtimeParser.getResource(string) ⇒ <code>Array.&lt;Object, Array&gt;</code>
**Kind**: instance method of <code>[RuntimeParser](#RuntimeParser)</code>  

| Param | Type |
| --- | --- |
| string | <code>string</code> | 


-

<a name="MessageContext"></a>

## MessageContext
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

**Kind**: global class  

* [MessageContext](#MessageContext)
    * [new MessageContext(lang, [options])](#new_MessageContext_new)
    * [.addMessages(source)](#MessageContext+addMessages) ⇒ <code>Array.&lt;Error&gt;</code>
    * [.format(message, args, errors)](#MessageContext+format) ⇒ <code>string</code>


-

<a name="new_MessageContext_new"></a>

### new MessageContext(lang, [options])
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

  - `functions` - an object of additional functions available to
                  translations as builtins.

  - `useIsolating` - boolean specifying whether to use Unicode isolation
                   marks (FSI, PDI) for bidi interpolations.


| Param | Type | Description |
| --- | --- | --- |
| lang | <code>string</code> | Language of the context. |
| [options] | <code>Object</code> |  |


-

<a name="MessageContext+addMessages"></a>

### messageContext.addMessages(source) ⇒ <code>Array.&lt;Error&gt;</code>
Add a translation resource to the context.

The translation resource must use the FTL syntax.  It will be parsed by
the context and each translation unit (message) will be available in the
`messages` map by its identifier.

    ctx.addMessages('foo = Foo');
    ctx.messages.get('foo');

    // Returns a raw representation of the 'foo' message.

Parsed entities should be formatted with the `format` method in case they
contain logic (references, select expressions etc.).

**Kind**: instance method of <code>[MessageContext](#MessageContext)</code>  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>string</code> | Text resource with translations. |


-

<a name="MessageContext+format"></a>

### messageContext.format(message, args, errors) ⇒ <code>string</code>
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

**Kind**: instance method of <code>[MessageContext](#MessageContext)</code>  

| Param | Type |
| --- | --- |
| message | <code>Object</code> &#124; <code>string</code> | 
| args | <code>Object</code> &#124; <code>undefined</code> | 
| errors | <code>Array</code> | 


-

<a name="MessageContext"></a>

## MessageContext
**Kind**: global class  

* [MessageContext](#MessageContext)
    * [new MessageContext(lang, [options])](#new_MessageContext_new)
    * [.addMessages(source)](#MessageContext+addMessages) ⇒ <code>Array.&lt;Error&gt;</code>
    * [.format(message, args, errors)](#MessageContext+format) ⇒ <code>string</code>


-

<a name="new_MessageContext_new"></a>

### new MessageContext(lang, [options])
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

  - `functions` - an object of additional functions available to
                  translations as builtins.

  - `useIsolating` - boolean specifying whether to use Unicode isolation
                   marks (FSI, PDI) for bidi interpolations.


| Param | Type | Description |
| --- | --- | --- |
| lang | <code>string</code> | Language of the context. |
| [options] | <code>Object</code> |  |


-

<a name="MessageContext+addMessages"></a>

### messageContext.addMessages(source) ⇒ <code>Array.&lt;Error&gt;</code>
Add a translation resource to the context.

The translation resource must use the FTL syntax.  It will be parsed by
the context and each translation unit (message) will be available in the
`messages` map by its identifier.

    ctx.addMessages('foo = Foo');
    ctx.messages.get('foo');

    // Returns a raw representation of the 'foo' message.

Parsed entities should be formatted with the `format` method in case they
contain logic (references, select expressions etc.).

**Kind**: instance method of <code>[MessageContext](#MessageContext)</code>  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>string</code> | Text resource with translations. |


-

<a name="MessageContext+format"></a>

### messageContext.format(message, args, errors) ⇒ <code>string</code>
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

**Kind**: instance method of <code>[MessageContext](#MessageContext)</code>  

| Param | Type |
| --- | --- |
| message | <code>Object</code> &#124; <code>string</code> | 
| args | <code>Object</code> &#124; <code>undefined</code> | 
| errors | <code>Array</code> | 


-

