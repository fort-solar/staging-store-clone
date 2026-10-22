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
import {
  validateCustomerCoupon,
  getDraftOrder,
  saveDraftOrder,
  deleteDraftOrder,
} from "@/lib/customer";
import { useAuth } from "@/components/auth/auth-provider";

const formatNaira = (value: number) =>
  `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const CartPage = () => {
  const router = useRouter();
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const cartItems = useGeneralStore((state) => state.cartItems);
  const replaceCart = useGeneralStore((state) => state.replaceCart);
  const updateCartQuantity = useGeneralStore((state) => state.updateCartQuantity);
  const removeFromCart = useGeneralStore((state) => state.removeFromCart);
  const { requireCustomerLogin } = useCustomerLoginGate();

  const [packageDraft, setPackageDraft] = useState<{
    packageId: string | number;
    packageTitle: string;
    price?: number;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    let localDraft: any = null;
    try {
      const raw = localStorage.getItem("fortsolar:active_package_order");
      if (raw) {
        localDraft = JSON.parse(raw);
        setPackageDraft(localDraft);
      }
    } catch (e) {
      console.warn("Failed to parse package draft", e);
    }

    if (session) {
      getDraftOrder()
        .then((res) => {
          if (res?.success && res.data?.packageDraft) {
            setPackageDraft(res.data.packageDraft);
            try {
              localStorage.setItem(
                "fortsolar:active_package_order",
                JSON.stringify(res.data.packageDraft),
              );
            } catch (err) {
              console.warn(err);
            }
          } else if (localDraft) {
            saveDraftOrder({ packageDraft: localDraft }).catch((err) => console.warn(err));
          }
        })
        .catch((err) => console.warn("Failed to sync backend draft order:", err));
    }
  }, [session]);

  const handleClearPackageDraft = () => {
    try {
      localStorage.removeItem("fortsolar:active_package_order");
    } catch (err) {
      console.warn(err);
    }
    setPackageDraft(null);
    if (session) {
      deleteDraftOrder().catch((err) => console.warn("Failed to delete backend draft:", err));
    }
  };

  const safeCartItems = useMemo(() => (Array.isArray(cartItems) ? cartItems : []), [cartItems]);

  const productIds = useMemo(
    () => safeCartItems.filter((item) => item?.itemType === "product").map((item) => item.id),
    [safeCartItems],
  );
  const packageIds = useMemo(
    () => safeCartItems.filter((item) => item?.itemType === "package").map((item) => item.id),
    [safeCartItems],
  );
  const { items: products = [] } = useStoreProductsByIds(productIds);
  const { items: packages = [] } = useStorePackagesByIds(packageIds);
  const productMap = useMemo(
    () => new Map((products || []).map((item) => [String(item.id), item])),
    [products],
  );
  const packageMap = useMemo(
    () => new Map((packages || []).map((item) => [String(item.id), item])),
    [packages],
  );

  // Migrate any legacy package items out of cartItems into active_package_order draft
  React.useEffect(() => {
    const packagesInCart = safeCartItems.filter((item) => item?.itemType === "package");
    if (packagesInCart.length > 0) {
      const firstPkg = packagesInCart[0];
      const pkgDetail = packageMap.get(String(firstPkg.id));
      const draftObj = {
        packageId: firstPkg.id,
        packageTitle: pkgDetail?.title || "Office Pro",
        price: pkgDetail?.finalPrice ?? pkgDetail?.price,
        requestFinancing: false,
      };
      try {
        localStorage.setItem("fortsolar:active_package_order", JSON.stringify(draftObj));
        setPackageDraft(draftObj);
      } catch (e) {
        console.warn(e);
      }
      const productsOnly = safeCartItems.filter((item) => item?.itemType !== "package");
      replaceCart(productsOnly);
    }
  }, [safeCartItems, packageMap, replaceCart]);

  const cartDetails = useMemo(() => {
    return safeCartItems
      .map((item) => {
        const product =
          item.itemType === "product"
            ? productMap.get(String(item.id))
            : packageMap.get(String(item.id));
        if (!product) return null;
        const resolvedImage =
          (typeof (product as any).image === "string" && (product as any).image) ||
          (typeof (product as any).thumbnail === "string" && (product as any).thumbnail) ||
          (typeof (product as any).mainImage === "string" && (product as any).mainImage) ||
          (Array.isArray((product as any).images) && typeof (product as any).images[0] === "string" && (product as any).images[0]) ||
          (Array.isArray((product as any).galleryImages) && typeof (product as any).galleryImages[0] === "string" && (product as any).galleryImages[0]) ||
          "";
        return {
          ...item,
          title: product.title,
          price: product.price,
          image: resolvedImage || product.image,
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

      const couponObj = res.data?.coupon || res.coupon;
      const isValid = Boolean((res.success && res.data?.valid) || (res.valid && couponObj) || (res.data?.valid && couponObj));
      const discountAmount = res.data?.discount_amount ?? couponObj?.discount_amount ?? res.discount_amount ?? 0;

      if (isValid && couponObj) {
        const couponData = {
          code: couponObj.code,
          discount_amount: discountAmount,
          discount_type: couponObj.discount_type,
          discount_value: couponObj.discount_value,
          description: couponObj.description ?? null,
        };
        setAppliedCoupon(couponData);
        localStorage.setItem("fortsolar:applied_coupon", JSON.stringify(couponData));
        setCouponInput("");
      } else {
        setCouponError(res.data?.message || res.message || "Invalid or expired discount coupon.");
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
      image: typeof item.image === "string" ? item.image : (item.image as any)?.src || "/double_solar_panels.png",
      price: item.price,
      quantity: item.quantity,
    }));
  }, [cartDetails]);

  return (
    <div className="min-h-screen bg-white py-24">
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-28 lg:py-2">
        <div className="text-sm text-[#5A646B]">Home / Cart</div>
        {packageDraft && (
          <div className="mt-4 mb-3 rounded-2xl border border-[#048A05]/25 bg-[#F6FAF6] p-4 sm:p-5 shadow-sm transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#048A05] text-white shadow-sm">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#1E293B]">
                      Ongoing Solar Package Order: {packageDraft.packageTitle}
                    </p>
                    <span className="rounded-full bg-[#048A05]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#048A05]">
                      Draft Saved
                    </span>
                  </div>
                  <p className="text-xs text-[#5A646B] mt-1 leading-relaxed">
                    Complete solar packages include free nationwide delivery and professional installation, and are configured separately from individual equipment shopping carts.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => router.push(`/checkout?packageId=${packageDraft.packageId}`)}
                  className="rounded-xl bg-[#048A05] px-4 py-2 text-xs font-semibold text-white hover:bg-[#037004] transition cursor-pointer shadow-sm"
                >
                  Continue Package Setup &rarr;
                </button>
                <button
                  type="button"
                  onClick={handleClearPackageDraft}
                  className="rounded-xl border border-[#048A05]/30 px-3 py-2 text-xs font-medium text-[#048A05] hover:bg-[#048A05]/10 transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-[#252C32] dark:text-white">
                Your Product Cart
              </h1>
              <span className="text-sm text-[#5A646B] dark:text-slate-400">
                {isMounted ? totalItems : 0} Items in cart
              </span>
            </div>
            {!isMounted ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#048A05] border-t-transparent" />
                <p className="text-xs text-[#5A646B]">Loading your cart...</p>
              </div>
            ) : cartDetails.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto max-w-sm rounded-2xl border border-dashed border-[#E4E9EC] p-8">
                  <p className="text-base font-semibold text-[#252C32]">Your product cart is empty</p>
                  <p className="mt-1 text-xs text-[#5A646B]">
                    Looking for solar panels, inverters, or batteries? Browse our catalog to add products.
                  </p>
                  <Link
                    href="/products"
                    className="mt-4 inline-flex items-center rounded-xl bg-[#048A05] px-4 py-2 text-xs font-semibold text-white hover:bg-[#037004] transition"
                  >
                    Browse Products
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 border-t border-[#E9EEF0]">
              {cartDetails.map((item) => (
                <div
                  key={`${item.itemType}-${item.id}`}
                  className="grid grid-cols-[72px_1fr] gap-4 py-5 border-b px-3 border-[#E9EEF0]"
                >
                  <div
                    className="h-16 w-16 rounded-xl bg-slate-100 dark:bg-slate-800 bg-contain bg-center bg-no-repeat border border-slate-200 dark:border-slate-700 shrink-0"
                    style={{
                      backgroundImage: `url('${(typeof item.image === "string" ? item.image : (item.image as any)?.src) || "/double_solar_panels.png"}')`,
                    }}
                  />

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
          )}

            {cartDetails.length > 0 && (
              <div
                className={`mt-6 flex flex-col sm:flex-row items-center sm:justify-between gap-2 rounded-xl border px-4 py-3 text-xs font-semibold ${
                  shipping === 0
                    ? "border-[#048A05]/30 bg-[#EBFAEB] text-[#048A05]"
                    : "border-[#0284c7]/30 bg-[#f0f9ff] text-[#0284c7]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <DeliveryIcon className="w-5 h-5 shrink-0" />
                  <span>
                    {shipping === 0
                      ? hasPackage
                        ? "Free Nationwide Delivery & Installation Included (Packages)"
                        : isAllFreeDelivery
                        ? "Free Delivery on Eligible Products"
                        : subtotal >= 1500000
                        ? "Free Delivery Threshold Met (Orders ≥ ₦1,500,000)"
                        : "Free Delivery Included"
                      : hasWarehouseOnlyProduct
                      ? "Regional Warehouse / Depot Pickup (One or more items require freight pickup)"
                      : "Standard Nationwide Delivery (Calculated at checkout based on destination)"}
                  </span>
                </div>
                <span className="shrink-0">
                  {shipping === 0 ? "Free Nationwide Delivery" : "(3-5 Business Days)"}
                </span>
              </div>
            )}
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
                  {cartDetails.length === 0 ? (
                    <span className="font-semibold text-[#252C32]">₦0.00</span>
                  ) : shipping === 0 ? (
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
