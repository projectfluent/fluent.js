import { FluentNumber, FluentDateTime, FluentType, FluentValue } from "./types.js";

type Class<T> = new (...args: any[]) => T;
type Guard = (value: unknown) => boolean

export type FluentTypeClass<T = unknown> = Class<FluentType<T>>;
export type FluentTypeFunction<T = unknown> = (value: T) => FluentValue | undefined;
export type FluentTypeCast<T = unknown> = FluentTypeClass<T> | FluentTypeFunction<T>;
export type FluentCast = FluentTypeFunction | FluentCaster

function generateGuard(guardValue: any): Guard {
  switch (typeof guardValue) {
    case "function":
      return (value: unknown) => value instanceof guardValue;
    case "string":
      return (value: unknown) => typeof value === guardValue;
    default:
      return (value: unknown) => value === guardValue;
  }
}

/**
 * Abstract class for implementing a type casting.
 * @see {@link FluentCastRegistry} for the default implementation.
 */
export abstract class FluentCaster {
  abstract castValue(value: unknown): FluentValue | undefined
}

export class FluentCastRegistry extends FluentCaster {
  /** @ignore */
  public _casters: Array<FluentTypeFunction> = [];

  /** @ignore */
  constructor(...args: Array<FluentCast | undefined>) {
    super();
    for (const arg of args) {
      if(arg) this.add(arg);
    }
  }

  /**
   * Register a new type casting rule for a specific class.
   * 
   * @param rawType class or type that will be converted into a Fluent value
   * @param fluentType either a function called for casting or a FluentType class
   */
  add<T = unknown>(rawType: Class<T> | string, fluentType: FluentTypeCast<T>): void;

  /**
   * Register a new type casting rule tried out for every value.
   * 
   * @param caster either a function called for casting or a FluentCaster instance
   */
  add(caster: FluentCast): void;

  add<T = unknown>(...args: any[]): void {
    let caster: FluentTypeCast<T> | FluentCaster;
    let guard: Guard | undefined;

    if (args.length === 1) {
      caster = args[0];
    } else if (args.length === 2) {
      caster = args[1];
      guard = generateGuard(args[0]);
    } else {
      throw new Error("Invalid arguments");
    }

    if (caster instanceof FluentCaster) {
      caster = caster.castValue.bind(caster);
    } else if (caster.prototype instanceof FluentType) {
      const fluentTypeClass = caster as FluentTypeClass<T>;
      caster = (value: T) => new fluentTypeClass(value);
    }

    if (guard !== undefined) {
      const guarded = caster as FluentTypeFunction<T>;
      caster = (value: unknown) => guard!(value) ? guarded(value as T) : undefined;
    }

    this._casters.unshift(caster as FluentTypeFunction);
  }

  /**
   * Casts an unknown value to a FluentValue.
   * Returns `undefined` if the value cannot be cast.
   */
  castValue(value: unknown): FluentValue | undefined {
    for (const caster of this._casters) {
      const result = caster(value);
      if (result !== undefined) return result;
    }
  }
}

/**
 * Default FluentCaster with built-in types, used by every {@link FluentBundle}.
 * Turns numbers into {@link FluentNumber} and dates into {@link FluentDateTime}.
 */
export const defaultCaster = new FluentCastRegistry();

defaultCaster.add("number", FluentNumber);
defaultCaster.add(Date, (value: Date) => new FluentDateTime(value.getTime()));
