export type DocType = "facture" | "devis";

export type InvoiceStatus = "brouillon" | "envoyee" | "payee" | "annulee";
export type QuoteStatus = "brouillon" | "envoye" | "accepte" | "refuse";

export type Line = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
};

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  taxId: string;
  notes: string;
  createdAt: string;
};

export type Document = {
  id: string;
  type: DocType;
  number: string;
  clientId: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  validUntil?: string; // devis
  lines: Line[];
  notes: string;
  status: InvoiceStatus | QuoteStatus;
  createdAt: string;
  paidAt?: string | null;
  convertedToId?: string | null;
  sourceQuoteId?: string | null;
};

export type Company = {
  name: string;
  legalForm: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  rccm: string;
  bank: string;
  iban: string;
  logoText: string;
};

export type Settings = {
  company: Company;
  currency: string;
  vatRate: number;
  invoicePrefix: string;
  quotePrefix: string;
  paymentTerms: number; // jours
  quoteValidity: number; // jours
  footerNote: string;
  paymentInstructions: string;
};

export type Database = {
  clients: Client[];
  documents: Document[];
  settings: Settings;
};

export type Totals = {
  subtotal: number;
  vat: number;
  total: number;
};

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";
