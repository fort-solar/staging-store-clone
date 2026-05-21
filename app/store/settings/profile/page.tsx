import SettingsContent from "../SettingsContent";
import { requireCustomerSession } from "@/lib/auth/guards";

const page = async () => {
  await requireCustomerSession("/store/settings/profile");

  return (
    <SettingsContent page="profile" />
  )
}

export default page
