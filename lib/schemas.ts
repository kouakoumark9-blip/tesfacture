import { z } from "zod";

const phoneRegex = /^(\+?225|00225)?\s?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}$/;

export const phoneSchema = z
  .string()
  .trim()
  .min(8, "Saisissez votre numéro de téléphone.")
  .refine((value) => phoneRegex.test(value.replace(/\s+/g, " ")), {
    message: "Numéro invalide. Exemple : 07 00 00 00 00.",
  });

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom (2 caractères minimum)."),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .email("Adresse e-mail invalide.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères.")
    .max(100, "Mot de passe trop long."),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Saisissez votre mot de passe."),
});

export const phoneNumberSchema = z
  .string()
  .trim()
  .max(30, "Numéro trop long.")
  .optional()
  .or(z.literal(""));

export const companySchema = z.object({
  name: z.string().trim().min(1, "Indiquez le nom de votre entreprise."),
  logo: z
    .string()
    .max(400_000, "Logo trop volumineux.")
    .optional()
    .or(z.literal("")),
  rccm: z.string().trim().max(60, "RCCM trop long.").optional().or(z.literal("")),
  taxNumber: z
    .string()
    .trim()
    .max(60, "Compte contribuable trop long.")
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(200, "Adresse trop longue.").optional().or(z.literal("")),
  phone: phoneNumberSchema,
  paymentNumbers: z
    .object({
      wave: phoneNumberSchema,
      orange: phoneNumberSchema,
      mtn: phoneNumberSchema,
      moov: phoneNumberSchema,
    })
    .optional(),
  defaultNote: z
    .string()
    .trim()
    .max(600, "La note ne doit pas dépasser 600 caractères.")
    .optional()
    .or(z.literal("")),
});

export type CompanyInput = z.infer<typeof companySchema>;
