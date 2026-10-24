import { getSettings } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import SettingsForm from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default function ParametresPage() {
  const settings = getSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paramètres"
        subtitle="Ces informations apparaissent sur vos factures, devis et exports PDF."
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
