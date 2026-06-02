import SettingsContent from "@/app/store/settings/SettingsContent";
import { requireCustomerSession } from "@/lib/auth/guards";

export default async function SettingsOrdersPage() {
  await requireCustomerSession("/settings/orders");
  return <SettingsContent page="orders" />;
}
