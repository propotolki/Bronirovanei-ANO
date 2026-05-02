import { describe, expect, it } from "vitest";

import { calculateBookingCost } from "../pricing";

describe("calculateBookingCost", () => {
  const pricingRule = {
    venueId: "venue-1",
    rentalMode: "mixed" as const,
    currency: "RUB" as const,
    baseHourlyRate: 1000,
    baseDailyRate: 10000,
    minimumHours: 2,
    weekendMultiplier: 1.2,
    nightMultiplier: 1.1,
    cleaningFee: 500,
  };

  it("calculates mixed booking with fees", () => {
    const result = calculateBookingCost({
      slot: {
        startAt: new Date("2026-05-01T10:00:00.000Z"),
        endAt: new Date("2026-05-01T13:00:00.000Z"),
      },
      rentalMode: "mixed",
      pricingRule,
      inventoryTotal: 2000,
    });

    expect(result.totalAmount).toBe(5500);
  });

  it("throws when less than minimum hours in hourly mode", () => {
    expect(() =>
      calculateBookingCost({
        slot: {
          startAt: new Date("2026-05-01T10:00:00.000Z"),
          endAt: new Date("2026-05-01T11:00:00.000Z"),
        },
        rentalMode: "hourly",
        pricingRule,
      }),
    ).toThrow("Minimum booking duration");
  });
});
