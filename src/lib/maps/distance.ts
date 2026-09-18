import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

export type RouteEstimate = {
  distanceKm: number;
  durationMin: number;
  originResolved: string;
  destResolved: string;
};

export async function estimateRoute(origin: string, destination: string): Promise<RouteEstimate> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("GOOGLE_MAPS_API_KEY not set");

  const res = await client.distancematrix({
    params: {
      origins: [origin],
      destinations: [destination],
      mode: "driving" as never,
      units: "metric" as never,
      key,
    },
    timeout: 8000,
  });

  const row = res.data.rows[0]?.elements[0];
  if (!row || row.status !== "OK") {
    throw new Error(`Route not found: ${row?.status ?? "no result"}`);
  }

  return {
    distanceKm: Math.round((row.distance.value / 1000) * 10) / 10,
    durationMin: Math.round(row.duration.value / 60),
    originResolved: res.data.origin_addresses[0],
    destResolved: res.data.destination_addresses[0],
  };
}

// "Kantor to Pabrik Jatake" | "Kantor -> Pabrik Jatake" | "Kantor → Pabrik Jatake"
export function parseRouteInput(text: string): { origin: string; destination: string } | null {
  const sep = /\s+(?:to|->|→|-->|—>)\s+/i;
  const parts = text.split(sep);
  if (parts.length !== 2) return null;
  const [o, d] = parts.map((s) => s.trim());
  if (!o || !d) return null;
  return { origin: o, destination: d };
}
