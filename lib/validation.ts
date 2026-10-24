import { z } from "zod";

const lineSchema = z.object({
  description: z.string().trim().min(1, "Description requise.").max(300, "Description trop longue."),
  quantity: z.number().min(0, "Quantité invalide.").max(1_000_000, "Quantité trop grande."),
  unitPrice: z.number().min(0, "Prix invalide.").max(1_000_000_000, "Prix trop grand."),
});

export const documentInputSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["FAC", "DEV", "BL"]),
  client: z.object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1, "Indiquez le nom du client.").max(120, "Nom trop long."),
    phone: z.string().trim().max(30, "Numéro trop long.").optional().or(z.literal("")),
    email: z
      .string()
      .trim()
      .email("Adresse e-mail invalide.")
      .optional()
      .or(z.literal("")),
    address: z.string().trim().max(300, "Adresse trop longue.").optional().or(z.literal("")),
  }),
  lines: z.array(lineSchema).min(1, "Ajoutez au moins une ligne.").max(60, "Trop de lignes."),
  discountPercent: z.number().min(0, "Remise invalide.").max(100, "Remise maximale : 100 %."),
  vatPercent: z.union([z.literal(0), z.literal(18)]),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Échéance invalide.").optional().or(z.literal("")),
  note: z.string().trim().max(600, "Note trop longue.").optional().or(z.literal("")),
  paymentMethods: z.array(z.string()).max(10).default([]),
  paymentNumbers: z
    .object({
      wave: z.string().trim().max(30).optional().or(z.literal("")),
      orange: z.string().trim().max(30).optional().or(z.literal("")),
      mtn: z.string().trim().max(30).optional().or(z.literal("")),
      moov: z.string().trim().max(30).optional().or(z.literal("")),
    })
    .optional(),
  deliveryAddress: z.string().trim().max(300).optional().or(z.literal("")),
  deliveredBy: z.string().trim().max(120).optional().or(z.literal("")),
  installmentCount: z.number().int().min(1).max(6),
  deposit: z.number().min(0).max(1_000_000_000).optional(),
  installments: z
    .array(
      z.object({
        position: z.number().int().min(0),
        label: z.string().trim().min(1).max(40),
        amount: z.number().min(0).max(1_000_000_000),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
      })
    )
    .optional(),
});


export type DocumentInput = z.infer<typeof documentInputSchema>;
