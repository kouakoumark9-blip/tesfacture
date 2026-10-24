import type { DocumentBundle } from "./documents";

export type PreviewItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type PreviewInstallment = {
  id: string;
  label: string;
  amount: number;
  dueDate: string | null;
  paidAt: string | null;
  method: string | null;
};

export type PreviewDoc = {
  id: string;
  type: "FAC" | "DEV" | "BL";
  number: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  discountPercent: number;
  vatPercent: number;
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
  note: string | null;
  paymentMethods: string[];
  deliveryAddress: string | null;
  deliveredBy: string | null;
  shareToken: string;
  client: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  company: {
    name: string;
    logo: string | null;
    rccm: string | null;
    taxNumber: string | null;
    address: string | null;
    phone: string | null;
    paymentNumbers: Record<string, string | undefined>;
  };
  items: PreviewItem[];
  installments: PreviewInstallment[];
};

export function toPreview(bundle: DocumentBundle): PreviewDoc {
  const { doc, items, installments, client, company } = bundle;
  return {
    id: doc.id,
    type: doc.type as "FAC" | "DEV" | "BL",
    number: doc.number,
    status: doc.status,
    issueDate: doc.issueDate,
    dueDate: doc.dueDate,
    discountPercent: Number(doc.discountPercent),
    vatPercent: Number(doc.vatPercent),
    subtotal: Number(doc.subtotal),
    discountAmount: Number(doc.discountAmount),
    vatAmount: Number(doc.vatAmount),
    total: Number(doc.total),
    note: doc.note,
    paymentMethods: doc.paymentMethods ?? [],
    deliveryAddress: doc.deliveryAddress,
    deliveredBy: doc.deliveredBy,
    shareToken: doc.shareToken,
    client: {
      name: client?.name ?? "Client",
      phone: client?.phone ?? null,
      email: client?.email ?? null,
      address: client?.address ?? null,
    },
    company: {
      name: company?.name ?? "Mon entreprise",
      logo: company?.logo ?? null,
      rccm: company?.rccm ?? null,
      taxNumber: company?.taxNumber ?? null,
      address: company?.address ?? null,
      phone: company?.phone ?? null,
      paymentNumbers: (company?.paymentNumbers ?? {}) as Record<string, string | undefined>,
    },
    items: items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      total: Math.round(Number(item.quantity) * Number(item.unitPrice)),
    })),
    installments: installments.map((item) => ({
      id: item.id,
      label: item.label,
      amount: Number(item.amount),
      dueDate: item.dueDate,
      paidAt: item.paidAt ? item.paidAt.toISOString() : null,
      method: item.method,
    })),
  };
}

export const DOC_TYPE_LABEL: Record<"FAC" | "DEV" | "BL", string> = {
  FAC: "Facture",
  DEV: "Devis",
  BL: "Bon de livraison",
};

export const STATUS_LABEL: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyé",
  partial: "Partiel",
  paid: "Payé",
  overdue: "En retard",
  cancelled: "Annulé",
  delivered: "Livré",
};

export const STATUS_TONE: Record<
  string,
  "neutral" | "success" | "warning" | "danger" | "info" | "accent"
> = {
  draft: "neutral",
  sent: "info",
  partial: "warning",
  paid: "success",
  overdue: "danger",
  cancelled: "neutral",
  delivered: "success",
};
