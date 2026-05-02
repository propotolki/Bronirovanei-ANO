export type HostPlanCode = "free" | "start" | "advanced";

export type HostPlanFeatures = {
  code: HostPlanCode;
  venueLimit: number;
  analyticsLevel: "none" | "short" | "full";
  promotionLimit: number;
};

export const PLAN_FEATURES: Record<HostPlanCode, HostPlanFeatures> = {
  free: { code: "free", venueLimit: 2, analyticsLevel: "none", promotionLimit: 0 },
  start: { code: "start", venueLimit: 5, analyticsLevel: "short", promotionLimit: 0 },
  advanced: { code: "advanced", venueLimit: 10, analyticsLevel: "full", promotionLimit: 10 },
};

export function mapAccessLevelToPlan(accessLevel: string | null | undefined): HostPlanCode {
  if (accessLevel === "extended") return "advanced";
  if (accessLevel === "pro") return "start";
  return "free";
}
