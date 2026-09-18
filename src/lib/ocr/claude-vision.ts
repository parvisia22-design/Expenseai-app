import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ReceiptExtract = {
  merchant: string | null;
  date: string | null;        // ISO yyyy-mm-dd
  total: number | null;       // integer IDR
  currency: string | null;
  category: "MEAL" | "TOLL" | "PARKING" | "FUEL" | "OTHER";
  items: { name: string; price: number }[];
  raw_text: string;
};

const SYSTEM = `You extract structured data from Indonesian receipts (struk/bon).
Return JSON matching the schema. Amounts are integers in IDR (strip "Rp", dots, commas).
Category rules:
- MEAL: restaurants, cafes, food delivery, groceries
- TOLL: e-toll top-up, tol gerbang, JORR, Jasa Marga
- PARKING: parking lots, valet, Secure Parking
- FUEL: Pertamina, Shell, BP, SPBU
- OTHER: anything else`;

const SCHEMA_HINT = `{"merchant":string|null,"date":"YYYY-MM-DD"|null,"total":int|null,"currency":"IDR","category":"MEAL"|"TOLL"|"PARKING"|"FUEL"|"OTHER","items":[{"name":string,"price":int}],"raw_text":string}`;

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
