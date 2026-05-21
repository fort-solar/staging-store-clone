"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import GetQuoteModal from "@/components/features/pages/product/GetQuoteModal";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { useCustomerLoginGate } from "@/hooks/use-customer-login-gate";
import {
  clearCustomerCart,
  createCustomerOrder,
  initializeCustomerOrderPayment,
  verifyCustomerPayment,
} from "@/lib/customer";
import { sessionSnapshotToMockUser } from "@/lib/localAuth";
import { useStoreCatalog } from "@/lib/store-catalog";
import { useGeneralStore } from "@/store/GeneralStore";
import type { CatalogId } from "@/types/common.types";

type QuoteProduct = {
  id: CatalogId;
  title: string;
  image: string;
  price: number;
  quantity?: number;
};

type AddressFormState = {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
};

type CheckoutItem = {
  id: string;
  itemType: "product" | "package";
  quantity: number;
  title: string;
  price: number;
  image: string;
  sourceType: string;
  sourceId: string;
};

const formatNaira = (value: number) =>
  `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const EMPTY_ADDRESS: AddressFormState = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  country: "Nigeria",
};

function getOrderId(value: Record<string, unknown>) {
  const candidates = [
    value.id,
    value.orderId,
    typeof value.order === "object" && value.order !== null
      ? (value.order as Record<string, unknown>).id
      : null,
  ];

  return candidates.find((item): item is string => typeof item === "string" && item.length > 0) ?? null;
}

const CheckoutPage = () => {
  const router = useRouter();
  const { session } = useAuth();
  const { isRefreshing, requireCustomerLogin } = useCustomerLoginGate();
  const currentUser = useMemo(() => sessionSnapshotToMockUser(session), [session]);
  const { products, packages } = useStoreCatalog();
  const [query, setQuery] = useState("");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isPaystackReady, setIsPaystackReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);
  const [requestFinancing, setRequestFinancing] = useState(false);
  const [notes, setNotes] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<{
    tone: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const cartItems = useGeneralStore((state) => state.cartItems);
  const replaceCart = useGeneralStore((state) => state.replaceCart);

  const [shippingAddress, setShippingAddress] = useState<AddressFormState>(EMPTY_ADDRESS);
  const [billingAddress, setBillingAddress] = useState<AddressFormState>(EMPTY_ADDRESS);

  useEffect(() => {
    if (!session && !isRefreshing) {
      requireCustomerLogin({ redirectTo: "/store/checkout" });
    }
  }, [isRefreshing, requireCustomerLogin, session]);

  useEffect(() => {
    const fullName = currentUser?.fullName ?? "";
    const email = currentUser?.email ?? "";
    const phone = currentUser?.phone ?? "";
    const addressLine1 = currentUser?.address ?? "";

    setShippingAddress({
      fullName,
      email,
      phone,
      addressLine1,
      city: "",
      state: "",
      country: "Nigeria",
    });
    setBillingAddress({
      fullName,
      email,
      phone,
      addressLine1,
      city: "",
      state: "",
      country: "Nigeria",
    });
  }, [currentUser?.address, currentUser?.email, currentUser?.fullName, currentUser?.phone]);

  const cartDetails = useMemo(() => {
    return cartItems
      .map((item) => {
        const product =
          item.itemType === "product"
            ? products.find((candidate) => String(candidate.id) === String(item.id))
            : packages.find((candidate) => String(candidate.id) === String(item.id));

        if (!product) {
          return null;
        }

        return {
          id: String(item.id),
          itemType: item.itemType,
          quantity: item.quantity,
          title: product.title,
          price: product.price,
          image: product.image,
          sourceType: product.sourceType,
          sourceId: product.sourceId,
        } satisfies CheckoutItem;
      })
      .filter(Boolean) as CheckoutItem[];
  }, [cartItems, packages, products]);

  const missingCartItems = cartItems.length - cartDetails.length;

  const subtotal = useMemo(
    () => cartDetails.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartDetails],
  );
  const shippingAmount = 0;
  const taxAmount = 0;
  const discountAmount = 0;
  const total = subtotal + shippingAmount + taxAmount - discountAmount;

  const quoteProducts = useMemo(() => {
    return cartDetails
      .filter((item) => item.itemType === "product")
      .map((item) => ({
        id: item.id,
        title: item.title,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      })) satisfies QuoteProduct[];
  }, [cartDetails]);

  const primaryBundle = useMemo(
    () => cartDetails.find((item) => item.itemType === "package" && item.sourceType === "bundle") ?? null,
    [cartDetails],
  );

  const isCheckoutDisabled =
    isSubmitting ||
    isVerifyingPayment ||
    cartDetails.length === 0 ||
    missingCartItems > 0 ||
    !shippingAddress.fullName.trim() ||
    !shippingAddress.email.trim() ||
    !shippingAddress.phone.trim() ||
    !shippingAddress.addressLine1.trim();

  async function handlePaymentVerification(reference: string) {
    setIsVerifyingPayment(true);
    setCheckoutStatus({
      tone: "info",
      message: "Verifying your payment...",
    });

    try {
      await verifyCustomerPayment({ reference });
      await clearCustomerCart().catch(() => null);
      replaceCart([], { pending: false });
      setCheckoutStatus({
        tone: "success",
        message: "Payment verified successfully. Your order is now awaiting approval.",
      });
      router.push("/store/settings/orders");
      router.refresh();
    } catch (error) {
      setCheckoutStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to verify your payment.",
      });
    } finally {
      setIsVerifyingPayment(false);
    }
  }

  async function handleCheckout() {
    if (isCheckoutDisabled) {
      return;
    }

    setIsSubmitting(true);
    setCheckoutStatus(null);

    try {
      const resolvedBillingAddress = useShippingAsBilling ? shippingAddress : billingAddress;
      const orderPayload = {
        items: cartDetails.map((item) => ({
          item_type: item.itemType,
          item_id: item.id,
          name: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          metadata: {
            sourceType: item.sourceType,
            sourceId: item.sourceId,
          },
        })),
        shipping_address: shippingAddress,
        billing_address: resolvedBillingAddress,
        notes: notes.trim() || undefined,
        subtotal,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: total,
        currency: "NGN",
        create_bundle_request: primaryBundle
          ? {
              bundle_id: primaryBundle.sourceId,
              financing_requested: requestFinancing,
            }
          : undefined,
      };

      const orderPayloadResponse = await createCustomerOrder(orderPayload);
      const orderId = getOrderId(orderPayloadResponse.data);

      if (!orderId) {
        throw new Error("The order was created, but the order id is missing from the response.");
      }

      const paymentPayload = await initializeCustomerOrderPayment(orderId);
      const { accessCode, amountKobo, authorizationUrl, publicKey, reference } =
        paymentPayload.data;

      if (window.PaystackPop?.setup) {
        const handler = window.PaystackPop.setup({
          key: publicKey,
          email: shippingAddress.email,
          amount: amountKobo,
          ref: reference,
          access_code: accessCode,
          currency: "NGN",
          callback: (response: { reference: string }) => {
            void handlePaymentVerification(response.reference);
          },
          onClose: () => {
            setCheckoutStatus({
              tone: "info",
              message: "Payment window closed before completion.",
            });
          },
        });

        handler.openIframe();
        setCheckoutStatus({
          tone: "info",
          message: "Order created. Complete the payment in the Paystack popup.",
        });
      } else {
        setCheckoutStatus({
          tone: "info",
          message: "Redirecting to Paystack to complete your payment.",
        });
        window.location.assign(authorizationUrl);
      }
    } catch (error) {
      setCheckoutStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to start checkout.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderAddressForm = (
    value: AddressFormState,
    onChange: (field: keyof AddressFormState, nextValue: string) => void,
  ) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Input
        value={value.fullName}
        onChange={(event) => onChange("fullName", event.target.value)}
        placeholder="Full name"
        className="h-11 rounded-xl"
      />
      <Input
        value={value.email}
        onChange={(event) => onChange("email", event.target.value)}
        placeholder="Email address"
        className="h-11 rounded-xl"
      />
      <Input
        value={value.phone}
        onChange={(event) => onChange("phone", event.target.value)}
        placeholder="Phone number"
        className="h-11 rounded-xl"
      />
      <Input
        value={value.city}
        onChange={(event) => onChange("city", event.target.value)}
        placeholder="City"
        className="h-11 rounded-xl"
      />
      <Input
        value={value.state}
        onChange={(event) => onChange("state", event.target.value)}
        placeholder="State"
        className="h-11 rounded-xl"
      />
      <Input
        value={value.country}
        onChange={(event) => onChange("country", event.target.value)}
        placeholder="Country"
        className="h-11 rounded-xl"
      />
      <Input
        value={value.addressLine1}
        onChange={(event) => onChange("addressLine1", event.target.value)}
        placeholder="Street address"
        className="h-11 rounded-xl md:col-span-2"
      />
    </div>
  );

  if (!session && !isRefreshing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-24">
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
        onLoad={() => setIsPaystackReady(true)}
      />
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="text-sm text-[#5A646B]">Store / Checkout</div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {checkoutStatus ? (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  checkoutStatus.tone === "success"
                    ? "bg-[#EAF7E8] text-[#168416]"
                    : checkoutStatus.tone === "error"
                      ? "bg-[#FDECEC] text-[#C73939]"
                      : "bg-[#EEF5FF] text-[#1D4ED8]"
                }`}
              >
                {checkoutStatus.message}
              </div>
            ) : null}

            {missingCartItems > 0 ? (
              <div className="rounded-2xl border border-[#F7D8D8] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
                Some cart items could not be resolved from the live catalog. Refresh the catalog or remove the missing items before checkout.
              </div>
            ) : null}

            {!isPaystackReady ? (
              <div className="rounded-2xl border border-[#E9EEF0] bg-[#FAFAFA] px-4 py-3 text-sm text-[#5A646B]">
                Loading Paystack checkout...
              </div>
            ) : null}

            <section className="rounded-2xl border border-[#E9EEF0] p-5">
              <h1 className="text-2xl font-semibold text-[#252C32]">Shipping Address</h1>
              <p className="mt-1 text-sm text-[#5A646B]">
                Use a valid delivery address and contact details for order updates.
              </p>
              <div className="mt-5">
                {renderAddressForm(shippingAddress, (field, value) =>
                  setShippingAddress((current) => ({ ...current, [field]: value })),
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#E9EEF0] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[#252C32]">Billing Address</h2>
                  <p className="mt-1 text-sm text-[#5A646B]">
                    Match this to the cardholder or company billing details.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-[#252C32]">
                  <input
                    type="checkbox"
                    checked={useShippingAsBilling}
                    onChange={(event) => setUseShippingAsBilling(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Same as shipping
                </label>
              </div>

              {!useShippingAsBilling ? (
                <div className="mt-5">
                  {renderAddressForm(billingAddress, (field, value) =>
                    setBillingAddress((current) => ({ ...current, [field]: value })),
                  )}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[#E9EEF0] p-5">
              <h2 className="text-xl font-semibold text-[#252C32]">Order Notes</h2>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add delivery notes or payment context for this order."
                className="mt-4 min-h-28 w-full rounded-2xl border border-[#E4E9EC] px-4 py-3 text-sm outline-none"
              />

              {primaryBundle ? (
                <label className="mt-4 flex items-center gap-2 text-sm text-[#252C32]">
                  <input
                    type="checkbox"
                    checked={requestFinancing}
                    onChange={(event) => setRequestFinancing(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Request financing for this bundle order
                </label>
              ) : null}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#E9EEF0] p-4">
              <p className="font-semibold text-[#252C32]">Order Summary</p>
              <div className="mt-4 space-y-4">
                {cartDetails.map((item) => (
                  <div key={`${item.itemType}-${item.id}`} className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-xl bg-cover bg-center bg-no-repeat bg-[#D9D9D9]"
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                    <div className="flex-1 text-sm">
                      <p className="text-[#252C32]">{item.title}</p>
                      <p className="font-semibold text-[#252C32]">
                        {formatNaira(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#252C32]">
                      {formatNaira(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 border-t border-[#E9EEF0] pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Sub Total</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Shipping</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(shippingAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Tax</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(taxAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Discount</span>
                  <span className="font-semibold text-[#252C32]">
                    -{formatNaira(discountAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#E9EEF0] pt-3">
                  <span className="font-semibold text-[#252C32]">Total</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(total)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isCheckoutDisabled}
                className="mt-5 w-full rounded-xl bg-[#1FA21B] py-3 text-center font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Starting payment..."
                  : isVerifyingPayment
                    ? "Verifying payment..."
                    : "Pay with Paystack"}
              </button>
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(true)}
                disabled={quoteProducts.length === 0}
                className="mt-2 block w-full rounded-xl border border-[#B0BABF] py-3 text-center font-semibold text-[#252C32] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Get Quote
              </button>

              <div className="mt-8 text-sm text-[#5A646B]">
                <p className="mb-2">Good to know</p>
                <p className="font-semibold text-[#252C32]">
                  Packages remain available during checkout
                </p>
                <p className="mt-2">
                  Need a full installation-ready setup instead of individual components?{" "}
                  <Link
                    href="/store/packages"
                    className="inline-flex items-center gap-1 font-medium text-[#252C32] underline"
                  >
                    Browse packages
                    <span>↗</span>
                  </Link>
                  .
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isQuoteModalOpen && quoteProducts.length > 0 ? (
        <GetQuoteModal
          open={isQuoteModalOpen}
          products={quoteProducts}
          onClose={() => setIsQuoteModalOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default CheckoutPage;
