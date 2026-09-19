import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { rp } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { createTemplate, deleteTemplate, applyTemplate } from "@/lib/template/actions";

export default async function TemplatesPage() {
  const session = await auth();
  const templates = await prisma.recurringTemplate.findMany({
    where: { userId: session!.user!.id },
    orderBy: [{ useCount: "desc" }, { createdAt: "desc" }],
  });

  return (
    <main className="max-w-md mx-auto px-4 pt-4 pb-40 space-y-4">
      <header>
        <h1 className="text-headline-lg text-[var(--color-on-surface)]">Template</h1>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">Rute berulang, langsung dibuat jadi Reimbursement.</p>
      </header>

      <section className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm">
        <details>
          <summary className="text-label-lg text-[var(--color-primary)] cursor-pointer">+ Template Baru</summary>
          <form action={createTemplate} className="mt-3 space-y-2">
            <Field name="name" label="Nama template" placeholder="Kantor → Pabrik Jatake (Drone)" required />
            <Field name="purpose" label="Tujuan / Purpose" placeholder="Drone" required />
            <div className="grid grid-cols-2 gap-2">
              <Field name="originText" label="Dari" placeholder="Kantor" />
              <Field name="destText" label="Ke" placeholder="Pabrik Jatake" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <Field name="distanceKm" label="km" type="number" step="0.1" />
              <Field name="tollAmount" label="Tol Rp" type="number" />
              <Field name="parkingAmount" label="Parkir Rp" type="number" />
              <Field name="mealAmount" label="Meal Rp" type="number" />
            </div>
            <button className="w-full rounded-xl bg-[var(--color-primary-container)] py-2 text-label-lg text-[var(--color-on-primary)]">Simpan Template</button>
          </form>
        </details>
      </section>

      <ul className="space-y-2">
        {templates.length === 0 && (
          <li className="rounded-2xl border border-dashed border-[var(--color-outline-variant)]/40 py-10 text-center text-body-md text-[var(--color-on-surface-variant)]">
            Belum ada template.
          </li>
        )}
        {templates.map((t) => {
          const totalPreview = (t.tollAmount ?? 0) + (t.parkingAmount ?? 0) + (t.mealAmount ?? 0);
          return (
            <li key={t.id} className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-4 border border-[var(--color-outline-variant)]/25 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-label-lg text-[var(--color-on-surface)] font-semibold">{t.name}</p>
                  <p className="text-body-sm text-[var(--color-on-surface-variant)]">
                    {t.purpose} · {t.originText ?? "?"} → {t.destText ?? "?"}
                    {t.distanceKm ? ` · ${t.distanceKm} km` : ""}
                    {totalPreview > 0 ? ` · ${rp(totalPreview)}` : ""}
                  </p>
                  <p className="mt-1 text-label-sm text-[var(--color-on-surface-variant)]">
                    Dipakai {t.useCount}× {t.lastUsedAt ? `· terakhir ${t.lastUsedAt.toLocaleDateString("id-ID")}` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <form action={applyTemplate}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="rounded-full bg-[var(--color-primary-container)] px-3 py-1.5 text-label-sm text-[var(--color-on-primary)] flex items-center gap-1">
                      <Icon name="play_arrow" size={14} filled />
                      Jalankan
                    </button>
                  </form>
                  <form action={deleteTemplate}>
                    <input type="hidden" name="id" value={t.id} />
                    <button aria-label="Delete" className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] p-1 self-end">
                      <Icon name="delete" size={16} />
                    </button>
                  </form>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function Field(p: { name: string; label: string; placeholder?: string; required?: boolean; type?: string; step?: string }) {
  return (
    <label className="block">
      <span className="text-label-sm text-[var(--color-on-surface-variant)]">{p.label}</span>
      <input
        name={p.name}
        type={p.type ?? "text"}
        step={p.step}
        required={p.required}
        placeholder={p.placeholder}
        className="w-full rounded-xl border border-[var(--color-outline-variant)]/40 bg-[var(--color-surface-container-low)] px-3 py-2 text-body-md"
      />
    </label>
  );
}
