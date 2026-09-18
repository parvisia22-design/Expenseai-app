import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { suggestPlacesForPurpose, suggestPurposesForPlace } from "@/lib/learning/purpose-links";

export const runtime = "nodejs";

const Query = z.union([
  z.object({ kind: z.literal("purpose"), value: z.string().min(1) }),
  z.object({ kind: z.literal("place"), placeId: z.string().min(1) }),
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Query.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "bad input" }, { status: 400 });

  if (parsed.data.kind === "purpose") {
    const links = await suggestPlacesForPurpose(userId, parsed.data.value);
    return NextResponse.json({ places: links.map((l) => ({ id: l.place.id, name: l.place.name, count: l.count })) });
  }
  const links = await suggestPurposesForPlace(userId, parsed.data.placeId);
  return NextResponse.json({ purposes: links });
}
