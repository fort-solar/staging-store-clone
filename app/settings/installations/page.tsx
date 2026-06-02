import SettingsContent from "@/app/store/settings/SettingsContent";
import { requireCustomerSession } from "@/lib/auth/guards";

export default async function SettingsInstallationsPage() {
  await requireCustomerSession("/settings/installations");
  return <SettingsContent page="installations" />;
}
