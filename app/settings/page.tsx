import SettingsContent from "@/app/store/settings/SettingsContent";
import { requireCustomerSession } from "@/lib/auth/guards";

export default async function SettingsPage() {
  await requireCustomerSession("/settings/profile");
  return <SettingsContent page="profile" />;
}
