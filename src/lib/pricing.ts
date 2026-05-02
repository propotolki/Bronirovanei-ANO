import { BookingCostBreakdown, BookingCostInput } from "./types";

const MS_IN_HOUR = 1000 * 60 * 60;
const HOURS_IN_DAY = 24;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function validateSlot(startAt: Date, endAt: Date): void {
  if (endAt <= startAt) {
    throw new Error("Invalid slot: endAt must be greater than startAt");
  }
}

export function calculateBookingCost(input: BookingCostInput): BookingCostBreakdown {
  const { slot, rentalMode, pricingRule, inventoryTotal = 0 } = input;

  validateSlot(slot.startAt, slot.endAt);

  const durationHours = (slot.endAt.getTime() - slot.startAt.getTime()) / MS_IN_HOUR;
  const durationDays = durationHours / HOURS_IN_DAY;

  let baseAmount = 0;

  if (rentalMode === "hourly") {
    if (durationHours < pricingRule.minimumHours) {
      throw new Error(
        `Minimum booking duration is ${pricingRule.minimumHours} hours for hourly mode`,
      );
    }

    baseAmount = durationHours * pricingRule.baseHourlyRate;
  }

  if (rentalMode === "daily") {
    const billedDays = Math.ceil(durationDays);
    baseAmount = billedDays * pricingRule.baseDailyRate;
  }

  if (rentalMode === "mixed") {
    const fullDays = Math.floor(durationDays);
    const restHours = durationHours - fullDays * HOURS_IN_DAY;
    baseAmount = fullDays * pricingRule.baseDailyRate + restHours * pricingRule.baseHourlyRate;

    if (fullDays === 0 && durationHours < pricingRule.minimumHours) {
      throw new Error(
        `Minimum booking duration is ${pricingRule.minimumHours} hours for mixed mode without full days`,
      );
    }
  }

  if (input.isWeekend) {
    baseAmount *= pricingRule.weekendMultiplier;
  }

  if (input.hasNightHours) {
    baseAmount *= pricingRule.nightMultiplier;
  }

  const inventoryAmount = Math.max(0, inventoryTotal);
  const cleaningFee = Math.max(0, pricingRule.cleaningFee);
  const totalAmount = roundMoney(baseAmount + inventoryAmount + cleaningFee);

  return {
    durationHours: roundMoney(durationHours),
    durationDays: roundMoney(durationDays),
    baseAmount: roundMoney(baseAmount),
    inventoryAmount: roundMoney(inventoryAmount),
    cleaningFee: roundMoney(cleaningFee),
    totalAmount,
    currency: "RUB",
  };
}
