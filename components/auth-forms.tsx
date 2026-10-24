"use client";

import { useActionState } from "react";
import { Eye, EyeOff, Lock, Phone, User } from "lucide-react";
import { useState } from "react";
import { loginAction, registerAction, type FormState } from "@/lib/actions/auth";
import { Alert, FieldError, SubmitButton } from "./ui";

const initial: FormState = { ok: false };

function PasswordField({
  name,
  autoComplete,
  error,
}: {
  name: string;
  autoComplete: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="label" htmlFor={name}>
        Mot de passe
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={6}
          placeholder="Au moins 6 caractères"
          className="field pl-10 pr-11"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-black/5"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <div id={`${name}-error`}>
        <FieldError>{error}</FieldError>
      </div>
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}
      {next && <input type="hidden" name="suivant" value={next} />}

      <div>
        <label className="label" htmlFor="phone">
          Numéro de téléphone
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="07 00 00 00 00"
            className="field pl-10"
            aria-invalid={Boolean(state.fieldErrors?.phone)}
            aria-describedby={state.fieldErrors?.phone ? "phone-error" : undefined}
          />
        </div>
        <div id="phone-error">
          <FieldError>{state.fieldErrors?.phone}</FieldError>
        </div>
      </div>

      <PasswordField
        name="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
      />

      <SubmitButton pending={pending} className="w-full">
        Se connecter
      </SubmitButton>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);

  return (
    <form action={action} className="space-y-4">
      {state.error && <Alert>{state.error}</Alert>}

      <div>
        <label className="label" htmlFor="name">
          Nom complet
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            placeholder="Awa Traoré"
            className="field pl-10"
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
        </div>
        <FieldError>{state.fieldErrors?.name}</FieldError>
      </div>

      <div>
        <label className="label" htmlFor="phone">
          Numéro de téléphone
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="07 00 00 00 00"
            className="field pl-10"
            aria-invalid={Boolean(state.fieldErrors?.phone)}
          />
        </div>
        <FieldError>{state.fieldErrors?.phone}</FieldError>
      </div>

      <div>
        <label className="label" htmlFor="email">
          E-mail <span className="font-normal text-slate-400">(facultatif)</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.ci"
          className="field"
          aria-invalid={Boolean(state.fieldErrors?.email)}
        />
        <FieldError>{state.fieldErrors?.email}</FieldError>
      </div>

      <PasswordField name="password" autoComplete="new-password" error={state.fieldErrors?.password} />

      <SubmitButton pending={pending} className="w-full">
        Créer mon compte
      </SubmitButton>

      <p className="text-center text-[11.5px] leading-relaxed text-slate-500">
        En créant un compte, vous acceptez que vos documents restent privés et accessibles
        uniquement depuis votre compte.
      </p>
    </form>
  );
}
