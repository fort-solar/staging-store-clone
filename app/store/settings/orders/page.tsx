import SettingsContent from "../SettingsContent";
import { requireCustomerSession } from "@/lib/auth/guards";

const page = async () => {
  await requireCustomerSession("/store/settings/orders");

  return (
    <SettingsContent page="orders" />
  )
}

export default page
