export const rp = (n: number | null | undefined) =>
  `Rp ${(n ?? 0).toLocaleString("id-ID")}`;

export const fmtDate = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};
