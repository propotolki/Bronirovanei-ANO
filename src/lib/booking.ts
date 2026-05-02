import { BookingSlot } from "./types";

export function hasSlotConflict(existingSlot: BookingSlot, requestedSlot: BookingSlot): boolean {
  return existingSlot.startAt < requestedSlot.endAt && requestedSlot.startAt < existingSlot.endAt;
}

export function assertNoSlotConflict(existingSlots: BookingSlot[], requestedSlot: BookingSlot): void {
  const conflict = existingSlots.find((slot) => hasSlotConflict(slot, requestedSlot));

  if (conflict) {
    throw new Error("Requested slot conflicts with an existing booking");
  }
}

export function validateBookingSlot(slot: BookingSlot): void {
  if (slot.endAt <= slot.startAt) {
    throw new Error("Invalid booking slot");
  }

  const durationMs = slot.endAt.getTime() - slot.startAt.getTime();
  if (durationMs < 1000 * 60 * 30) {
    throw new Error("Minimum booking slot is 30 minutes");
  }
}
