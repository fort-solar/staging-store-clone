import SettingsContent from "../SettingsContent";
import { requireCustomerSession } from "@/lib/auth/guards";

const page = async () => {
  await requireCustomerSession("/store/settings/package-requests");

  return (
    <SettingsContent page="package_requests" />
  )
}

export default page
