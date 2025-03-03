import { Scope } from "./scope.js";
import type { Temporal } from "temporal-polyfill";

export type FluentValue = FluentType<unknown> | string;

export type FluentVariable =
  | FluentValue
  | Temporal.Instant
  | Temporal.PlainDateTime
  | Temporal.PlainDate
  | Temporal.PlainTime
  | Temporal.PlainYearMonth
  | Temporal.PlainMonthDay
  | Temporal.ZonedDateTime
  | string
  | number
  | Date;

export type FluentFunction = (
  positional: Array<FluentValue>,
  named: Record<string, FluentValue>
) => FluentValue;

/**
 * The `FluentType` class is the base of Fluent's type system.
 *
 * Fluent types wrap JavaScript values and store additional configuration for
 * them, which can then be used in the `toString` method together with a proper
 * `Intl` formatter.
 */
export abstract class FluentType<T> {
  /** The wrapped native value. */
  public value: T;

  /**
   * Create a `FluentType` instance.
   *
   * @param value The JavaScript value to wrap.
   */
  constructor(value: T) {
    this.value = value;
  }

  /**
   * Unwrap the raw value stored by this `FluentType`.
   */
  valueOf(): T {
    return this.value;
  }

  /**
   * Format this instance of `FluentType` to a string.
   *
   * Formatted values are suitable for use outside of the `FluentBundle`.
   * This method can use `Intl` formatters available through the `scope`
   * argument.
   */
  abstract toString(scope: Scope): string;
}

/**
 * A `FluentType` representing no correct value.
 */
export class FluentNone extends FluentType<string> {
  /**
   * Create an instance of `FluentNone` with an optional fallback value.
   * @param value The fallback value of this `FluentNone`.
   */
  constructor(value = "???") {
    super(value);
  }

  /**
   * Format this `FluentNone` to the fallback string.
   */
  toString(scope: Scope): string {
    return `{${this.value}}`;
  }
}

/**
 * A `FluentType` representing a number.
 *
 * A `FluentNumber` instance stores the number value of the number it
 * represents. It may also store an option bag of options which will be passed
 * to `Intl.NumerFormat` when the `FluentNumber` is formatted to a string.
 */
export class FluentNumber extends FluentType<number> {
  /** Options passed to `Intl.NumberFormat`. */
  public opts: Intl.NumberFormatOptions;

  /**
   * Create an instance of `FluentNumber` with options to the
   * `Intl.NumberFormat` constructor.
   *
   * @param value The number value of this `FluentNumber`.
   * @param opts Options which will be passed to `Intl.NumberFormat`.
   */
  constructor(value: number, opts: Intl.NumberFormatOptions = {}) {
    super(value);
    this.opts = opts;
  }

  /**
   * Format this `FluentNumber` to a string.
   */
  toString(scope: Scope): string {
    try {
      const nf = scope.memoizeIntlObject(Intl.NumberFormat, this.opts);
      return nf.format(this.value);
    } catch (err) {
      scope.reportError(err);
      return this.value.toString(10);
    }
  }
}

/**
 * A `FluentType` representing a date and time.
 *
 * A `FluentDateTime` instance stores a Date object, Temporal object, or a number
 * as a numerical timestamp in milliseconds. It may also store an
 * option bag of options which will be passed to `Intl.DateTimeFormat` when the
 * `FluentDateTime` is formatted to a string.
 */
export class FluentDateTime extends FluentType<
  | number
  | Date
  | Temporal.Instant
  | Temporal.PlainDateTime
  | Temporal.PlainDate
  | Temporal.PlainMonthDay
  | Temporal.PlainTime
  | Temporal.PlainYearMonth
  | Temporal.ZonedDateTime
> {
  /** Options passed to `Intl.DateTimeFormat`. */
  public opts: Intl.DateTimeFormatOptions;

  static supportsValue(value: any): value is ConstructorParameters<typeof Temporal.Instant>[0] {
    if (typeof value === "number") return true;
    if (value instanceof Date) return true;
    if (value instanceof FluentType) return FluentDateTime.supportsValue(value.valueOf());
    // Temporary workaround to support environments without Temporal
    if ('Temporal' in globalThis) {
      if (
        // @ts-ignore
        value instanceof Temporal.Instant        || // @ts-ignore
        value instanceof Temporal.PlainDateTime  || // @ts-ignore
        value instanceof Temporal.PlainDate      || // @ts-ignore
        value instanceof Temporal.PlainMonthDay  || // @ts-ignore
        value instanceof Temporal.PlainTime      || // @ts-ignore
        value instanceof Temporal.PlainYearMonth || // @ts-ignore
        value instanceof Temporal.ZonedDateTime
      ) {
        return true;
      }
    }
    return false
  }

  /**
   * Create an instance of `FluentDateTime` with options to the
   * `Intl.DateTimeFormat` constructor.
   *
   * @param value The number value of this `FluentDateTime`, in milliseconds.
   * @param opts Options which will be passed to `Intl.DateTimeFormat`.
   */
  constructor(
    value:
      | number
      | Date
      | Temporal.Instant
      | Temporal.PlainDateTime
      | Temporal.PlainDate
      | Temporal.PlainMonthDay
      | Temporal.PlainTime
      | Temporal.PlainYearMonth
      | Temporal.ZonedDateTime
      | FluentDateTime
      | FluentType<number>,
    opts: Intl.DateTimeFormatOptions = {}
  ) {
    // unwrap any FluentType value, but only retain the opts from FluentDateTime
    if (value instanceof FluentDateTime) {
      opts = { ...value.opts, ...opts };
      value = value.value;
    } else if (value instanceof FluentType) {
      value = value.valueOf();
    }

    if (typeof value === "object") {
      // Intl.DateTimeFormat defaults to gregorian calendar, but Temporal defaults to iso8601
      if ('calendarId' in value) {
        if (opts.calendar === undefined) {
          opts = { ...opts, calendar: value.calendarId };
        } else if (opts.calendar !== value.calendarId && 'withCalendar' in value) {
          value = value.withCalendar(opts.calendar);
        }
      }

      // Temporal.ZonedDateTime is timezone aware
      if ('timeZoneId' in value) {
        if (opts.timeZone === undefined) {
          opts = { ...opts, timeZone: value.timeZoneId };
        } else if (opts.timeZone !== value.timeZoneId && 'withTimeZone' in value) {
          value = value.withTimeZone(opts.timeZone);
        }
      }

      // Temporal.ZonedDateTime cannot be formatted directly
      if ('toInstant' in value) {
        value = value.toInstant();
      }
    }

    super(value);
    this.opts = opts;
  }

  /**
   * Convert this `FluentDateTime` to a number.
   * Note that this isn't always possible due to the nature of Temporal objects.
   * In such cases, a TypeError will be thrown.
   */
  toNumber(): number {
    const value = this.value;
    if (typeof value === "number") return value;
    if (value instanceof Date) return value.getTime();
    if ('epochMilliseconds' in value) return value.epochMilliseconds;
    if ('toZonedDateTime' in value) return (value as Temporal.PlainDateTime).toZonedDateTime("UTC").epochMilliseconds;
    throw new TypeError("Unwrapping a non-number value as a number");
  }

  /**
   * Format this `FluentDateTime` to a string.
   */
  toString(scope: Scope): string {
    try {
      const dtf = scope.memoizeIntlObject(Intl.DateTimeFormat, this.opts);
      return dtf.format(this.value as Parameters<Intl.DateTimeFormat["format"]>[0]);
    } catch (err) {
      scope.reportError(err);
      if (typeof this.value === "number" || this.value instanceof Date) {
        return new Date(this.value).toISOString();
      } else {
        return this.value.toString();
      }
    }
  }
}
