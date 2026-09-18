import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ExtractCategory =
  | "TICKETS" | "HOTEL" | "RENTAL_CAR" | "TRANSPORT" | "TOLL_PARKING"
  | "PETROL" | "MILEAGE" | "MEAL" | "ENTERTAINMENT" | "EXTRA" | "OTHER";

export type ReceiptExtract = {
  merchant: string | null;
  date: string | null;
  total: number | null;
  currency: string | null;
  category: ExtractCategory;
  items: { name: string; price: number }[];
  raw_text: string;
};

const SYSTEM = `You extract structured data from Indonesian receipts (struk/bon).
Return JSON matching the schema. Amounts are integers in IDR (strip "Rp", dots, commas).
Category rules:
- TICKETS: airline, train, bus, KAI, Garuda, Lion
- HOTEL: hotels, guest houses, Airbnb receipts
- RENTAL_CAR: car rental (TRAC, Blue Bird rental)
- TRANSPORT: Grab, Gojek, Blue Bird taxi, ojek, angkot
- TOLL_PARKING: e-toll top-up, tol gerbang, JORR, Jasa Marga, parking lots, valet, Secure Parking
- PETROL: Pertamina, Shell, BP, SPBU
- MEAL: restaurants, cafes, food delivery (GrabFood, GoFood), groceries
- ENTERTAINMENT: cinema, events, client entertainment
- EXTRA: stationery, small office supplies
- OTHER: anything else`;

const SCHEMA_HINT = `{"merchant":string|null,"date":"YYYY-MM-DD"|null,"total":int|null,"currency":"IDR","category":"TICKETS"|"HOTEL"|"RENTAL_CAR"|"TRANSPORT"|"TOLL_PARKING"|"PETROL"|"MEAL"|"ENTERTAINMENT"|"EXTRA"|"OTHER","items":[{"name":string,"price":int}],"raw_text":string}`;

type SupportedMedia = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const normalizeMedia = (t: string): SupportedMedia =>
  (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(t) ? t : "image/jpeg") as SupportedMedia;

export async function extractReceipt(imageBase64: string, mediaType: string): Promise<ReceiptExtract> {
  const res = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: normalizeMedia(mediaType), data: imageBase64 } },
          { type: "text", text: `Extract this receipt as JSON. Schema: ${SCHEMA_HINT}\nRespond with ONLY the JSON object, no prose.` },
        ],
      },
    ],
  });

  const block = res.content.find((c) => c.type === "text");
  if (!block || block.type !== "text") throw new Error("No text response from Claude");

  const json = block.text.trim().replace(/^```json\s*/, "").replace(/```$/, "");
  return JSON.parse(json) as ReceiptExtract;
}
