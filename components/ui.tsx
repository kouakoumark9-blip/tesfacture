"use client";

import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export function Alert({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: "error" | "success" | "info";
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-brand-200 bg-brand-50 text-brand-800",
    info: "border-accent-200 bg-accent-50 text-accent-800",
  }[tone];
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-2 rounded-xl border px-3.5 py-3 text-[13.5px] font-medium",
        styles
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-[12.5px] font-medium text-red-600">{children}</p>;
}

export function SubmitButton({
  children,
  pending,
  className,
  variant = "primary",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  variant?: "primary" | "accent" | "ghost" | "outline";
}) {
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
    accent: "bg-accent-500 text-white hover:bg-accent-600 shadow-sm",
    ghost: "text-slate-600 hover:bg-black/5",
    outline: "border border-black/10 bg-white text-slate-700 hover:bg-black/[0.03]",
  }[variant];

  return (
    <button
      {...rest}
      disabled={pending || rest.disabled}
      className={clsx("btn", variants, className)}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Spinner({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[13.5px] text-slate-500">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icon && (
        <span className="mb-3 grid size-12 place-items-center rounded-full bg-brand-50 text-brand-500">
          {icon}
        </span>
      )}
      <h3 className="text-[16px] font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-[13.5px] text-slate-500">{description}</p>
      {action && <div className="mt-5 w-full max-w-xs">{action}</div>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "accent";
}) {
  const tones = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-brand-50 text-brand-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
    info: "bg-sky-50 text-sky-700",
    accent: "bg-accent-50 text-accent-700",
  }[tone];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold",
        tones
      )}
    >
      {children}
    </span>
  );
}
