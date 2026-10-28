"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaShare, FaTiktok, FaYoutube } from "react-icons/fa";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { StoreFooter } from "@/components/features/layout/StoreFooter";
import { FinancingIcon } from "@/components/features/icons/FinancingIcon";
import { CostSavingsModal } from "@/components/features/financing/CostSavingsModal";
import { DeliveryIcon } from "@/components/features/icons/DeliveryIcon";
import HeartIcon from "@/components/features/icons/HeartIcon";
import PackagesGrid from "@/components/features/pages/packages/PackagesGrid";
import EmptyStatePanel from "@/components/ui/empty-state-panel";
import { useCustomerFavoriteToggle } from "@/hooks/use-customer-favorite-toggle";
import { useCustomerLoginGate } from "@/hooks/use-customer-login-gate";
import { useGeneralStore } from "@/store/GeneralStore";
import {
  STORE_PAGE_SIZE,
  useStorePackageById,
  useStorePackages,
} from "@/lib/store-catalog";
import { useAuth } from "@/components/auth/auth-provider";
import { getDraftOrder, saveDraftOrder } from "@/lib/customer";
import { FORTSOLAR_WHATSAPP_NUMBER } from "@/lib/env";

const PackageDetailPage = () => {
  const { session } = useAuth();
  const [query, setQuery] = useState("");
  const params = useParams<{ id: string }>();
  const [showFeatures, setShowFeatures] = useState(true);
  const [showSpecsGallery, setShowSpecsGallery] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const router = useRouter();
  const id = params?.id;
  const { package: data, isLoading } = useStorePackageById(id);
  const { items: packageSuggestions } = useStorePackages({
    page: 1,
    limit: STORE_PAGE_SIZE,
    isActive: true,
  });

  const favorites = useGeneralStore((state) =>
    Array.isArray(state?.favorites?.packages) ? state.favorites.packages : []
  );
  const { togglePackageFavorite } = useCustomerFavoriteToggle();
  const { requireCustomerLogin } = useCustomerLoginGate();
  const [activeDraft, setActiveDraft] = useState<{
    packageId: string | number;
    packageTitle: string;
  } | null>(null);

  // Single unified Cost & Savings Modal state
  const [showCostSavingsModal, setShowCostSavingsModal] = useState(false);

  // Canonical slug URL synchronization: If accessed via raw UUID, rewrite address bar to clean slug
  React.useEffect(() => {
    if (data?.slug && id && id !== data.slug) {
      window.history.replaceState(null, "", `/packages/${data.slug}`);
    }
  }, [data?.slug, id]);

  React.useEffect(() => {
    let localDraft: any = null;
    try {
      const raw = localStorage.getItem("fortsolar:active_package_order");
      if (raw) {
        localDraft = JSON.parse(raw);
        setActiveDraft(localDraft);
      }
    } catch (e) {
      console.warn("Failed to parse package draft", e);
    }

    if (session) {
      getDraftOrder()
        .then((res) => {
          if (res?.success && res.data?.packageDraft) {
            setActiveDraft(res.data.packageDraft);
            try {
              localStorage.setItem(
                "fortsolar:active_package_order",
                JSON.stringify(res.data.packageDraft),
              );
            } catch (err) {
              console.warn(err);
            }
          }
        })
        .catch((err) => console.warn("Failed to get draft order:", err));
    }
  }, [session]);

  const packagePrice = data ? (data.finalPrice ?? data.price) : 0;

  // Standard 4% monthly flat rate, 30% downpayment, 12 months tenure
  const estimatedMonthlyInstallment = useMemo(() => {
    if (!packagePrice) return 0;
    const principal = packagePrice * 0.70;
    const totalInterest = principal * 0.04 * 12;
    return Math.round((principal + totalInterest) / 12);
  }, [packagePrice]);

  const handleOrderPackage = (
    withFinancing = false,
    financingTerms?: { downPaymentPct: number; tenureMonths: number }
  ) => {
    if (!data) return;
    const packageId = data.slug || data.id;
    const packageDraft = {
      packageId,
      packageTitle: data.title,
      price: data.finalPrice ?? data.price,
      image: data.mainImage || data.image,
      requestFinancing: withFinancing,
    };
    try {
      localStorage.setItem(
        "fortsolar:active_package_order",
        JSON.stringify(packageDraft),
      );
    } catch (e) {
      console.error(e);
    }
    if (session) {
      saveDraftOrder({ packageDraft }).catch((err) => console.warn("Backend draft save failed:", err));
    }
    let targetUrl = withFinancing
      ? `/checkout?packageId=${encodeURIComponent(String(packageId))}&financing=1`
      : `/checkout?packageId=${encodeURIComponent(String(packageId))}`;
    if (withFinancing && financingTerms) {
      targetUrl += `&downpayment=${financingTerms.downPaymentPct}&tenure=${financingTerms.tenureMonths}`;
    }
    requireCustomerLogin({
      redirectTo: targetUrl,
      onAuthenticated: () => router.push(targetUrl),
    });
  };

  const activeImage = selectedImage || data?.mainImage || data?.image || "";
  const relatedPackages = useMemo(
    () =>
      packageSuggestions.filter((item) => String(item.id) !== String(id)).slice(0, 3),
    [id, packageSuggestions],
  );

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <DashboardHeader query={query} onQueryChange={setQuery} />
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <EmptyStatePanel
            title="Loading package details"
            description="We are fetching the latest package information for this page."
            className="min-h-64"
          />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <DashboardHeader query={query} onQueryChange={setQuery} />
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <EmptyStatePanel
            title="Package not found"
            description="This package is unavailable or no longer exists in the store catalog."
            className="min-h-64"
          />
        </div>
      </div>
    );
  }

  const galleryImages = data.galleryImages?.length ? data.galleryImages : [data.mainImage || data.image];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1d] py-24 transition-colors">
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto mt-26 w-full max-w-6xl px-4 lg:mt-0">
        <button onClick={() => router.back()} className="flex cursor-pointer items-center gap-2 text-sm text-[#5A646B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
          <span className="text-lg">←</span>
          <span>Back</span>
        </button>
        <nav aria-label="Breadcrumb" className="mt-4 flex items-center gap-2 text-sm text-[#5A646B] dark:text-slate-400 flex-wrap">
          <Link href="/" className="hover:text-[#048A05] transition font-medium">Home</Link>
          <span className="text-[#B0BABF] dark:text-slate-600">/</span>
          <Link href="/packages" className="hover:text-[#048A05] transition font-medium">Packages</Link>
          <span className="text-[#B0BABF] dark:text-slate-600">/</span>
          <span className="text-slate-900 dark:text-white font-medium truncate max-w-[320px]">{data.title}</span>
        </nav>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left Column: Image Gallery, Overview, Specifications */}
          <div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[88px_1fr]">
              <div className="flex gap-3 lg:flex-col">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`h-20 w-20 overflow-hidden rounded-lg border ${activeImage === image ? "border-[#048A05]" : "border-slate-200 dark:border-slate-800"} bg-slate-100 dark:bg-slate-800`}
                  >
                    <img src={image} alt={`${data.title} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-6">
                <img src={activeImage} alt={data.title} className="h-96 w-full rounded-2xl object-contain" />
              </div>
            </div>

            <div className="mt-8 space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-xs">
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Package Overview</h2>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{data.overview}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">System Details</h3>
                <ul className="mt-2 list-inside list-disc space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  {data.systemDetails.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">What It Powers</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.powers.map((item) => (
                    <span key={item} className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-1 text-sm text-slate-800 dark:text-slate-200">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Collapsible Package Specifications & Gallery (Merged cleanly without duplicate thumbnail) */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-5 border border-slate-200 dark:border-slate-700">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowSpecsGallery(!showSpecsGallery)}
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Package Specifications & Gallery</h3>
                  <span className="text-neutral-500 dark:text-slate-400">
                    {showSpecsGallery ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </div>                {showSpecsGallery && (
                  <div className="mt-4 space-y-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {/* Datasheets */}
                    {data.datasheets?.length ? (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Technical Datasheets</h4>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {data.datasheets.map((asset) => (
                            <div key={asset.url} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex items-center justify-between gap-3 shadow-xs">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{asset.name}</p>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">{asset.kind || "Document"}</span>
                              </div>
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-[#048A05] dark:text-emerald-400 hover:underline shrink-0"
                              >
                                View &rarr;
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Included Products Gallery - Only displayed if items actually have real product images */}
                    {data.includedProducts?.some((item) => Boolean(item.image)) ? (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Included Products & Components</h4>
                        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                          {data.includedProducts
                            .filter((item) => Boolean(item.image))
                            .map((item) => (
                              <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-center shadow-xs">
                                <img src={item.image!} alt={item.productName} className="h-28 w-full rounded-lg object-contain bg-slate-50 dark:bg-slate-900 mb-2 p-1" />
                                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{item.productName}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.categoryLabel}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Financing, Action Buttons */}
          <div>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{data.title}</h1>

            {/* Price Display */}
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  ₦{packagePrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
                {data.discountPercentage ? (
                  <span className="text-sm text-[#9AA5AC] dark:text-slate-500 line-through">
                    ₦{data.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </span>
                ) : null}
              </div>
              <div>
                {data.inStock === false ? (
                  <span className="inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/40 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                    Out of Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                    In Stock &amp; Ready for Installation
                  </span>
                )}
              </div>
            </div>

            {/* Solar Financing & Energy Savings Callout Card */}
            <div className="mt-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 shadow-xs">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#048A05] text-white shrink-0 shadow-xs">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      {data.solarFinanceEnabled ? (
                        <>Direct purchase or spread payments from <strong className="text-[#048A05] dark:text-emerald-400">₦{estimatedMonthlyInstallment.toLocaleString()}/mo</strong></>
                      ) : (
                        <>Compare with Generator & NEPA Expenses</>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      See fuel elimination & grid electricity savings
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCostSavingsModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 border border-[#048A05]/30 hover:border-[#048A05] px-3 py-1.5 text-xs font-semibold text-[#048A05] dark:text-emerald-400 hover:bg-[#EBFAEB] dark:hover:bg-emerald-950/40 transition shadow-xs cursor-pointer"
                >
                  <span>See Cost & Savings</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>

            {activeDraft && String(activeDraft.packageId) === String(data.id) && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-[#EBFAEB] dark:bg-emerald-950/30 p-3 text-xs">
                <span className="text-[#048A05] dark:text-emerald-400 font-medium">
                  ✓ You have a saved draft configuration for this package.
                </span>
                <button
                  type="button"
                  onClick={() => handleOrderPackage(false)}
                  className="font-semibold text-[#048A05] dark:text-emerald-400 underline hover:text-[#036a04] cursor-pointer"
                >
                  Resume Setup &rarr;
                </button>
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="mt-5 space-y-2.5">
              {data.inStock === false && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300">
                  This system package is currently out of stock for direct instant order. You can talk to an engineer to reserve components or arrange a pre-order timeline.
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOrderPackage(false)}
                  disabled={data.inStock === false}
                  className={`flex-1 rounded-xl py-3 text-sm font-semibold transition shadow-sm text-center ${
                    data.inStock === false
                      ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700"
                      : "bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] text-white cursor-pointer hover:opacity-95"
                  }`}
                >
                  {data.inStock === false ? "Temporarily Out of Stock" : "Order System Package"}
                </button>
                <button
                  onClick={() => togglePackageFavorite(data.id)}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-slate-700 transition"
                  title="Save to favorites"
                >
                  <HeartIcon
                    filled={favorites.includes(data.id)}
                    className={favorites.includes(data.id) ? "text-[#E11D48]" : "text-[#3B3B3B]/60 dark:text-slate-400"}
                  />
                </button>
              </div>

              <div>
                <a
                  href={`https://wa.me/${FORTSOLAR_WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    `Hi Fortsolar, I'm interested in the "${data.title}" package. Can I talk to an engineer about it?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Talk to an Engineer
                </a>
              </div>

              {data.solarFinanceEnabled && data.inStock !== false ? (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleOrderPackage(true)}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#048A05] dark:hover:text-emerald-400 transition cursor-pointer underline underline-offset-2"
                  >
                    Prefer instalment payments? Explore flexible financing &rarr;
                  </button>
                </div>
              ) : null}
            </div>

            {/* Package Includes Dropdown */}
            <div className="mt-6 p-4 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
              <div
                className="flex items-center justify-between font-semibold text-slate-900 dark:text-white cursor-pointer"
                onClick={() => setShowFeatures(!showFeatures)}
              >
                <span>Package Includes</span>
                <span>
                  {showFeatures ? <ChevronDown className="h-5 w-5 text-gray-500 dark:text-slate-400" /> : <ChevronUp className="h-5 w-5 text-gray-500 dark:text-slate-400" />}
                </span>
              </div>
              {showFeatures ? (
                <div className="mt-3 text-slate-600 dark:text-slate-400">
                  {data.packageIncludes.map((item) => (
                    <div key={item.label} className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2.5 text-xs">
                      <span>{item.label}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{item.qty}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Financing & Delivery Badges */}
            <div className="mt-4 space-y-3">
              {data.solarFinanceEnabled ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 text-xs text-slate-700 dark:text-slate-300">
                  <FinancingIcon />
                  <div>
                    <p className="font-semibold text-[#048A05] dark:text-emerald-400">Solar Financing Available</p>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                      Structured monthly instalments available at checkout with verified lending partners.
                    </p>
                  </div>
                </div>
              ) : null}
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-700 dark:text-slate-300">
                <DeliveryIcon />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Nationwide Delivery & Installation</p>
                  <p className="text-slate-600 dark:text-slate-400">Certified professional installation available across all 36 states.</p>
                </div>
              </div>
            </div>

            {/* Included Products List */}
            <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Included Products</h3>
              <div className="mt-4 space-y-3">
                {(data.includedProducts ?? []).length ? (
                  data.includedProducts?.map((item) => (
                    <div key={`${item.id}-${item.productName}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-3 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.productName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.categoryLabel}</p>
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">x{item.quantity}</span>
                    </div>
                  ))
                ) : (
                  <EmptyStatePanel
                    title="No included products listed"
                    description="This package does not have any published included-product entries yet."
                    className="min-h-40 rounded-2xl"
                  />
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 text-[#5A646B] dark:text-slate-400">
              <FaTiktok />
              <FaYoutube />
              <FaInstagram />
              <FaFacebook />
              <FaLinkedin />
              <FaShare />
            </div>
          </div>
        </div>

        {/* Other Related Packages */}
        <div className="mt-12 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Other Related Packages</h2>
          <Link href="/packages" className="rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] px-4 py-2 text-sm text-white">
            View All Packages
          </Link>
        </div>
        <div className="mt-6">
          <PackagesGrid items={relatedPackages} view="grid" />
        </div>
      </div>

      {/* Unified Cost & Savings Modal */}
      <CostSavingsModal
        isOpen={showCostSavingsModal}
        onClose={() => setShowCostSavingsModal(false)}
        systemPrice={packagePrice}
        packageName={data.title}
        packageSlug={String(data.slug || data.id)}
        onBuyOutright={() => handleOrderPackage(false)}
        onBuyWithFinancing={(terms) => {
          handleOrderPackage(true, terms);
        }}
      />

      <StoreFooter />
    </div>
  );
};

export default PackageDetailPage;
