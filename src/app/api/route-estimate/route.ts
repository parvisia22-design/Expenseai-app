import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { estimateRoute, parseRouteInput } from "@/lib/maps/distance";

export const runtime = "nodejs";

const Body = z.object({ text: z.string().min(3) });

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "bad input" }, { status: 400 });

  const route = parseRouteInput(parsed.data.text);
  if (!route) return NextResponse.json({ error: "cannot parse route" }, { status: 422 });

  // Look up user's Places by name (case-insensitive).
  const [originPlace, destPlace] = await Promise.all([
    prisma.place.findFirst({ where: { userId, name: { equals: route.origin, mode: "insensitive" } } }),
    prisma.place.findFirst({ where: { userId, name: { equals: route.destination, mode: "insensitive" } } }),
  ]);

  // Check cached preset first.
  if (originPlace && destPlace) {
    const preset = await prisma.routePreset.findUnique({
      where: { userId_originId_destId: { userId, originId: originPlace.id, destId: destPlace.id } },
    });
    if (preset) {
      return NextResponse.json({
        source: "preset",
        distanceKm: preset.distanceKm,
        avgToll: preset.avgToll,
        avgParking: preset.avgParking,
        originId: originPlace.id,
        destId: destPlace.id,
      });
    }
  }

  // Fall back to Google.
  const est = await estimateRoute(route.origin, route.destination);
  return NextResponse.json({
    source: "google",
    distanceKm: est.distanceKm,
    durationMin: est.durationMin,
    originResolved: est.originResolved,
    destResolved: est.destResolved,
    originId: originPlace?.id ?? null,
    destId: destPlace?.id ?? null,
  });
}
