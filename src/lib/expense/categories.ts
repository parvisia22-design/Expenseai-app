import type { ExpenseType } from "@prisma/client";

// Ordered dropdown list matching the Stitch reimbursement form.
export const CATEGORY_OPTIONS: { value: ExpenseType; label: string; unit?: string }[] = [
  { value: "TICKETS", label: "Tickets (flight/train/bus)", unit: "trip" },
  { value: "HOTEL", label: "Hotel", unit: "night" },
  { value: "RENTAL_CAR", label: "Rental Car", unit: "day" },
  { value: "TRANSPORT", label: "Transportation (Taxi)", unit: "trip" },
  { value: "TOLL_PARKING", label: "Toll+parking", unit: "trip" },
  { value: "PETROL", label: "Petrol", unit: "L" },
  { value: "MILEAGE", label: "Mileage", unit: "km" },
  { value: "MEAL", label: "Meal", unit: "pax" },
  { value: "ENTERTAINMENT", label: "Entertainment", unit: "event" },
  { value: "EXTRA", label: "Extra (Stationery)", unit: "item" },
  { value: "OTHER", label: "Custom row…", unit: "" },
];

const LABELS: Record<ExpenseType, string> = {
  TICKETS: "Tickets",
  HOTEL: "Hotel",
  RENTAL_CAR: "Rental Car",
  TRANSPORT: "Transportation",
  TOLL_PARKING: "Toll+parking",
  PETROL: "Petrol",
  MILEAGE: "Mileage",
  MEAL: "Meal",
  ENTERTAINMENT: "Entertainment",
  EXTRA: "Extra",
  OTHER: "Lain-lain",
  // deprecated legacy labels
  TOLL: "Toll",
  PARKING: "Parking",
  FUEL: "Petrol",
  LODGING: "Hotel",
};

export const labelFor = (t: ExpenseType | string) => LABELS[t as ExpenseType] ?? String(t);
