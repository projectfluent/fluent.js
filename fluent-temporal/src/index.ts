import { 
  FluentCaster, FluentCastRegistry, defaultCaster, FluentValue, FluentDateTime
} from "@fluent/bundle";

/**
 * FluentCaster implementation for Temporal objects.
 */
export class FluentTemporal extends FluentCaster {
  private registry = new FluentCastRegistry();

  /*
   * Create a new FluentTemporal instance.
   * @param temporal - Temporal namespace.
   */
  constructor(temporal: typeof Temporal = Temporal) {
    super();
    register(temporal, this.registry);
  }

  /** @ignore */
  castValue(value: unknown): FluentValue | undefined {
    return this.registry.castValue(value);
  }
}

function register(temporal: typeof Temporal, registry: FluentCastRegistry) {
  registry.add(temporal.ZonedDateTime, (value: Temporal.ZonedDateTime) => {
    const opts: Intl.DateTimeFormatOptions = {
      timeZone: value.timeZoneId
    }

    if (value.calendarId !== "iso8601") {
      opts.calendar = value.calendarId;
    }

    return new FluentDateTime(value.epochMilliseconds, opts);
  });
  
  registry.add(temporal.Instant, (value: Temporal.Instant) => {
    return new FluentDateTime(value.epochMilliseconds);
  });
}

if (typeof Temporal !== "undefined") {
  register(Temporal, defaultCaster);
}
