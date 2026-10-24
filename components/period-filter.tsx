"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { CalendarRange } from "lucide-react";
import { clsx } from "clsx";
import { PERIOD_OPTIONS } from "@/lib/period";

export default function PeriodFilter({ value }: { value: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [custom, setCustom] = useState(value === "custom");
  const [from, setFrom] = useState(params.get("from") ?? "");
  const [to, setTo] = useState(params.get("to") ?? "");

  function go(key: string, extra?: Record<string, string>) {
    const search = new URLSearchParams();
    search.set("period", key);
    if (extra) for (const [k, v] of Object.entries(extra)) if (v) search.set(k, v);
    router.push(`/app?${search.toString()}`);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() =>
              option.key === "custom" ? setCustom((v) => !v) : go(option.key)
            }
            className={clsx(
              "min-h-9 rounded-full border px-3 text-[12px] font-semibold transition",
              value === option.key
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-black/10 bg-white text-slate-600 hover:bg-black/[0.02]"
            )}
            aria-pressed={value === option.key}
          >
            {option.label}
          </button>
        ))}
      </div>

      {custom && (
        <div className="card flex flex-wrap items-end gap-2 p-2.5">
          <div className="flex-1">
            <label className="label" htmlFor="from">
              Du
            </label>
            <input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="field min-h-10 py-1.5 text-[13px]"
            />
          </div>
          <div className="flex-1">
            <label className="label" htmlFor="to">
              Au
            </label>
            <input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="field min-h-10 py-1.5 text-[13px]"
            />
          </div>
          <button
            onClick={() => go("custom", { from, to })}
            className="btn min-h-10 bg-brand-500 px-3 text-[13px] text-white"
          >
            <CalendarRange className="size-4" /> Appliquer
          </button>
        </div>
      )}
    </div>
  );
}
