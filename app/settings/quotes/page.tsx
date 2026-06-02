import SettingsContent from "@/app/store/settings/SettingsContent";
import { requireCustomerSession } from "@/lib/auth/guards";

export default async function SettingsQuotesPage() {
  await requireCustomerSession("/settings/quotes");
  return <SettingsContent page="quotes" />;
}
