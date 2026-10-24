import Link from "next/link";
import { clsx } from "clsx";
import { Inbox } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-brand-600">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[26px] font-bold tracking-tight text-slate-900 sm:text-[30px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[14px] text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  return (
    <Link href={href} className={clsx("btn-base", variants[variant], className)}>
      {children}
    </Link>
  );
}

export const variants = {
  primary:
    "bg-brand-600 text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-200",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-rose-600 text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700",
};

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <Inbox className="size-6" />
      </span>
      <h3 className="mt-4 text-[15px] font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-[13.5px] text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={clsx("card overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12.5px] text-slate-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const palette = [
    "bg-brand-100 text-brand-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-sky-100 text-sky-700",
    "bg-rose-100 text-rose-700",
    "bg-violet-100 text-violet-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
  return (
    <span
      className={clsx(
        "grid size-9 shrink-0 place-items-center rounded-full text-[12px] font-bold",
        palette[hash % palette.length],
        className
      )}
    >
      {letters || "?"}
    </span>
  );
}
