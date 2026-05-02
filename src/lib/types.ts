export type RentalMode = "hourly" | "daily" | "mixed";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface PricingRule {
  venueId: string;
  rentalMode: RentalMode;
  currency: "RUB";
  baseHourlyRate: number;
  baseDailyRate: number;
  minimumHours: number;
  weekendMultiplier: number;
  nightMultiplier: number;
  cleaningFee: number;
}

export interface InventoryItem {
  id: string;
  venueId: string;
  name: string;
  included: boolean;
  unitPrice: number;
}

export interface BookingSlot {
  startAt: Date;
  endAt: Date;
}

export interface BookingCostInput {
  slot: BookingSlot;
  rentalMode: RentalMode;
  pricingRule: PricingRule;
  inventoryTotal?: number;
  isWeekend?: boolean;
  hasNightHours?: boolean;
}

export interface BookingCostBreakdown {
  durationHours: number;
  durationDays: number;
  baseAmount: number;
  inventoryAmount: number;
  cleaningFee: number;
  totalAmount: number;
  currency: "RUB";
}

export type AppRole = 'guest' | 'host' | 'admin';

export type ListingStatus = 'draft' | 'pending' | 'active' | 'blocked';

export type Listing = {
  id: string;
  hostId: string;
  title: string;
  description: string;
  city: string;
  pricePerNight: number;
  status: ListingStatus;
  image: string;
  lat?: number;
  lng?: number;
};

export type User = {
  id: string;
  name: string;
  phone: string;
  role: AppRole;
  avatar?: string;
};
