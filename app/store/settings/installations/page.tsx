import SettingsContent from "../SettingsContent";
import { requireCustomerSession } from "@/lib/auth/guards";

const page = async () => {
  await requireCustomerSession("/store/settings/installations");

  return (
    <SettingsContent page="installations" />
  )
}

export default page
