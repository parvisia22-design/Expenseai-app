// Icon + tone metadata used by the dossier list.
import type { ExpenseType } from "@prisma/client";

type Tone = "primary" | "surface" | "secondary";

export const CATEGORY_META: Record<ExpenseType, { icon: string; tone: Tone; label: string }> = {
  TICKETS: { icon: "flight_takeoff", tone: "primary", label: "Tickets" },
  HOTEL: { icon: "hotel", tone: "surface", label: "Hotel" },
  RENTAL_CAR: { icon: "directions_car", tone: "primary", label: "Rental Car" },
  TRANSPORT: { icon: "local_taxi", tone: "surface", label: "Transportation" },
  TOLL_PARKING: { icon: "toll", tone: "surface", label: "Toll + Parking" },
  PETROL: { icon: "local_gas_station", tone: "surface", label: "Petrol" },
  MILEAGE: { icon: "directions_car", tone: "primary", label: "Mileage" },
  MEAL: { icon: "restaurant", tone: "secondary", label: "Meal" },
  ENTERTAINMENT: { icon: "celebration", tone: "surface", label: "Entertainment" },
  EXTRA: { icon: "inventory_2", tone: "surface", label: "Extra" },
  OTHER: { icon: "receipt_long", tone: "surface", label: "Lain-lain" },
  // deprecated legacy → still render
  TOLL: { icon: "toll", tone: "surface", label: "Toll" },
  PARKING: { icon: "local_parking", tone: "surface", label: "Parking" },
  FUEL: { icon: "local_gas_station", tone: "surface", label: "Petrol" },
  LODGING: { icon: "hotel", tone: "surface", label: "Hotel" },
};

export const toneClasses = {
  primary: "bg-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-sm",
  surface: "bg-[var(--color-surface-container-high)] text-[var(--color-primary)]",
  secondary: "bg-[var(--color-secondary-container)]/60 text-[var(--color-on-secondary-container)]",
} as const;
