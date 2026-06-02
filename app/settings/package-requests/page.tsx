import SettingsContent from "@/app/store/settings/SettingsContent";
import { requireCustomerSession } from "@/lib/auth/guards";

export default async function SettingsPackageRequestsPage() {
  await requireCustomerSession("/settings/package-requests");
  return <SettingsContent page="package_requests" />;
}
