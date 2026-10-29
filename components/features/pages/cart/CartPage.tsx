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

// Quote-eligible products are packages or items explicitly marked as quote-eligible by category or product spec.
// Pure consumer appliances or unconfigured items do NOT prompt installation quotes.
export const isSolarQuoteEligible = (item: {
  itemType?: string;
  title?: string;
  category?: string;
  eligibleForInstallation?: boolean;
  eligibleForQuote?: boolean;
  eligible_for_quote?: boolean;
}) => {
  if (item.itemType === "package") return true;
  if (item.eligibleForQuote !== undefined) return Boolean(item.eligibleForQuote);
  if (item.eligible_for_quote !== undefined) return Boolean(item.eligible_for_quote);
  if (item.eligibleForInstallation !== undefined) return Boolean(item.eligibleForInstallation);
  return false;
};

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
          eligibleForQuote: (product as any).eligibleForQuote || (product as any).eligible_for_quote || (product as any).category?.eligible_for_quote || false,
          category: (product as any).category?.name || (product as any).categoryName || (product as any).category || "",
          freeDelivery: (product as any).freeDelivery ?? false,
          eligibleForWaybill: (product as any).eligibleForWaybill ?? true,
          weightTier: (product as any).weightTier ?? "under_5kg",
          weightKg: (product as any).weightKg ?? 5,
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
        eligibleForQuote?: boolean;
        freeDelivery?: boolean;
        eligibleForWaybill?: boolean;
        weightTier?: string;
        weightKg?: number;
      }>;
  }, [cartItems, packageMap, productMap]);

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
    return cartDetails.some((item) => item.itemType === "product" && isSolarQuoteEligible(item));
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

  const totalCartWeightKg = useMemo(() => {
    return cartDetails.reduce((sum, item) => {
      const w = item.itemType === "package" ? 150 : (item.weightKg ?? 5);
      return sum + w * item.quantity;
    }, 0);
  }, [cartDetails]);

  const totalWeightSurcharge = useMemo(() => {
    if (totalCartWeightKg <= 5) return 0;
    if (totalCartWeightKg <= 20) return 5000;
    if (totalCartWeightKg <= 50) return 12000;
    if (totalCartWeightKg <= 100) return 24000;
    return 24000 + Math.ceil(totalCartWeightKg - 100) * 350;
  }, [totalCartWeightKg]);

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
    return 16000 + totalWeightSurcharge; // Universal base fee (₦16,000) + combined weight surcharge
  }, [cartDetails.length, subtotal, hasPackage, isAllFreeDelivery, totalWeightSurcharge]);

  const tax = 0;

  const discountAmount = 0;

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon || subtotal <= 0) return 0;
    if (appliedCoupon.discount_amount && appliedCoupon.discount_amount > 0) {
      return Math.min(subtotal, appliedCoupon.discount_amount);
    }
    if (appliedCoupon.discount_type === "percentage") {
      return Math.min(subtotal, Math.round((subtotal * appliedCoupon.discount_value) / 100));
    }
    return Math.min(subtotal, appliedCoupon.discount_value || 0);
  }, [appliedCoupon, subtotal]);
  const total = Math.max(0, subtotal + shipping - discountAmount - couponDiscount);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await validateCustomerCoupon({
        code: couponInput.trim().toUpperCase(),
        order_amount: subtotal,
        product_ids: cartDetails.map((it) => String(it.id)),
        items: cartDetails.map((it) => ({
          id: String(it.id),
          price: it.price,
          quantity: it.quantity,
        })),
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
        requestInstallation: hasPackage ? true : false,
      })
    );
  }, [hasPackage]);

  const quoteProducts = useMemo(() => {
    return cartDetails
      .filter((item) => isSolarQuoteEligible(item))
      .map((item) => ({
      id: item.id,
      title: item.title,
      image: typeof item.image === "string" ? item.image : (item.image as any)?.src || "/double_solar_panels.png",
      price: item.price,
      quantity: item.quantity,
    }));
  }, [cartDetails]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 py-24 transition-colors">
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-28 lg:py-2">
        <div className="text-sm text-[#5A646B] dark:text-slate-400">Home / Cart</div>
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
                      : "Standard Nationwide Delivery"}
                  </span>
                </div>
                <span className="shrink-0 text-xs">
                  {shipping === 0 ? "Free Nationwide Delivery" : "(3-5 Business Days)"}
                </span>
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-[#E9EEF0] dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4 shadow-xs">
              <div className="rounded-xl shadow-sm bg-[#B8C0CC14] dark:bg-slate-800/40 p-4">
                <div className="flex items-center justify-between border-b border-[#E9EEF0] dark:border-slate-700/60 py-3">
                  <span className="text-sm text-[#5A646B] dark:text-slate-400">Sub Total</span>
                  <span className="font-semibold text-[#252C32] dark:text-white">
                    {formatNaira(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#E9EEF0] dark:border-slate-700/60 py-3">
                  <span className="text-sm text-[#5A646B] dark:text-slate-400">Shipping</span>
                  {cartDetails.length === 0 ? (
                    <span className="font-semibold text-[#252C32] dark:text-white">₦0.00</span>
                  ) : shipping === 0 ? (
                    <span className="rounded-md bg-[#EBFAEB] dark:bg-emerald-950/60 px-2 py-0.5 text-xs text-[#048A05] dark:text-emerald-400 font-semibold">
                      Free
                    </span>
                  ) : (
                    <span className="font-semibold text-[#252C32] dark:text-white">
                      {formatNaira(shipping)}
                    </span>
                  )}
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between border-b border-[#E9EEF0] dark:border-slate-700/60 py-3">
                    <span className="text-sm text-[#5A646B] dark:text-slate-400">Package Discount</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      -{formatNaira(discountAmount)}
                    </span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex items-center justify-between border-b border-[#E9EEF0] dark:border-slate-700/60 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-[#048A05] dark:text-emerald-400">Coupon ({appliedCoupon.code})</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-500 hover:text-red-700 ml-1 font-bold"
                        title="Remove coupon"
                      >
                        ✕
                      </button>
                    </div>
                    <span className="font-semibold text-[#048A05] dark:text-emerald-400">
                      -{formatNaira(couponDiscount)}
                    </span>
                  </div>
                )}
                {hasPackage && (
                  <div className="flex items-center justify-between border-b border-[#E9EEF0] dark:border-slate-700/60 py-3">
                    <span className="text-sm text-[#5A646B] dark:text-slate-400">Professional Installation</span>
                    <span className="rounded-md bg-[#EBFAEB] dark:bg-emerald-950/60 px-2 py-0.5 text-xs text-[#048A05] dark:text-emerald-400 font-semibold">
                      Free (Included)
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3">
                  <span className="font-semibold text-[#252C32] dark:text-white">Total</span>
                  <span className="font-semibold text-lg text-[#252C32] dark:text-white">
                    {formatNaira(total)}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#E9EEF0] dark:border-slate-800 bg-white dark:bg-[#11192e] p-3.5 shadow-sm">
                <label className="block text-xs font-semibold text-[#252C32] dark:text-slate-200 mb-1.5">
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
                    className="h-9 flex-1 rounded-lg border border-[#E4E9EC] dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 text-xs uppercase font-semibold outline-none focus:border-[#048A05]"
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

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    requireCustomerLogin({
                      redirectTo: "/checkout",
                      onAuthenticated: () => router.push("/checkout"),
                    })
                  }
                  className="block w-full rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] py-3.5 text-center font-semibold text-white cursor-pointer hover:opacity-95 transition-all text-base shadow-md"
                >
                  Proceed to Checkout
                </button>

                {quoteProducts.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 text-xs transition-colors">
                    <p className="font-bold text-slate-900 dark:text-white">Need Professional Installation?</p>
                    <p className="text-[#5A646B] dark:text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                      You have solar components in your cart. You can proceed to checkout right away, or request an official installation quote if you require a formal proposal first.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsQuoteModalOpen(true)}
                      className="mt-2.5 w-full rounded-lg border border-[#048A05] text-[#048A05] dark:text-emerald-300 hover:bg-[#048A05] hover:text-white dark:hover:bg-[#048A05] py-2 text-center font-semibold transition-colors cursor-pointer"
                    >
                      Request an Installation Quote
                    </button>
                  </div>
                )}

                <Link
                  href="/products"
                  className="block w-full rounded-xl border border-slate-300 dark:border-slate-700 py-2.5 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>

              <div className="mt-12 text-sm text-[#5A646B] dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-6">
                <p className="mb-2 text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Good to know</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Complete Solar System Packages
                </p>
                <p className="mt-1.5 leading-relaxed text-xs">
                  Looking for a complete solar solution? Check our packages that bundle panels, hybrid inverters, batteries, and free nationwide installation.{" "}
                  <Link
                    href="/packages"
                    className="inline-flex items-center gap-1 text-[#048A05] dark:text-emerald-400 font-semibold hover:underline"
                  >
                    View Solar Packages
                    <span>↗</span>
                  </Link>
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
