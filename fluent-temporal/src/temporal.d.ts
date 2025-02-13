export {}

declare global {
 namespace Temporal {
    class ZonedDateTime {
      epochMilliseconds: number;
      timeZoneId: string;
      calendarId: string;
    }

    class Instant {
      epochMilliseconds: number;
    }
  }
}
