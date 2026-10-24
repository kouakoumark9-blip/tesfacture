"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn-base border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    >
      <Printer className="size-4" /> Imprimer
    </button>
  );
}
