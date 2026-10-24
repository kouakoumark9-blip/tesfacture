"use client";

import { MessageCircle } from "lucide-react";
import { reminderMessage, whatsappUrl } from "@/lib/share";

export default function ReminderLink({
  clientName,
  clientPhone,
  companyName,
  documentNumber,
  installmentLabel,
  amount,
  dueDate,
  paymentMethods,
  paymentNumbers,
  shareToken,
  appUrl,
  compact = false,
}: {
  clientName: string;
  clientPhone: string | null;
  companyName: string;
  documentNumber: string;
  installmentLabel: string;
  amount: number;
  dueDate: string | null;
  paymentMethods: string[];
  paymentNumbers: Record<string, string | undefined>;
  shareToken?: string;
  appUrl?: string;
  compact?: boolean;
}) {
  const message = reminderMessage({
    clientName,
    companyName,
    documentNumber,
    installmentLabel,
    amount,
    dueDate,
    paymentMethods,
    paymentNumbers,
    shareToken,
    appUrl,
  });

  return (
    <a
      href={whatsappUrl(clientPhone, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={
        compact
          ? "inline-flex items-center gap-1 rounded-full bg-[#25D366]/10 px-2.5 py-1 text-[11.5px] font-bold text-[#0E7A43] hover:bg-[#25D366]/20"
          : "btn min-h-9 bg-[#25D366] px-3 text-[12px] text-white hover:bg-[#1eb958]"
      }
    >
      <MessageCircle className={compact ? "size-3.5" : "size-3.5"} />
      Relancer
    </a>
  );
}
