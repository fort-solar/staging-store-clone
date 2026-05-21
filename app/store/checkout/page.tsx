import CheckoutPage from "@/app/(dashboard_pages)/dashboard/checkout/page";
import { requireCustomerSession } from "@/lib/auth/guards";

export default async function StoreCheckoutPage() {
  await requireCustomerSession("/store/checkout");
  return <CheckoutPage />;
}
