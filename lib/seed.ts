import type { Client, Database, DocType, Document, Line, Settings } from "./types";
import { addDays, today } from "./format";

const BASE = today();
const rel = (days: number) => addDays(BASE, days);

export const DEFAULT_SETTINGS: Settings = {
  company: {
    name: "TESFACTURE",
    legalForm: "SARL",
    address: "Rue des Jardins, Immeuble Palmier, 3e étage",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    phone: "+225 27 22 45 12 90",
    email: "contact@tesfacture.ci",
    website: "www.tesfacture.ci",
    taxId: "CI-2024-884512-A",
    rccm: "CI-ABJ-2024-B-14582",
    bank: "SIB — Société Ivoirienne de Banque",
    iban: "CI93 0001 2345 6789 0123 4567 89",
    logoText: "TF",
  },
  currency: "FCFA",
  vatRate: 18,
  invoicePrefix: "FAC",
  quotePrefix: "DEV",
  paymentTerms: 30,
  quoteValidity: 15,
  footerNote:
    "Merci de votre confiance. Paiement par virement bancaire ou Mobile Money (Orange Money / Wave / MTN).",
  paymentInstructions:
    "Règlement à réception de facture par virement bancaire. Les pénalités de retard sont de 1,5 % par mois conformément à la réglementation en vigueur (UEMOA).",
};

function uid(n: number) {
  return `seed_${n}`;
}

function line(
  i: number,
  description: string,
  quantity: number,
  unitPrice: number,
  vatRate = 18
): Line {
  return { id: uid(i), description, quantity, unitPrice, vatRate };
}

const clients: Client[] = [
  {
    id: "cli_nova",
    name: "Awa Traoré",
    company: "Nova Digital SARL",
    email: "awa.traore@novadigital.ci",
    phone: "+225 07 08 45 12 33",
    address: "Cocody Angré, 8e tranche",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    taxId: "CI-2019-452187-B",
    notes: "Compte clé — interlocutrice directrice marketing.",
    createdAt: "2024-02-11",
  },
  {
    id: "cli_logistics",
    name: "Ibrahim Coulibaly",
    company: "Groupe Ivoire Logistics",
    email: "i.coulibaly@ivoirelogistics.ci",
    phone: "+225 01 02 78 90 44",
    address: "Zone portuaire, Treichville",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    taxId: "CI-2017-778412-C",
    notes: "Facturation centralisée au siège, bon de commande obligatoire.",
    createdAt: "2024-05-03",
  },
  {
    id: "cli_konan",
    name: "Me Konan Yao",
    company: "Cabinet Konan & Associés",
    email: "contact@konan-associes.ci",
    phone: "+225 27 20 31 55 08",
    address: "Avenue Delafosse, Plateau",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    taxId: "CI-2015-112233-D",
    notes: "Cabinet d'avocats d'affaires.",
    createdAt: "2023-11-20",
  },
  {
    id: "cli_baobab",
    name: "Fatou Diomandé",
    company: "Hôtel Baobab",
    email: "direction@hotelbaobab.ci",
    phone: "+225 05 06 12 78 90",
    address: "Boulevard Hassan II",
    city: "Grand-Bassam",
    country: "Côte d'Ivoire",
    taxId: "CI-2021-556677-E",
    notes: "Saisonnier — fortes commandes en décembre.",
    createdAt: "2025-01-14",
  },
  {
    id: "cli_yiriwa",
    name: "Serge Bamba",
    company: "Yiriwa Tech",
    email: "serge@yiriwa.tech",
    phone: "+225 07 47 88 21 10",
    address: "Marcory Résidentiel",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    taxId: "",
    notes: "Start-up incubée — paiement en plusieurs fois possible.",
    createdAt: "2025-06-08",
  },
];

type Spec = {
  n: number;
  type: DocType;
  clientId: string;
  number: string;
  issueDate: string;
  status: Document["status"];
  lines: Line[];
  notes?: string;
  paid?: boolean;
  dueDays?: number;
};

const specs: Spec[] = [
  {
    n: 1,
    type: "facture",
    clientId: "cli_nova",
    number: "FAC-2026-0001",
    issueDate: rel(-152),
    status: "payee",
    dueDays: 30,
    paid: true,
    lines: [
      line(101, "Refonte du site web vitrine — phase 1 (UX/UI)", 1, 1_450_000),
      line(102, "Intégration responsive et recette", 1, 650_000),
    ],
    notes: "Merci pour votre confiance.",
  },
  {
    n: 2,
    type: "facture",
    clientId: "cli_baobab",
    number: "FAC-2026-0002",
    issueDate: rel(-138),
    status: "payee",
    dueDays: 30,
    paid: true,
    lines: [
      line(103, "Shooting photo & vidéo institutionnelle", 2, 480_000),
      line(104, "Montage et post-production", 1, 320_000),
    ],
  },
  {
    n: 3,
    type: "devis",
    clientId: "cli_konan",
    number: "DEV-2026-0001",
    issueDate: rel(-130),
    status: "accepte",
    lines: [line(105, "Création d'une identité visuelle complète", 1, 1_200_000)],
  },
  {
    n: 4,
    type: "facture",
    clientId: "cli_logistics",
    number: "FAC-2026-0003",
    issueDate: rel(-121),
    status: "payee",
    dueDays: 45,
    paid: true,
    lines: [
      line(106, "Développement portail de suivi logistique", 1, 3_800_000),
      line(107, "Hébergement et maintenance (12 mois)", 12, 85_000),
    ],
  },
  {
    n: 5,
    type: "facture",
    clientId: "cli_konan",
    number: "FAC-2026-0004",
    issueDate: rel(-104),
    status: "payee",
    dueDays: 30,
    paid: true,
    lines: [
      line(108, "Identité visuelle — logo, charte, papeterie", 1, 1_200_000),
      line(109, "Déclinaison supports print", 1, 250_000),
    ],
  },
  {
    n: 6,
    type: "facture",
    clientId: "cli_yiriwa",
    number: "FAC-2026-0005",
    issueDate: rel(-92),
    status: "payee",
    dueDays: 30,
    paid: true,
    lines: [
      line(110, "Développement MVP application mobile", 1, 2_250_000),
      line(111, "Formation équipe (2 jours)", 2, 175_000),
    ],
  },
  {
    n: 7,
    type: "devis",
    clientId: "cli_logistics",
    number: "DEV-2026-0002",
    issueDate: rel(-84),
    status: "accepte",
    lines: [
      line(112, "Module de facturation automatisée", 1, 2_400_000),
      line(113, "Reprise des données historiques", 1, 450_000),
    ],
  },
  {
    n: 8,
    type: "facture",
    clientId: "cli_logistics",
    number: "FAC-2026-0006",
    issueDate: rel(-73),
    status: "payee",
    dueDays: 30,
    paid: true,
    lines: [
      line(114, "Module de facturation automatisée — lot 1", 1, 1_200_000),
      line(115, "Formation utilisateurs clés", 3, 150_000),
    ],
  },
  {
    n: 9,
    type: "facture",
    clientId: "cli_nova",
    number: "FAC-2026-0007",
    issueDate: rel(-58),
    status: "payee",
    dueDays: 30,
    paid: true,
    lines: [
      line(116, "Campagne SEA — août / septembre", 2, 375_000),
      line(117, "Création de 12 visuels publicitaires", 12, 45_000),
    ],
  },
  {
    n: 10,
    type: "devis",
    clientId: "cli_baobab",
    number: "DEV-2026-0003",
    issueDate: rel(-47),
    status: "envoye",
    lines: [
      line(118, "Refonte du site de réservation", 1, 1_850_000),
      line(119, "Intégration moteur de paiement", 1, 400_000),
    ],
  },
  {
    n: 11,
    type: "facture",
    clientId: "cli_baobab",
    number: "FAC-2026-0008",
    issueDate: rel(-44),
    status: "payee",
    dueDays: 30,
    paid: true,
    lines: [
      line(120, "Gestion des réseaux sociaux — trimestre", 3, 275_000),
      line(121, "Production de 9 reels", 9, 60_000),
    ],
  },
  {
    n: 12,
    type: "facture",
    clientId: "cli_logistics",
    number: "FAC-2026-0009",
    issueDate: rel(-31),
    status: "envoyee",
    dueDays: 30,
    lines: [
      line(122, "Module de facturation automatisée — lot 2", 1, 1_200_000),
      line(123, "Reprise des données historiques", 1, 450_000),
    ],
    notes: "Bon de commande n° BC-2026-0845.",
  },
  {
    n: 13,
    type: "facture",
    clientId: "cli_konan",
    number: "FAC-2026-0010",
    issueDate: rel(-25),
    status: "envoyee",
    dueDays: 30,
    lines: [
      line(124, "Refonte du site cabinet — développement", 1, 1_950_000),
      line(125, "Rédaction de 8 articles juridiques", 8, 75_000),
    ],
  },
  {
    n: 14,
    type: "facture",
    clientId: "cli_yiriwa",
    number: "FAC-2026-0011",
    issueDate: rel(-18),
    status: "payee",
    dueDays: 15,
    paid: true,
    lines: [
      line(126, "Maintenance applicative — septembre", 1, 350_000),
      line(127, "Support prioritaire", 1, 125_000),
    ],
  },
  {
    n: 15,
    type: "devis",
    clientId: "cli_nova",
    number: "DEV-2026-0004",
    issueDate: rel(-12),
    status: "accepte",
    lines: [
      line(128, "Application mobile e-commerce", 1, 4_500_000),
      line(129, "Maintenance annuelle", 12, 150_000),
    ],
  },
  {
    n: 16,
    type: "facture",
    clientId: "cli_nova",
    number: "FAC-2026-0012",
    issueDate: rel(-9),
    status: "envoyee",
    dueDays: 30,
    lines: [
      line(130, "Application mobile e-commerce — acompte 40 %", 1, 1_800_000),
      line(131, "Atelier de cadrage produit", 1, 300_000),
    ],
  },
  {
    n: 17,
    type: "facture",
    clientId: "cli_baobab",
    number: "FAC-2026-0013",
    issueDate: rel(-6),
    status: "envoyee",
    dueDays: 30,
    lines: [
      line(132, "Gestion des réseaux sociaux — octobre", 1, 275_000),
      line(133, "Publicité sponsorisée (budget géré)", 1, 180_000),
    ],
  },
  {
    n: 18,
    type: "devis",
    clientId: "cli_yiriwa",
    number: "DEV-2026-0005",
    issueDate: rel(-4),
    status: "refuse",
    lines: [line(134, "Audit technique et plan de scalabilité", 1, 950_000)],
  },
  {
    n: 19,
    type: "facture",
    clientId: "cli_konan",
    number: "FAC-2026-0014",
    issueDate: rel(-2),
    status: "brouillon",
    dueDays: 30,
    lines: [
      line(135, "Maintenance du site — octobre", 1, 180_000),
      line(136, "Mises à jour de sécurité", 1, 75_000),
    ],
  },
  {
    n: 20,
    type: "facture",
    clientId: "cli_logistics",
    number: "FAC-2026-0015",
    issueDate: rel(-1),
    status: "envoyee",
    dueDays: 30,
    lines: [
      line(137, "Module de facturation automatisée — lot 3", 1, 1_200_000),
      line(138, "Assistance au déploiement", 2, 125_000),
    ],
  },
];

export function makeSeed(): Database {
  const documents: Document[] = specs.map((s) => {
    const dueDate = addDays(s.issueDate, s.dueDays ?? 30);
    return {
      id: `doc_${s.n}`,
      type: s.type,
      number: s.number.replace("2026", BASE.slice(0, 4)),
      clientId: s.clientId,
      issueDate: s.issueDate,
      dueDate,
      validUntil: s.type === "devis" ? addDays(s.issueDate, 15) : undefined,
      lines: s.lines,
      notes: s.notes ?? "",
      status: s.status,
      createdAt: s.issueDate,
      paidAt: s.paid ? addDays(s.issueDate, Math.max(2, Math.round((s.dueDays ?? 30) / 2))) : null,
    };
  });

  return {
    clients: clients.map((c) => ({ ...c })),
    documents,
    settings: { ...DEFAULT_SETTINGS, company: { ...DEFAULT_SETTINGS.company } },
  };
}
