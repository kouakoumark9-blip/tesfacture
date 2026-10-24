import type { MonthPoint } from "@/lib/stats";
import { num } from "@/lib/format";

export default function RevenueChart({ data, currency }: { data: MonthPoint[]; currency: string }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.paid, d.pending)));
  const totalPaid = data.reduce((s, d) => s + d.paid, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between px-5 pt-5">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wide text-slate-400">
            Encaissé sur 6 mois
          </p>
          <p className="mt-1 text-[22px] font-bold tracking-tight text-slate-900">
            {num(totalPaid)} <span className="text-[13px] font-semibold text-slate-400">{currency}</span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11.5px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-brand-600" /> Encaissé
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-brand-200" /> En attente
          </span>
        </div>
      </div>

      <div className="mt-6 flex h-[176px] items-end gap-2 px-5 sm:gap-4">
        {data.map((d) => {
          const paidH = Math.round((d.paid / max) * 100);
          const pendingH = Math.round((d.pending / max) * 100);
          return (
            <div key={d.key} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="relative flex h-full w-full max-w-[54px] items-end justify-center gap-1">
                <div
                  className="w-1/2 rounded-t-md bg-brand-600 transition-all duration-500 group-hover:bg-brand-700"
                  style={{ height: `${Math.max(paidH, d.paid > 0 ? 3 : 0)}%` }}
                  title={`Encaissé : ${num(d.paid)} ${currency}`}
                />
                <div
                  className="w-1/2 rounded-t-md bg-brand-200 transition-all duration-500 group-hover:bg-brand-300"
                  style={{ height: `${Math.max(pendingH, d.pending > 0 ? 3 : 0)}%` }}
                  title={`En attente : ${num(d.pending)} ${currency}`}
                />
              </div>
              <span className="text-[11.5px] font-medium capitalize text-slate-400 group-hover:text-slate-600">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-5" />
    </div>
  );
}
