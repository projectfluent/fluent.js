# @fluent/temporal ![](https://github.com/projectfluent/fluent.js/workflows/test/badge.svg)

`@fluent/temporal` adds support for [Temporal][] objects to Fluent.js.

The Temporal standard is considered experimental, and support is still limited.
Various [polyfills][] are available.

Once the Temporal standard is more widely supported, this package may be integrated into `@fluent/bundle` itself.

[temporal]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal
[polyfills]: https://github.com/fullcalendar/temporal-polyfill

## Installation

`@fluent/bundle` can be used both on the client-side and the server-side. You
can install it from the npm registry:

    npm install @fluent/temporal


## How to use

### With global `Temporal` object

If you're in an invironment that already supports the `Temporal` object, or you have a global polyfill enabled, all you have to do is import the package:

```javascript
import "@fluent/temporal";
```

### With a local polyfill

If you use a polyfill that doesn't add a global `Temporal` object, you can explicitly add `FluentTemporal` to your bundle:

```javascript
import { FluentBundle } from "@fluent/bundle";
import { FluentTemporal } from "@fluent/temporal";
import { Temporal } from 'temporal-polyfill';

const bundle = new FluentBundle("en-US", {
  cast: new FluentTemporal(Temporal)
});
```

## Supported Temporal objects

The following Temporal objects are supported:

* [`Temporal.ZonedDateTime`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/ZonedDateTime)
  * Calendar and timezone will be preserved
  * Converted into a `FluentDateTime` object (from `@fluent/bundle`)
  * Can be passed to built-in `DATETIME` functions in Fluent messages
* [`Temporal.Instant`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Instant)
  * Converted into a `FluentDateTime` object (from `@fluent/bundle`)
  * Can be passed to built-in `DATETIME` functions in Fluent messages

The following objects are not yet supported:

* [`Temporal.Duration`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/Duration)
* [`Temporal.PlainDate`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDate)
* [`Temporal.PlainDateTime`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainDateTime)
* [`Temporal.PlainMonthDay`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainMonthDay)
* [`Temporal.PlainTime`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainTime)
* [`Temporal.PlainYearMonth`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal/PlainYearMonth)
