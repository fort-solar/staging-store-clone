import { Suspense } from "react";
import OrderTrackingClient from "@/components/features/pages/orders/OrderTrackingClient";
import { requireCustomerSession } from "@/lib/auth/guards";

export default async function OrderTrackingRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireCustomerSession(`/orders/${id}`);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] pt-28 text-center text-sm text-gray-500">
          Loading order tracking...
        </div>
      }
    >
      <OrderTrackingClient orderId={id} />
    </Suspense>
  );
}
