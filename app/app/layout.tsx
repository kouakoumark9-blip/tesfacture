import { AppBottomNav, AppHeader, AppSidebar } from "@/components/app-shell";
import { requireUser } from "@/lib/session";
import { PwaProvider } from "@/components/pwa";
import { getCompany } from "@/lib/actions/company";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const company = await getCompany(user.id);

  return (
    <div className="min-h-dvh bg-canvas">
      <AppHeader
        name={user.name}
        plan={user.plan}
        role={user.role}
        companyName={company?.name ?? null}
      />
      <div className="mx-auto flex max-w-5xl">
        <AppSidebar role={user.role} />
        <main className="min-w-0 flex-1 px-4 pb-24 pt-5 md:pb-10">{children}</main>
      </div>
      <AppBottomNav />
      <PwaProvider />
    </div>
  );
}
