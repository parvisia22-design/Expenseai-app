import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { upsertOpenReimbursement, recomputeReimbursementTotal } from "@/lib/expense/group";

export const runtime = "nodejs";

const Body = z.object({
  purpose: z.string().min(1),
  origin: z.string().min(1),
  destination: z.string().min(1),
  distanceKm: z.number().nonnegative(),
  tollAmount: z.number().int().nonnegative(),
  parkingAmount: z.number().int().nonnegative(),
  ratePerKm: z.number().int().nonnegative().optional(), // future: mileage rate per km
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;

  const reimbursement = await upsertOpenReimbursement({
    userId,
    purpose: b.purpose,
    date: new Date(),
  });

  const today = new Date();
  const place = `${b.origin} → ${b.destination}`;
  const created: string[] = [];

  if (b.distanceKm > 0) {
    const mileageAmount = b.ratePerKm ? Math.round(b.distanceKm * b.ratePerKm) : 0;
    const l = await prisma.expenseLine.create({
      data: {
        userId,
        reimbursementId: reimbursement.id,
        date: today,
        type: "MILEAGE",
        placeText: place,
        mileageKm: b.distanceKm,
        amount: mileageAmount,
        description: `${b.distanceKm} km`,
      },
    });
    created.push(l.id);
  }

  if (b.tollAmount > 0) {
    const l = await prisma.expenseLine.create({
      data: {
        userId, reimbursementId: reimbursement.id, date: today,
        type: "TOLL", placeText: place, amount: b.tollAmount,
      },
    });
    created.push(l.id);
  }

  if (b.parkingAmount > 0) {
    const l = await prisma.expenseLine.create({
      data: {
        userId, reimbursementId: reimbursement.id, date: today,
        type: "PARKING", placeText: place, amount: b.parkingAmount,
      },
    });
    created.push(l.id);
  }

  await recomputeReimbursementTotal(reimbursement.id);

  return NextResponse.json({ reimbursementId: reimbursement.id, lineIds: created });
}
