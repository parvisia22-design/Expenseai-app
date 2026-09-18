import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { extractReceipt } from "@/lib/ocr/claude-vision";
import { saveImage } from "@/lib/storage/local";
import { addLineWithAttachment, upsertOpenReimbursement } from "@/lib/expense/group";
import type { ExpenseType } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60;

// One shot: upload → OCR → persist as an ExpenseLine on the current DRAFT Reimbursement.
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

  const CATEGORY_TO_TYPE: Record<string, ExpenseType> = {
    TICKETS: "TICKETS",
    HOTEL: "HOTEL",
    RENTAL_CAR: "RENTAL_CAR",
    TRANSPORT: "TRANSPORT",
    TOLL_PARKING: "TOLL_PARKING",
    PETROL: "PETROL",
    MILEAGE: "MILEAGE",
    MEAL: "MEAL",
    ENTERTAINMENT: "ENTERTAINMENT",
    EXTRA: "EXTRA",
    OTHER: "OTHER",
  };

  const reimbursement = await upsertOpenReimbursement({
    userId,
    purpose,
    date: extract.date ? new Date(extract.date) : new Date(dateStr),
  });

  const line = await addLineWithAttachment({
    userId,
    reimbursementId: reimbursement.id,
    date: extract.date ? new Date(extract.date) : new Date(dateStr),
    type: CATEGORY_TO_TYPE[extract.category] ?? "OTHER",
    amount: extract.total ?? null,
    purpose,
    imageUrl: stored.url,
    ocrJson: extract,
  });

  return NextResponse.json({
    reimbursementId: reimbursement.id,
    lineId: line.id,
    extract,
    imageUrl: stored.url,
  });
}
