import { describe, expect, it } from "vitest";

import { assertNoSlotConflict, hasSlotConflict, validateBookingSlot } from "../booking";

describe("booking helpers", () => {
  it("detects overlapping slots", () => {
    const conflict = hasSlotConflict(
      {
        startAt: new Date("2026-05-01T10:00:00.000Z"),
        endAt: new Date("2026-05-01T12:00:00.000Z"),
      },
      {
        startAt: new Date("2026-05-01T11:00:00.000Z"),
        endAt: new Date("2026-05-01T13:00:00.000Z"),
      },
    );

    expect(conflict).toBe(true);
  });

  it("throws on conflicting slot list", () => {
    const existingSlots = [
      {
        startAt: new Date("2026-05-01T10:00:00.000Z"),
        endAt: new Date("2026-05-01T12:00:00.000Z"),
      },
    ];

    expect(() =>
      assertNoSlotConflict(existingSlots, {
        startAt: new Date("2026-05-01T11:00:00.000Z"),
        endAt: new Date("2026-05-01T13:00:00.000Z"),
      }),
    ).toThrow("conflicts");
  });

  it("validates minimum slot length", () => {
    expect(() =>
      validateBookingSlot({
        startAt: new Date("2026-05-01T10:00:00.000Z"),
        endAt: new Date("2026-05-01T10:10:00.000Z"),
      }),
    ).toThrow("Minimum booking slot");
  });
});
