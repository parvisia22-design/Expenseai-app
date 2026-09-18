import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { extractReceipt } from "@/lib/ocr/claude-vision";
import { saveImage } from "@/lib/storage/local";
import { attachToTrip, upsertDayTrip } from "@/lib/trip/group";

export const runtime = "nodejs";
export const maxDuration = 60;

// One shot: upload → OCR → persist as an Attachment on today's (or the given) Trip.
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "no image" }, { status: 400 });

  const purpose = (form.get("purpose") as string | null)?.trim() || "Uncategorized";
  const dateStr = (form.get("date") as string | null) ?? new Date().toISOString();

  const buf = Buffer.from(await file.arrayBuffer());
  const mediaType = file.type || "image/jpeg";

  const [stored, extract] = await Promise.all([
    saveImage(buf, mediaType),
    extractReceipt(buf.toString("base64"), mediaType).catch((err: unknown) => ({
      _error: (err as Error).message,
    })),
  ]);

  if ("_error" in extract) {
    return NextResponse.json({ error: extract._error, imageUrl: stored.url }, { status: 500 });
  }

  const CATEGORY_TO_TYPE = {
    MEAL: "RECEIPT",
    TOLL: "TOLL",
    PARKING: "PARKING",
    FUEL: "RECEIPT",
    OTHER: "OTHER",
  } as const;

  const trip = await upsertDayTrip({
    userId,
    date: extract.date ? new Date(extract.date) : new Date(dateStr),
    purpose,
  });

  const attachment = await attachToTrip({
    userId,
    tripId: trip.id,
    type: CATEGORY_TO_TYPE[extract.category],
    imageUrl: stored.url,
    amount: extract.total ?? null,
    ocrJson: extract,
  });

  return NextResponse.json({ tripId: trip.id, attachmentId: attachment.id, extract, imageUrl: stored.url });
}
