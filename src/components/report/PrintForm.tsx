// Print-only view of the reimbursement, styled to match the Oriental Sheet
// Piling Excel template exactly: header block, category table with Sat/Unit/
// UnitPrice/Total columns, Terbilang row, two-column signature with equal
// heights, NB footnote.

import { rp, fmtDate } from "@/lib/format";
import { terbilangRupiah } from "@/lib/format/terbilang";
import { CATEGORY_META } from "@/lib/expense/categoryMeta";
import type { ExpenseType } from "@prisma/client";

// Ordered category list = the Excel's fixed rows (in the same order).
const CATEGORY_ORDER: ExpenseType[] = [
  "TICKETS", "HOTEL", "TOLL", "PETROL", "RENTAL_CAR", "TRANSPORT",
  "TOLL_PARKING", "MILEAGE", "MEAL", "ENTERTAINMENT", "EXTRA", "OTHER",
];

type Line = {
  type: ExpenseType;
  amount: number;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
};

type Props = {
  companyName: string;
  employeeName: string;
  division: string;
  visitedPlace: string;
  purpose: string;
  periodStart: Date;
  periodEnd: Date;
  totalAmount: number;
  lines: Line[];
  supervisorName: string;
};

export function PrintForm(p: Props) {
  // Aggregate lines by category so each row rolls up like Excel's =SUM formulas.
  const rows = CATEGORY_ORDER.map((type) => {
    const linesOfType = p.lines.filter((l) => l.type === type);
    if (linesOfType.length === 0) return { type, sat: null, unit: null, unitPrice: null, total: 0, empty: true };
    const total = linesOfType.reduce((n, l) => n + l.amount, 0);
    const sat = linesOfType.reduce((n, l) => n + (l.quantity ?? 0), 0) || null;
    const unit = linesOfType.find((l) => l.unit)?.unit ?? null;
    const unitPrice = linesOfType.length === 1 ? linesOfType[0].unitPrice : null;
    return { type, sat, unit, unitPrice, total, empty: false };
  });

  const period = `${fmtDate(p.periodStart)} — ${fmtDate(p.periodEnd)}`;

  return (
    <div className="hidden print:block text-[10.5pt] leading-[1.35] text-black">
      {/* Company header */}
      <div className="text-left mb-3">
        <p className="text-[13pt] font-bold uppercase">{p.companyName || " "}</p>
      </div>

      {/* Title */}
      <div className="text-center mb-4">
        <p className="text-[14pt] font-bold">
          Total Biaya Perjalanan Dinas Periode {period}
        </p>
        <p className="text-[10pt] italic">Business Travel Reimbursement Form</p>
      </div>

      {/* Employee block (Excel: A7-C7, A10-C10) */}
      <table className="w-full mb-3 text-[10.5pt]">
        <tbody>
          <tr>
            <td className="w-[24%] py-0.5 align-top">
              Nama Karyawan
              <div className="italic text-slate-600 text-[9pt]">Staff&apos;s Name</div>
            </td>
            <td className="w-[3%] py-0.5 align-top">:</td>
            <td className="py-0.5 align-top font-medium">{p.employeeName}</td>
          </tr>
          <tr>
            <td className="py-0.5 align-top">
              Divisi
              <div className="italic text-slate-600 text-[9pt]">Division</div>
            </td>
            <td className="py-0.5 align-top">:</td>
            <td className="py-0.5 align-top font-medium">{p.division || " "}</td>
          </tr>
          {p.visitedPlace && (
            <tr>
              <td className="py-0.5 align-top">
                Tempat yang dikunjungi
                <div className="italic text-slate-600 text-[9pt]">Visited Place</div>
              </td>
              <td className="py-0.5 align-top">:</td>
              <td className="py-0.5 align-top font-medium">{p.visitedPlace}</td>
            </tr>
          )}
          {p.purpose && (
            <tr>
              <td className="py-0.5 align-top">
                Tujuan
                <div className="italic text-slate-600 text-[9pt]">Purpose</div>
              </td>
              <td className="py-0.5 align-top">:</td>
              <td className="py-0.5 align-top font-medium">{p.purpose}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Expense table */}
      <table className="w-full mb-3 border-collapse text-[10pt]">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="text-left py-1 pr-2 w-[42%]">Expense type</th>
            <th className="text-right py-1 px-1 w-[8%]">Sat.</th>
            <th className="text-left py-1 px-1 w-[10%]">Unit</th>
            <th className="text-center py-1 px-1 w-[3%]" />
            <th className="text-right py-1 px-1 w-[17%]">Unit Price (IDR)</th>
            <th className="text-center py-1 px-1 w-[3%]" />
            <th className="text-right py-1 pl-2 w-[17%]">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const label = (CATEGORY_META[r.type] ?? CATEGORY_META.OTHER).label;
            return (
              <tr key={r.type} className="border-b border-slate-300 h-[22px]">
                <td className="py-1 pr-2">{label}</td>
                <td className="py-1 px-1 text-right font-mono">{r.sat ?? ""}</td>
                <td className="py-1 px-1">{r.unit ?? ""}</td>
                <td className="py-1 px-1 text-center">{r.sat ? "x" : ""}</td>
                <td className="py-1 px-1 text-right font-mono">{r.unitPrice != null ? rp(r.unitPrice) : ""}</td>
                <td className="py-1 px-1 text-center">{r.total ? "=" : ""}</td>
                <td className="py-1 pl-2 text-right font-mono font-semibold">{r.total ? rp(r.total) : ""}</td>
              </tr>
            );
          })}
          <tr className="border-t-2 border-black h-[24px]">
            <td colSpan={5} className="py-1 pr-2 text-right font-bold">Total</td>
            <td className="py-1 px-1 text-center font-bold">=</td>
            <td className="py-1 pl-2 text-right font-mono font-bold">{rp(p.totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      {/* Terbilang */}
      <table className="w-full mb-6 text-[10.5pt]">
        <tbody>
          <tr>
            <td className="w-[15%] align-top">Terbilang</td>
            <td className="w-[3%] align-top">:</td>
            <td className="align-top italic">{terbilangRupiah(p.totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      {/* Signatures — perfectly aligned two-column with matching heights */}
      <table className="w-full text-[10.5pt] mb-6">
        <tbody>
          <tr>
            <td className="w-1/2 align-top pr-6">
              <div className="mb-16">
                Dibuat oleh<span className="ml-4">:</span>
                <div className="italic text-slate-600 text-[9pt]">Submitted by</div>
              </div>
              <div className="border-t border-black pt-1 text-center">( {p.employeeName} )</div>
            </td>
            <td className="w-1/2 align-top pl-6">
              <div className="mb-16">
                Disetujui Oleh<span className="ml-4">:</span>
                <div className="italic text-slate-600 text-[9pt]">Approved by</div>
              </div>
              <div className="border-t border-black pt-1 text-center">( {p.supervisorName || " "} )</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer NB */}
      <p className="text-[9pt] italic text-slate-700 border-t border-slate-400 pt-2">
        NB : Harap Lampirkan Bukti Pengeluaran bersama Formulir ini.
      </p>
    </div>
  );
}
