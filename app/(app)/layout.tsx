import Sidebar from "@/components/Sidebar";
import { getSettings, listDocuments } from "@/lib/store";
import { isOverdue } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  const docs = listDocuments();
  const pending = docs.filter((d) => d.type === "facture" && isOverdue(d)).length;

  return (
    <div className="min-h-screen">
      <Sidebar
        companyName={settings.company.name}
        companyCity={settings.company.city}
        pendingCount={pending}
      />
      <main className="lg:pl-[264px] print:pl-0">
        <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 print:max-w-none print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
}
