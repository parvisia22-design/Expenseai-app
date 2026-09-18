import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { readImage, contentTypeFromName } from "@/lib/storage/local";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ name: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { name } = await ctx.params;
  try {
    const buf = await readImage(name);
    return new NextResponse(buf as unknown as BodyInit, {
      headers: { "content-type": contentTypeFromName(name), "cache-control": "private, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
