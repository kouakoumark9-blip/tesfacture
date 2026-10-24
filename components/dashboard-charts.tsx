"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { amount } from "@/lib/format";

const COLORS = ["#0E6B43", "#F77F00", "#3E8E7E", "#C9A227", "#6C63A6", "#B45F5F", "#8A9A5B"];

function formatTick(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)} M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} k`;
  return String(value);
}

export function MonthlyBars({
  data,
}: {
  data: { label: string; billed: number; collected: number }[];
}) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="#E4EBE6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6B7C74" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatTick}
            tick={{ fontSize: 11, fill: "#94A39B" }}
            axisLine={false}
            tickLine={false}
            width={46}
          />
          <Tooltip
            formatter={(value, name) => [
              `${amount(Number(value) || 0)} FCFA`,
              name === "billed" ? "Facturé" : "Encaissé",
            ]}
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #E4EBE6",
              fontSize: 12,
              padding: "6px 10px",
            }}
          />
          <Bar dataKey="billed" fill="#CFE3D8" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Bar dataKey="collected" fill="#0E6B43" radius={[4, 4, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentDonut({ data }: { data: { method: string; amount: number }[] }) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  if (total === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center px-6 text-center text-[12.5px] text-slate-500">
        Aucun encaissement sur la période.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div className="relative h-[168px] w-[168px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="method"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={entry.method} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${amount(Number(value) || 0)} FCFA`}
              contentStyle={{ borderRadius: 10, border: "1px solid #E4EBE6", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Encaissé</p>
            <p className="text-[13px] font-extrabold">{amount(total)}</p>
          </div>
        </div>
      </div>

      <ul className="w-full space-y-1.5">
        {data.map((entry, index) => (
          <li key={entry.method} className="flex items-center gap-2 text-[12px]">
            <span
              className="size-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-slate-600">{entry.method}</span>
            <span className="font-semibold">{amount(entry.amount)}</span>
            <span className="w-9 text-right text-[11px] text-slate-400">
              {Math.round((entry.amount / total) * 100)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
