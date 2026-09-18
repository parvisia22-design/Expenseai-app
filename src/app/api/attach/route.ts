import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { attachToTrip, upsertDayTrip } from "@/lib/trip/group";

export const runtime = "nodejs";

const Body = z.object({
  purpose: z.string().min(1),
  date: z.string(),
  originId: z.string().nullish(),
  destId: z.string().nullish(),
  type: z.enum(["RECEIPT", "TOLL", "PARKING", "MILEAGE", "OTHER"]),
  imageUrl: z.string().url(),
  amount: z.number().int().nullish(),
  ocrJson: z.unknown().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const b = parsed.data;

  const trip = await upsertDayTrip({
    userId,
    date: new Date(b.date),
    purpose: b.purpose,
    originId: b.originId,
    destId: b.destId,
  });

  const att = await attachToTrip({
    userId,
    tripId: trip.id,
    type: b.type,
    imageUrl: b.imageUrl,
    amount: b.amount ?? null,
    ocrJson: b.ocrJson,
  });

  return NextResponse.json({ tripId: trip.id, attachmentId: att.id });
}
