/**
 * NotificationDeduplicator.ts
 *
 * Prevents redundant notifications and audio alerts from triggering multiple times
 * for the same event ID within a short time window.
 */

export class NotificationDeduplicator {
  private static processedEvents = new Map<string, number>();
  private static TTL_MS = 60 * 1000; // 60 seconds

  static shouldProcess(eventId: string): boolean {
    const now = Date.now();
    this.cleanup(now);

    if (this.processedEvents.has(eventId)) {
      return false;
    }

    this.processedEvents.set(eventId, now);
    return true;
  }

  private static cleanup(now: number) {
    for (const [id, timestamp] of this.processedEvents.entries()) {
      if (now - timestamp > this.TTL_MS) {
        this.processedEvents.delete(id);
      }
    }
  }
}
