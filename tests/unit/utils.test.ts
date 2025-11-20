import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { formatShortDate, isOverdue, daysUntil, percentage } from "@/lib/utils";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("utils", () => {
  it("formats short date", () => {
    expect(formatShortDate("2025-11-22T00:00:00.000Z")).toBeDefined();
  });

  it("returns overdue state", () => {
    expect(isOverdue("1999-01-01T00:00:00.000Z")).toBe(true);
  });

  it("calculates days until future date", () => {
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
    expect(daysUntil("2025-01-05T00:00:00.000Z")).toBe(4);
  });

  it("handles percentage edge cases", () => {
    expect(percentage(0, 0)).toBe(0);
    expect(percentage(5, 10)).toBe(50);
  });
});
