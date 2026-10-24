"use client";

import type { DocumentInput } from "@/lib/validation";

const KEY = "factureci:queue";
const DRAFT_KEY = "factureci:draft";

export type QueuedDocument = {
  id: string;
  createdAt: string;
  payload: DocumentInput;
};

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota dépassé : on ignore */
  }
}

export function queueDocument(payload: DocumentInput) {
  const queue = read<QueuedDocument[]>(KEY) ?? [];
  queue.push({
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    payload,
  });
  write(KEY, queue);
  return queue.length;
}

export function getQueue(): QueuedDocument[] {
  return read<QueuedDocument[]>(KEY) ?? [];
}

export function clearQueue() {
  write(KEY, []);
}

export function removeFromQueue(id: string) {
  write(KEY, getQueue().filter((item) => item.id !== id));
}

/** Brouillon local du formulaire en cours (récupéré après une coupure). */
export function saveDraft(payload: unknown) {
  write(DRAFT_KEY, payload);
}

export function loadDraft<T>(): T | null {
  return read<T>(DRAFT_KEY);
}

export function clearDraft() {
  if (typeof window !== "undefined") window.localStorage.removeItem(DRAFT_KEY);
}
