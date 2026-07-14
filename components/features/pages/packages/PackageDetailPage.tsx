"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaShare, FaTiktok, FaYoutube } from "react-icons/fa";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { FinancingIcon } from "@/components/features/icons/FinancingIcon";
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

const PackageDetailPage = () => {
  const [query, setQuery] = useState("");
  const params = useParams<{ id: string }>();
  const [showFeatures, setShowFeatures] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const router = useRouter();
  const id = params?.id;
  const { package: data, isLoading } = useStorePackageById(id);
  const { items: packageSuggestions } = useStorePackages({
    page: 1,
    limit: STORE_PAGE_SIZE,
    isActive: true,
  });

  const favorites = useGeneralStore((state) => state.favorites.packages);
  const { togglePackageFavorite } = useCustomerFavoriteToggle();
  const addToCart = useGeneralStore((state) => state.addToCart);
  const updateCartQuantity = useGeneralStore((state) => state.updateCartQuantity);
  const { requireCustomerLogin } = useCustomerLoginGate();

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
    <div className="min-h-screen bg-white py-24">
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto mt-26 w-full max-w-6xl px-4 lg:mt-0">
        <button onClick={() => router.back()} className="flex cursor-pointer items-center gap-2 text-sm text-[#5A646B]">
          <span className="text-lg">←</span>
          <span>Back</span>
        </button>
        <div className="mt-4 text-sm text-[#5A646B]">
          Home / Packages / <span className="text-[#252C32]">{data.title}</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[88px_1fr]">
              <div className="flex gap-3 lg:flex-col">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    className={`h-20 w-20 overflow-hidden rounded-lg border ${activeImage === image ? "border-[#048A05]" : "border-[#E9EEF0]"} bg-[#F3F4F6]`}
                  >
                    <img src={image} alt={`${data.title} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-[#F3F4F6] p-6">
                <img src={activeImage} alt={data.title} className="h-96 w-full rounded-2xl object-contain" />
              </div>
            </div>

            <div className="mt-8 space-y-6 rounded-2xl border bg-[#B8C0CC33] p-6">
              <div>
                <h2 className="text-xl font-semibold text-[#101828]">Package Overview</h2>
                <p className="mt-2 text-sm text-[#333333]">{data.overview}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#101828]">System Details</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#333333]">
                  {data.systemDetails.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#252C32]">What It Powers</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.powers.map((item) => (
                    <span key={item} className="rounded-lg border border-[#D6E4D6] bg-white px-3 py-1 text-sm text-[#3B3B3B]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#252C32]">Package Thumbnail</h3>
                <div className="mt-4 rounded-2xl bg-white p-3">
                  <img src={data.thumbnail || data.image} alt={`${data.title} thumbnail`} className="aspect-[4/3] w-full rounded-xl object-cover" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#252C32]">Datasheets</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {data.datasheets?.length ? (
                    data.datasheets.map((asset) => (
                      <div key={asset.url} className="rounded-2xl bg-white p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <strong className="truncate text-sm text-[#252C32]">{asset.name}</strong>
                          <a href={asset.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#048A05]">
                            Open
                          </a>
                        </div>
                        {asset.kind === "image" ? (
                          <img src={asset.url} alt={asset.name} className="h-48 w-full rounded-xl object-cover" />
                        ) : asset.kind === "pdf" ? (
                          <iframe src={asset.url} title={asset.name} className="h-48 w-full rounded-xl border border-[#E4E9EC]" />
                        ) : (
                          <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-[#E4E9EC] bg-[#F8F9FA] text-sm text-[#5A646B]">
                            Preview unavailable
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <EmptyStatePanel
                      title="No datasheets available"
                      description="This package does not have any published datasheets yet."
                      className="rounded-2xl bg-white min-h-48"
                    />
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#252C32]">Product Images in This Package</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {(data.includedProducts ?? []).length ? (
                    data.includedProducts?.map((item) =>
                      item.image ? (
                        <div key={item.id} className="rounded-2xl bg-white p-3">
                          <img src={item.image} alt={item.productName} className="h-40 w-full rounded-xl object-cover" />
                          <p className="mt-3 text-sm font-semibold text-[#252C32]">{item.productName}</p>
                          <p className="text-xs text-[#5A646B]">{item.categoryLabel}</p>
                        </div>
                      ) : null,
                    )
                  ) : (
                    <EmptyStatePanel
                      title="No product gallery available"
                      description="This package does not have published product images yet."
                      className="rounded-2xl bg-white min-h-48"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-[#F59E0B]">
              {"★★★★★"}
              <span className="text-[#5A646B]">({data.reviewsCount} Reviews)</span>
            </div>

            <h1 className="mt-2 text-2xl font-semibold text-[#252C32]">{data.title}</h1>
            <p className="mt-2 text-sm text-[#5A646B]">{data.overview}</p>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-xl font-semibold text-[#252C32]">
                ₦{(data.finalPrice ?? data.price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
              {data.discountPercentage ? (
                <span className="text-sm text-[#9AA5AC] line-through">
                  ₦{data.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  addToCart({ id: data.id, itemType: "package" });
                  updateCartQuantity({ id: data.id, itemType: "package", quantity: 1 });
                  requireCustomerLogin({
                    redirectTo: "/checkout",
                    onAuthenticated: () => router.push("/checkout"),
                  });
                }}
                className="flex-1 rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] py-3 text-sm font-semibold text-white cursor-pointer"
              >
                Get Package
              </button>
              <button onClick={() => togglePackageFavorite(data.id)} className="grid h-11 w-11 place-items-center rounded-xl border border-[#E4E9EC] cursor-pointer">
                <HeartIcon filled={favorites.includes(data.id)} className={favorites.includes(data.id) ? "text-[#E11D48]" : "text-[#3B3B3B]/60"} />
              </button>
            </div>

            <div className="mt-3">
              <a
                href={`https://wa.me/2347066524793?text=${encodeURIComponent(
                  `Hi Fortsolar, I'm interested in the "${data.title}" package. Can I talk to an engineer about it?`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center rounded-xl border border-[#D0D5DD] bg-white py-3 text-sm font-semibold text-[#3B3B3B] transition hover:bg-slate-50 cursor-pointer"
              >
                Talk to an Engineer
              </a>
            </div>

            <div className="mt-6 p-4 text-sm">
              <div className="flex items-center justify-between font-semibold text-[#252C32]">
                <span>Package Includes</span>
                <span onClick={() => setShowFeatures(!showFeatures)}>
                  {showFeatures ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronUp className="h-5 w-5 text-gray-500" />}
                </span>
              </div>
              {showFeatures ? (
                <div className="mt-3 text-[#5A646B]">
                  {data.packageIncludes.map((item) => (
                    <div key={item.label} className="flex justify-between border-b py-3">
                      <span>{item.label}</span>
                      <span className="text-[#252C32]">{item.qty}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex gap-4 rounded-xl bg-[#EBFAEB] p-3 text-xs text-[#3B3B3B]">
                <FinancingIcon />
                <div>
                  <p>{data.solarFinanceEnabled ? "Solar Finance Available" : "Solar Finance Disabled"}</p>
                  <p className="cursor-pointer hover:underline">{data.solarFinanceEnabled ? "This package can be requested on financing terms." : "Direct payment only for this package."}</p>
                </div>
              </div>
              <div className="flex gap-4 rounded-xl bg-[#EBFAEB] p-3 text-xs text-[#3B3B3B]">
                <DeliveryIcon />
                <div>
                  <p>Free Delivery</p>
                  <p className="cursor-pointer hover:underline">Enter your postal code for Delivery Availability</p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[#E4E9EC] bg-white p-4">
              <h3 className="text-lg font-semibold text-[#252C32]">Included Products</h3>
              <div className="mt-4 space-y-3">
                {(data.includedProducts ?? []).length ? (
                  data.includedProducts?.map((item) => (
                    <div key={`${item.id}-${item.productName}`} className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF1F4] px-3 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[#252C32]">{item.productName}</p>
                        <p className="text-xs text-[#5A646B]">{item.categoryLabel}</p>
                      </div>
                      <span className="text-sm text-[#252C32]">x{item.quantity}</span>
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

            <div className="mt-4 flex items-center gap-3 text-[#5A646B]">
              <FaTiktok />
              <FaYoutube />
              <FaInstagram />
              <FaFacebook />
              <FaLinkedin />
              <FaShare />
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[#252C32]">Other Related Packages</h2>
          <Link href="/packages" className="rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] px-4 py-2 text-sm text-white">
            View All Packages
          </Link>
        </div>
        <div className="mt-6">
          <PackagesGrid items={relatedPackages} view="grid" />
        </div>
      </div>
    </div>
  );
};

export default PackageDetailPage;
