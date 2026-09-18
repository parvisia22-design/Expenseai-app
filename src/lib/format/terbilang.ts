// Indonesian number → words. Handles 0 up to trillions of rupiah.
// terbilang(87380) → "delapan puluh tujuh ribu tiga ratus delapan puluh"
const ONES = [
  "", "satu", "dua", "tiga", "empat", "lima",
  "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas",
] as const;

function belowThousand(n: number): string {
  if (n === 0) return "";
  if (n < 12) return ONES[n];
  if (n < 20) return `${ONES[n - 10]} belas`;
  if (n < 100) {
    const t = Math.floor(n / 10);
    const r = n % 10;
    return r ? `${ONES[t]} puluh ${ONES[r]}` : `${ONES[t]} puluh`;
  }
  const h = Math.floor(n / 100);
  const r = n % 100;
  const head = h === 1 ? "seratus" : `${ONES[h]} ratus`;
  return r ? `${head} ${belowThousand(r)}` : head;
}

export function terbilang(n: number): string {
  if (!Number.isFinite(n)) return "";
  if (n < 0) return `minus ${terbilang(-n)}`;
  if (n === 0) return "nol";

  const parts: string[] = [];
  const scales = [
    { unit: 1_000_000_000_000, word: "triliun" },
    { unit: 1_000_000_000, word: "miliar" },
    { unit: 1_000_000, word: "juta" },
    { unit: 1_000, word: "ribu" },
  ];

  let rem = Math.floor(n);
  for (const { unit, word } of scales) {
    if (rem >= unit) {
      const q = Math.floor(rem / unit);
      rem = rem % unit;
      const head =
        word === "ribu" && q === 1 ? "seribu" : `${belowThousand(q)} ${word}`;
      parts.push(head);
    }
  }
  if (rem > 0) parts.push(belowThousand(rem));
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export const terbilangRupiah = (n: number) =>
  `${terbilang(n)} rupiah`.replace(/^./, (c) => c.toUpperCase());
