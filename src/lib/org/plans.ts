import type { PlanTier } from "@prisma/client";

// Plan catalogue. Prices are monthly IDR per company (null = custom quote).
// Nothing is charged until BILLING_ENABLED is on and a gateway is connected;
// edit the numbers here to change what the pricing table shows.
export const PLAN_INFO: Record<PlanTier, { label: string; seats: number; blurb: string; priceMonthly: number | null }> = {
  TRIAL: { label: "Trial 14 hari", seats: 5, blurb: "Semua fitur, maks. 5 anggota", priceMonthly: 0 },
  STARTER: { label: "Starter", seats: 15, blurb: "Tim kecil, maks. 15 anggota", priceMonthly: 199_000 },
  BUSINESS: { label: "Business", seats: 100, blurb: "Multi-divisi, maks. 100 anggota", priceMonthly: 999_000 },
  ENTERPRISE: { label: "Enterprise", seats: 10_000, blurb: "Tanpa batas, SLA & onboarding", priceMonthly: null },
};

export const PAID_PLANS: PlanTier[] = ["STARTER", "BUSINESS", "ENTERPRISE"];

export const TRIAL_DAYS = 14;

// Off until a payment gateway is wired up: every company is free with
// unlimited members and no trial clock. Set BILLING_ENABLED=true to turn
// seat limits and trial expiry back on.
export const BILLING_ENABLED = process.env.BILLING_ENABLED === "true";
