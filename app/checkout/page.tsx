import CheckoutPage from "@/components/features/pages/checkout/CheckoutPage";
import { requireCustomerSession } from "@/lib/auth/guards";

export default async function CheckoutRoutePage() {
  await requireCustomerSession("/checkout");
  return <CheckoutPage />;
}
