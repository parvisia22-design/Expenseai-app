import type { PlanTier } from "@prisma/client";

// Seat limits per plan. Prices are intentionally not hard-coded yet —
// set them once the payment provider (Xendit / Midtrans) is chosen.
export const PLAN_INFO: Record<PlanTier, { label: string; seats: number; blurb: string }> = {
  TRIAL: { label: "Trial 14 hari", seats: 5, blurb: "Semua fitur, maks. 5 anggota" },
  STARTER: { label: "Starter", seats: 15, blurb: "Tim kecil, maks. 15 anggota" },
  BUSINESS: { label: "Business", seats: 100, blurb: "Multi-divisi, maks. 100 anggota" },
  ENTERPRISE: { label: "Enterprise", seats: 10_000, blurb: "Tanpa batas, SLA & onboarding" },
};

export const TRIAL_DAYS = 14;
