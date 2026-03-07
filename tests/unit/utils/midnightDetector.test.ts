import { describe, expect, it } from "vitest";

import { createMidnightDetector } from "../../../app/utils/midnightDetector";

describe("createMidnightDetector", () => {
  it("should track the initial day from the seed date", () => {
    const friday = new Date(2026, 2, 6, 23, 59, 0); // Fri Mar 6 at 23:59
    const detector = createMidnightDetector(friday);

    expect(detector.currentDay).toBe(6);
  });

  it("should not trigger when the day has not changed", () => {
    const friday = new Date(2026, 2, 6, 23, 0, 0);
    const detector = createMidnightDetector(friday);
    detector.markInitialized();

    // Same day, different time
    expect(detector.check(new Date(2026, 2, 6, 23, 30, 0))).toBe(false);
    expect(detector.check(new Date(2026, 2, 6, 23, 59, 59))).toBe(false);
  });

  it("should detect midnight crossing when the day changes", () => {
    const friday = new Date(2026, 2, 6, 23, 59, 0);
    const detector = createMidnightDetector(friday);
    detector.markInitialized();

    const saturday = new Date(2026, 2, 7, 0, 0, 1); // Just past midnight
    expect(detector.check(saturday)).toBe(true);
  });

  it("should only trigger once per day change", () => {
    const friday = new Date(2026, 2, 6, 23, 59, 0);
    const detector = createMidnightDetector(friday);
    detector.markInitialized();

    const saturday = new Date(2026, 2, 7, 0, 0, 1);
    expect(detector.check(saturday)).toBe(true);

    // Subsequent checks on the same new day should not trigger
    expect(detector.check(new Date(2026, 2, 7, 0, 0, 2))).toBe(false);
    expect(detector.check(new Date(2026, 2, 7, 12, 0, 0))).toBe(false);
  });

  it("should detect multiple midnight crossings across consecutive days", () => {
    const friday = new Date(2026, 2, 6, 23, 59, 0);
    const detector = createMidnightDetector(friday);
    detector.markInitialized();

    // Friday -> Saturday
    expect(detector.check(new Date(2026, 2, 7, 0, 0, 1))).toBe(true);
    expect(detector.currentDay).toBe(7);

    // Saturday -> Sunday
    expect(detector.check(new Date(2026, 2, 8, 0, 0, 1))).toBe(true);
    expect(detector.currentDay).toBe(8);
  });

  it("should suppress midnight refresh before markInitialized is called", () => {
    const friday = new Date(2026, 2, 6, 23, 59, 0);
    const detector = createMidnightDetector(friday);
    // NOT calling markInitialized()

    const saturday = new Date(2026, 2, 7, 0, 0, 1);
    expect(detector.check(saturday)).toBe(false);
    expect(detector.isInitialized).toBe(false);
  });

  it("should still update the tracked day even when suppressed", () => {
    const friday = new Date(2026, 2, 6, 23, 59, 0);
    const detector = createMidnightDetector(friday);

    // Midnight crosses before initialized — suppressed but day updates
    const saturday = new Date(2026, 2, 7, 0, 0, 1);
    expect(detector.check(saturday)).toBe(false);
    expect(detector.currentDay).toBe(7);

    // Now initialize — should NOT re-trigger for the same day
    detector.markInitialized();
    expect(detector.check(new Date(2026, 2, 7, 0, 1, 0))).toBe(false);
  });

  it("should handle month boundary crossing (e.g., day 31 -> day 1)", () => {
    const lastDay = new Date(2026, 2, 31, 23, 59, 0); // Mar 31
    const detector = createMidnightDetector(lastDay);
    detector.markInitialized();

    const firstDay = new Date(2026, 3, 1, 0, 0, 1); // Apr 1
    expect(detector.check(firstDay)).toBe(true);
    expect(detector.currentDay).toBe(1);
  });

  it("should default to current date when no seed date provided", () => {
    const detector = createMidnightDetector();
    expect(detector.currentDay).toBe(new Date().getDate());
  });
});
