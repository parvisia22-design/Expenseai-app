import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getOrgContext } from "@/lib/org/context";
import { extractReceipt } from "@/lib/ocr/claude-vision";
import { saveImage } from "@/lib/storage/local";
import { addLineWithAttachment, upsertOpenReimbursement } from "@/lib/expense/group";
import { prisma } from "@/lib/db/prisma";
import type { ExpenseType } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 60;

// One shot: upload → OCR → persist as an ExpenseLine on the current DRAFT Reimbursement.
export async function POST(req: NextRequest) {
  const ctx = await getOrgContext();
  const userId = ctx?.userId;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.membership) return NextResponse.json({ error: "Buat atau gabung perusahaan dulu." }, { status: 403 });

  const form = await req.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "no image" }, { status: 400 });

  const purpose = (form.get("purpose") as string | null)?.trim() || "Uncategorized";
  const dateStr = (form.get("date") as string | null) ?? new Date().toISOString();

  const buf = Buffer.from(await file.arrayBuffer());
  const mediaType = file.type || "image/jpeg";
  const imageHash = createHash("sha256").update(buf).digest("hex");

  // Duplicate detection — same image already ingested for this user?
  const existing = await prisma.expenseLine.findFirst({
    where: { userId, imageHash },
    select: { id: true, reimbursementId: true, amount: true, date: true },
  });
  if (existing) {
    return NextResponse.json({
      duplicate: true,
      reimbursementId: existing.reimbursementId,
      lineId: existing.id,
      hash: imageHash,
      message: "Struk ini sudah pernah di-upload sebelumnya.",
    }, { status: 409 });
  }

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
    orgId: ctx.membership.orgId,
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
    imageHash,
  });

  return NextResponse.json({
    reimbursementId: reimbursement.id,
    lineId: line.id,
    extract,
    imageUrl: stored.url,
  });
}
