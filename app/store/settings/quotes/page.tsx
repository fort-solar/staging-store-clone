import SettingsContent from "../SettingsContent";
import { requireCustomerSession } from "@/lib/auth/guards";

const page = async () => {
  await requireCustomerSession("/store/settings/quotes");

  return (
    <SettingsContent page="quotes" />
  )
}

export default page
