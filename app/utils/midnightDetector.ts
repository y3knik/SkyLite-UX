/**
 * Creates a midnight crossing detector.
 * Tracks the current calendar day and detects when the day changes.
 */
export function createMidnightDetector(initialDate: Date = new Date()) {
  let currentDay = initialDate.getDate();
  let initialized = false;

  return {
    /** Mark that initial data loading is complete. Midnight refresh is suppressed until this is called. */
    markInitialized() {
      initialized = true;
    },

    /** Returns true if the day has changed AND initial loading is complete. Updates internal day tracker. */
    check(now: Date): boolean {
      const day = now.getDate();
      if (day !== currentDay) {
        currentDay = day;
        return initialized;
      }
      return false;
    },

    /** Current tracked day (for testing). */
    get currentDay() {
      return currentDay;
    },

    /** Whether initialized (for testing). */
    get isInitialized() {
      return initialized;
    },
  };
}
