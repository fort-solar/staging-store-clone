"use client";

import React, { useMemo, useState } from "react";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { useGeneralStore } from "@/store/GeneralStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeliveryIcon } from "@/components/features/icons/DeliveryIcon";
import { TrashIcon } from "@/components/features/icons/TrashIcon";
import GetQuoteModal from "@/components/features/pages/product/GetQuoteModal";
import { useCustomerLoginGate } from "@/hooks/use-customer-login-gate";
import {
  useStorePackagesByIds,
  useStoreProductsByIds,
} from "@/lib/store-catalog";
import { clampCartQuantity, getProductCartMaxQuantity } from "@/lib/cart";
import { validateCustomerCoupon } from "@/lib/customer";

const formatNaira = (value: number) =>
  `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const CartPage = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const cartItems = useGeneralStore((state) => state.cartItems);
  const updateCartQuantity = useGeneralStore((state) => state.updateCartQuantity);
  const removeFromCart = useGeneralStore((state) => state.removeFromCart);
  const { requireCustomerLogin } = useCustomerLoginGate();
  const productIds = useMemo(
    () => cartItems.filter((item) => item.itemType === "product").map((item) => item.id),
    [cartItems],
  );
  const packageIds = useMemo(
    () => cartItems.filter((item) => item.itemType === "package").map((item) => item.id),
    [cartItems],
  );
  const { items: products } = useStoreProductsByIds(productIds);
  const { items: packages } = useStorePackagesByIds(packageIds);
  const productMap = useMemo(
    () => new Map(products.map((item) => [String(item.id), item])),
    [products],
  );
  const packageMap = useMemo(
    () => new Map(packages.map((item) => [String(item.id), item])),
    [packages],
  );

  const cartDetails = useMemo(() => {
    return cartItems
      .map((item) => {
        const product =
          item.itemType === "product"
            ? productMap.get(String(item.id))
            : packageMap.get(String(item.id));
        if (!product) return null;
        return {
          ...item,
          title: product.title,
          price: product.price,
          image: product.image,
          stockQuantity:
            item.itemType === "product" ? getProductCartMaxQuantity(productMap.get(String(item.id))) : null,
          eligibleForInstallation: item.itemType === "product" ? (product as any).eligibleForInstallation : false,
          freeDelivery: (product as any).freeDelivery ?? false,
          eligibleForWaybill: (product as any).eligibleForWaybill ?? true,
          weightTier: (product as any).weightTier ?? "under_5kg",
        };
      })
      .filter(Boolean) as Array<{
        id: string | number;
        itemType: "product" | "package";
        quantity: number;
        title: string;
        price: number;
        image: string | { src: string };
        stockQuantity: number | null;
        eligibleForInstallation?: boolean;
        freeDelivery?: boolean;
        eligibleForWaybill?: boolean;
        weightTier?: string;
      }>;
  }, [cartItems, packageMap, productMap]);

  const [requestInstallation, setRequestInstallation] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_amount: number;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    description: string | null;
  } | null>(null);

  React.useEffect(() => {
    try {
      const savedCoupon = localStorage.getItem("fortsolar:applied_coupon");
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const hasEligibleProduct = useMemo(() => {
    return cartDetails.some((item) => item.itemType === "product" && item.eligibleForInstallation);
  }, [cartDetails]);

  const hasPackage = useMemo(() => {
    return cartDetails.some((item) => item.itemType === "package");
  }, [cartDetails]);

  const hasWarehouseOnlyProduct = useMemo(() => {
    return cartDetails.some((item) => item.itemType === "product" && item.eligibleForWaybill === false);
  }, [cartDetails]);

  const isAllFreeDelivery = useMemo(() => {
    return cartDetails.length > 0 && cartDetails.every((item) => item.freeDelivery || item.itemType === "package");
  }, [cartDetails]);

  const maxWeightSurcharge = useMemo(() => {
    const TIER_SURCHARGES: Record<string, number> = {
      under_5kg: 0,
      "5_15kg": 4000,
      "15_30kg": 9000,
      over_30kg: 18000,
    };
    let max = 0;
    for (const item of cartDetails) {
      if (item.itemType === "product") {
        const surcharge = TIER_SURCHARGES[item.weightTier || "under_5kg"] ?? 0;
        if (surcharge > max) max = surcharge;
      }
    }
    return max;
  }, [cartDetails]);

  const subtotal = cartDetails.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItems = cartDetails.reduce((sum, item) => sum + item.quantity, 0);

  const shipping = useMemo(() => {
    if (cartDetails.length === 0 || subtotal === 0) return 0;
    if (hasPackage) return 0; // Complete solar packages include free nationwide delivery
    if (subtotal >= 1500000) return 0; // Free delivery threshold (₦1,500,000)
    if (isAllFreeDelivery) return 0; // Free delivery promotions
    return 16000 + maxWeightSurcharge; // Universal base fee (₦16,000) + weight tier surcharge
  }, [cartDetails.length, subtotal, hasPackage, isAllFreeDelivery, maxWeightSurcharge]);

  const tax = 0;

  const discountAmount = useMemo(() => {
    return cartDetails.reduce((sum, item) => {
      if (item.itemType === "package") {
        const pkg = packageMap.get(String(item.id));
        const pct = pkg?.discountPercentage ?? 0;
        return sum + (item.price * (pct / 100)) * item.quantity;
      }
      return sum;
    }, 0);
  }, [cartDetails, packageMap]);

  const installationFee = useMemo(() => {
    if (hasPackage || cartDetails.length === 0 || subtotal === 0) return 0;
    return requestInstallation ? 150000 : 0;
  }, [hasPackage, requestInstallation, cartDetails.length, subtotal]);

  const couponDiscount = appliedCoupon?.discount_amount ?? 0;
  const total = Math.max(0, subtotal + shipping + installationFee - discountAmount - couponDiscount);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await validateCustomerCoupon({
        code: couponInput.trim().toUpperCase(),
        order_amount: subtotal,
        product_ids: cartDetails.map((it) => String(it.id)),
      });
      if (res.success && res.data.valid && res.data.coupon) {
        const couponData = {
          code: res.data.coupon.code,
          discount_amount: res.data.discount_amount,
          discount_type: res.data.coupon.discount_type,
          discount_value: res.data.coupon.discount_value,
          description: res.data.coupon.description,
        };
        setAppliedCoupon(couponData);
        localStorage.setItem("fortsolar:applied_coupon", JSON.stringify(couponData));
        setCouponInput("");
      } else {
        setCouponError(res.data?.message || "Invalid or expired discount coupon.");
      }
    } catch (err: any) {
      setCouponError(err.message || "Failed to validate coupon code.");
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
    localStorage.removeItem("fortsolar:applied_coupon");
  }

  React.useEffect(() => {
    const localDraft = localStorage.getItem("fortsolar:checkout_draft");
    let draft = {};
    if (localDraft) {
      try {
        draft = JSON.parse(localDraft);
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.setItem(
      "fortsolar:checkout_draft",
      JSON.stringify({
        ...draft,
        requestInstallation: hasPackage ? true : requestInstallation,
      })
    );
  }, [hasPackage, requestInstallation]);

  const quoteProducts = useMemo(() => {
    return cartDetails
      .filter((item) => item.itemType === "product")
      .map((item) => ({
      id: item.id,
      title: item.title,
      image: typeof item.image === "string" ? item.image : item.image.src,
      price: item.price,
      quantity: item.quantity,
    }));
  }, [cartDetails]);

  return (
    <div className="min-h-screen bg-white py-24">
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-28 lg:py-2">
        <div className="text-sm text-[#5A646B]">Home / Cart</div>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-[#252C32]">
                Your Cart
              </h1>
              <span className="text-sm text-[#5A646B]">
                {totalItems} Items in cart
              </span>
            </div>
            <div className="mt-4 border-t border-[#E9EEF0]">
              {cartDetails.map((item) => (
                <div
                  key={`${item.itemType}-${item.id}`}
                  className="grid grid-cols-[72px_1fr] gap-4 py-5 border-b px-3 border-[#E9EEF0]"
                >
                  <div className="h-16 w-16 rounded-xl bg-[#D9D9D9] bg-[url('/double_solar_panels.png')] bg-contain bg-center bg-no-repeat" />

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
                    <div className="flex lg:flex-col items-center lg:items-start justify-between lg:justify-start gap-5 lg:gap-1">
                      <p className="font-semibold text-[#252C32] truncate">{item.title}</p>
                      <div className="mt-2">
                        <input
                          type="number"
                          min={1}
                          max={item.stockQuantity ?? undefined}
                          value={item.quantity}
                          onChange={(event) =>
                            updateCartQuantity({
                              id: item.id,
                              itemType: item.itemType,
                              quantity: clampCartQuantity(
                                Number(event.target.value),
                                item.stockQuantity,
                              ),
                            })
                          }
                          className="h-8 w-20 rounded-md border border-[#E4E9EC] px-2 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-start  justify-between gap-4 lg:justify-start">
                      <div className="text-right font-semibold text-[#252C32] whitespace-nowrap">
                        {formatNaira(item.price * item.quantity)}
                      </div>

                      <button
                        onClick={() => removeFromCart({ id: item.id, itemType: item.itemType })}
                        className="text-[#7B8790] hover:text-[#E11D48]"
                        aria-label="Remove item"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>


                </div>

              ))}
            </div>

            <div className={`mt-6 flex flex-col lg:flex-row items-center lg:justify-between rounded-xl border px-4 py-2 text-xs font-semibold ${shipping === 0 ? "border-[#048A0580] bg-[#EBFAEB] text-[#048A05]" : "border-[#0284c780] bg-[#f0f9ff] text-[#0284c7]"}`}>
              <div className="flex items-center gap-2">
                <DeliveryIcon className="w-5 h-5" />
                <span>
                  {shipping === 0
                    ? (hasPackage
                        ? "Free Nationwide Delivery Included (Packages)"
                        : subtotal >= 1500000
                        ? "Free Delivery Threshold Met (Orders ≥ ₦1,500,000)"
                        : "Free Delivery Promotional Coverage")
                    : hasWarehouseOnlyProduct
                    ? "Regional Warehouse Pickup Only (One or more items ineligible for waybill)"
                    : "Park-to-Park Waybill Across Nigeria (Motor Park Pickup)"}
                </span>
              </div>
              <span>{shipping === 0 ? "Free Nationwide Dispatch" : "(4-5 Working Days Waybill)"}</span>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-[#E9EEF0] p-4">
              <div className="rounded-xl shadow-sm bg-[#B8C0CC14] p-4">
                <div className="flex items-center justify-between border-b py-3">
                  <span className="text-sm text-[#5A646B]">Sub Total</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b py-3">
                  <span className="text-sm text-[#5A646B]">Shipping</span>
                  {shipping === 0 ? (
                    <span className="rounded-md bg-[#EBFAEB] px-2 py-0.5 text-xs text-[#048A05] font-semibold">
                      Free
                    </span>
                  ) : (
                    <span className="font-semibold text-[#252C32]">
                      {formatNaira(shipping)}
                    </span>
                  )}
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between border-b py-3 border-[#E9EEF0]">
                    <span className="text-sm text-[#5A646B]">Package Discount</span>
                    <span className="font-semibold text-red-600">
                      -{formatNaira(discountAmount)}
                    </span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex items-center justify-between border-b py-3 border-[#E9EEF0]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-[#048A05]">Coupon ({appliedCoupon.code})</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-500 hover:text-red-700 ml-1 font-bold"
                        title="Remove coupon"
                      >
                        ✕
                      </button>
                    </div>
                    <span className="font-semibold text-[#048A05]">
                      -{formatNaira(couponDiscount)}
                    </span>
                  </div>
                )}
                {hasPackage && (
                  <div className="flex items-center justify-between border-b py-3 border-[#E9EEF0]">
                    <span className="text-sm text-[#5A646B]">Professional Installation</span>
                    <span className="rounded-md bg-[#EBFAEB] px-2 py-0.5 text-xs text-[#048A05] font-semibold">
                      Free (Included)
                    </span>
                  </div>
                )}
                {!hasPackage && hasEligibleProduct && requestInstallation && (
                  <div className="flex items-center justify-between border-b py-3 border-[#E9EEF0]">
                    <span className="text-sm text-[#5A646B]">Installation Fee</span>
                    <span className="font-semibold text-[#252C32]">
                      {formatNaira(150000)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3">
                  <span className="font-semibold text-[#252C32]">Total</span>
                  <span className="font-semibold text-lg text-[#252C32]">
                    {formatNaira(total)}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#E9EEF0] bg-white p-3.5 shadow-sm">
                <label className="block text-xs font-semibold text-[#252C32] mb-1.5">
                  Have a Discount Coupon?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. FORTSOLAR10"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      if (couponError) setCouponError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleApplyCoupon();
                      }
                    }}
                    className="h-9 flex-1 rounded-lg border border-[#E4E9EC] px-3 text-xs uppercase font-semibold outline-none focus:border-[#1FA21B]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleApplyCoupon()}
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="h-9 rounded-lg bg-[#1FA21B] px-3 text-xs font-semibold text-white disabled:opacity-50 hover:bg-[#188015] transition"
                  >
                    {isValidatingCoupon ? "Checking..." : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-1.5 text-xs text-red-500 font-medium">⚠️ {couponError}</p>
                )}
                {appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-[#EBFAEB] px-2.5 py-1.5 text-xs text-[#048A05]">
                    <span className="font-semibold">✓ {appliedCoupon.code} applied (-{formatNaira(couponDiscount)})</span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700 font-bold ml-2 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {!hasPackage && hasEligibleProduct && (
                <div className="mt-4 rounded-xl border border-[#E9EEF0] bg-gray-50 p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requestInstallation}
                      onChange={(e) => setRequestInstallation(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#B0BABF] text-[#1FA21B]"
                    />
                    <div className="text-sm">
                      <p className="font-semibold text-[#252C32]">Request Custom Setup Quote</p>
                      <p className="text-[#5A646B] text-xs mt-0.5 font-normal">Would you like professional installation for these components? Flat rate: {formatNaira(150000)}.</p>
                    </div>
                  </label>
                </div>
              )}

              <div className="mt-5 space-y-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuoteModalOpen(true)}
                    disabled={quoteProducts.length === 0}
                    className="block w-full rounded-xl bg-[#1FA21B] py-3 text-center text-white font-semibold"
                  >
                    Get Quote
                  </button>
                  <Link
                    href="/products"
                    className="block w-full rounded-xl border border-[#B0BABF] py-3 text-center font-semibold text-[#252C32]"
                  >
                    Continue Shopping
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    requireCustomerLogin({
                      redirectTo: "/checkout",
                      onAuthenticated: () => router.push("/checkout"),
                    })
                  }
                  className="block w-full rounded-xl border border-[#B0BABF] py-3 text-center font-semibold text-[#252C32]"
                >
                  Checkout
                </button>
              </div>

              <div className="mt-20 text-sm text-[#5A646B]">
                <p className="mb-2">Good to know</p>
                <p className="font-semibold text-[#252C32]">
                  This Product Has a Package Package
                </p>
                <p className="mt-2">
                  Get this product as part of a complete solar setup that includes panels, batteries, and expert installation all optimized for performance and savings. Installation is completely free.  <Link
                    href="/packages"
                    className="inline-flex items-center gap-1 text-[#252C32] font-medium underline"
                  >
                    View the Package Package
                    <span>↗</span>
                  </Link> to see what’s included.
                </p>
              </div>
            </div>


          </aside>
        </div>
      </div>
      {isQuoteModalOpen && quoteProducts.length > 0 && (
        <GetQuoteModal
          open={isQuoteModalOpen}
          products={quoteProducts}
          onClose={() => setIsQuoteModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CartPage;
