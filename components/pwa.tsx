"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, Download, Loader2, WifiOff, X } from "lucide-react";
import { saveDocumentAction } from "@/lib/actions/documents";
import { clearQueue, getQueue, removeFromQueue } from "@/lib/offline-queue";
import type { DocumentInput } from "@/lib/validation";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Enregistre le service worker et affiche les états hors ligne / installation. */
export function PwaProvider() {
  const router = useRouter();
  const [offline, setOffline] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* l'application fonctionne sans service worker */
      });
    }

    const updateOnline = () => setOffline(!navigator.onLine);
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);

    setQueueCount(getQueue().length);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
    };
  }, []);

  // Envoi automatique des brouillons créés hors connexion
  useEffect(() => {
    async function flush() {
      if (!navigator.onLine) return;
      const queue = getQueue();
      if (queue.length === 0) return;
      setSyncing(true);
      for (const item of queue) {
        const result = await saveDocumentAction(item.payload as DocumentInput);
        if (result.ok) removeFromQueue(item.id);
      }
      setSyncing(false);
      setQueueCount(getQueue().length);
      if (getQueue().length === 0) clearQueue();
      router.refresh();
    }

    window.addEventListener("online", flush);
    void flush();
    return () => window.removeEventListener("online", flush);
  }, [router]);

  return (
    <>
      {offline && (
        <div className="fixed inset-x-0 top-0 z-50 bg-slate-900 px-3 py-2 text-center text-[12px] font-semibold text-white">
          <WifiOff className="mr-1 inline size-3.5" />
          Vous êtes hors connexion. Les documents créés seront envoyés au retour du réseau.
        </div>
      )}

      {syncing && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand-500 px-3.5 py-2 text-[12px] font-semibold text-white shadow-lg">
          <Loader2 className="mr-1 inline size-3.5 animate-spin" />
          Envoi de {queueCount} document(s)…
        </div>
      )}

      {installEvent && !dismissed && (
        <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md rounded-xl border border-brand-200 bg-white p-3 shadow-xl md:bottom-6">
          <div className="flex items-start gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Download className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold">Installer TesFacture</p>
              <p className="text-[11.5px] text-slate-500">
                Accès direct depuis l&apos;écran d&apos;accueil, même sans réseau.
              </p>
              <button
                onClick={async () => {
                  await installEvent.prompt();
                  const choice = await installEvent.userChoice;
                  if (choice.outcome === "accepted") setInstallEvent(null);
                  setDismissed(true);
                }}
                className="btn mt-2 min-h-9 w-full bg-brand-500 px-3 text-[12.5px] text-white"
              >
                Installer l&apos;application
              </button>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-black/5"
              aria-label="Fermer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/** Petit indicateur « brouillon enregistré localement ». */
export function OfflineBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <p className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-amber-800">
      <CloudOff className="size-3.5" /> {count} brouillon(s) en attente d&apos;envoi
    </p>
  );
}
