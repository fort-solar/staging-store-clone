import { Suspense } from "react";
import CheckoutPage from "@/components/features/pages/checkout/CheckoutPage";
import { requireCustomerSession } from "@/lib/auth/guards";

export default async function CheckoutRoutePage() {
  await requireCustomerSession("/checkout");
  return (
    <Suspense fallback={<div className="min-h-screen bg-white pt-24 text-center text-sm text-[#5A646B]">Loading checkout...</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
