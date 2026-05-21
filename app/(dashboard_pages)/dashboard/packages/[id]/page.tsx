"use client";

import React, { useState } from "react";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { useGeneralStore } from "@/store/GeneralStore";
import { FinancingIcon } from "@/components/features/icons/FinancingIcon";
import { DeliveryIcon } from "@/components/features/icons/DeliveryIcon";
import HeartIcon from "@/components/features/icons/HeartIcon";
import PackagesGrid from "@/components/features/pages/packages/PackagesGrid";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FaTiktok, FaYoutube, FaInstagram, FaFacebook, FaLinkedin, FaShare } from 'react-icons/fa';
import { useCustomerLoginGate } from "@/hooks/use-customer-login-gate";
import { useStoreCatalog, useStorePackageById } from "@/lib/store-catalog";

const PackageDetailPage = () => {
  const { packages } = useStoreCatalog();
  const [query, setQuery] = useState("");
  const params = useParams<{ id: string }>();
  const [showFeatures, setShowFeatures] = useState(true)
  const router = useRouter();
  const id = params?.id;
  const { package: data, isLoading } = useStorePackageById(id);

  const favorites = useGeneralStore((state) => state.favorites.packages);
  const toggleFavorite = useGeneralStore((state) => state.toggleFavoritePackage);
  const addToCart = useGeneralStore((state) => state.addToCart);
  const updateCartQuantity = useGeneralStore((state) => state.updateCartQuantity);
  const { requireCustomerLogin } = useCustomerLoginGate();

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <DashboardHeader query={query} onQueryChange={setQuery} />
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <p className="text-[#252C32]">Loading package...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <DashboardHeader query={query} onQueryChange={setQuery} />
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <p className="text-[#252C32]">Package not found.</p>
          <p className="mt-2 text-xs text-gray-500">
            Debug: id = {id}
          </p>
        </div>
      </div>
    );
  }

  const relatedPackages = packages.filter((item) => String(item.id) !== id).slice(0, 3);

  return (
    <div className="min-h-screen bg-white py-24">
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto w-full max-w-6xl px-4 mt-26 lg:mt-0">
        <button
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-2 text-sm text-[#5A646B]"
        >
          <span className="text-lg">←</span>
          <span>Back</span>
        </button>
        <div className="mt-4 text-sm text-[#5A646B]">
          Home / Store / Product Category /{" "}
          <span className="text-[#252C32]">{data.title}</span>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-[88px_1fr] gap-4">
              <div className="flex lg:flex-col gap-3">
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="relative h-20 w-20 rounded-lg border border-[#E9EEF0] bg-[#F3F4F6] bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${data.image})` }}
                  >
                    <span className="absolute -left-2 -top-1 h-5 w-5 rounded-full bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] text-[10px] text-white grid place-items-center">
                      {index}
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-[#F3F4F6] p-6 flex items-center justify-center">
                <div
                  className="h-96 w-full rounded-2xl bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${data.image})` }}
                />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-8">
              <div className="space-y-6">
                <div className="rounded-2xl border bg-[#B8C0CC33] p-6">
                  <h2 className="text-xl font-semibold text-[#101828]">
                    Package Overview
                  </h2>
                  <p className="mt-2 text-sm text-[#333333]">{data.overview}</p>

                  <h3 className="mt-6 capitalize text-xl font-semibold text-[#101828]">
                    System Details
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-[#333333] list-disc list-inside">
                    {data.systemDetails.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <h3 className="mt-6 text-lg font-semibold text-[#252C32]">
                    What It Powers (Power Capacity Showcase)
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-[#333333] list-disc list-inside">
                    {data.powers.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="text-[#333333] mt-4 text-sm italic">Average runtime: 24 hours (depending on load and sunlight).</p>

                  <h3 className="mt-6 text-lg font-semibold text-[#252C32]">
                    Delivery & Warranty Info
                  </h3>
                  <ul className="mt-2 space-y-1 text-sm text-[#333333] list-disc list-inside">
                    <li>Enjoy free nationwide delivery.</li>
                    <li>Solar Panels: 25-Year Linear Power Output Warranty.</li>
                    <li>Inverter: 5-Year Manufacturer&apos;s Warranty covering defects.</li>
                    <li>Battery: 10-Year Manufacturer&apos;s Warranty covering defects.</li>
                    <li>Installation Workmanship: 1-Year Workmanship Warranty.</li>
                  </ul>

                  <div className="mt-6 rounded-2xl w-fit max-w-xs bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] p-4 text-white">
                    <p className="font-semibold">Ready to Go Solar?</p>
                    <p className="mt-2 text-sm">
                      Start saving with this all-in-one solar Package, installed for
                      free and backed by our trusted warranty.
                    </p>
                    <button className="mt-4 inline-flex items-center rounded-lg bg-white text-[#1FA21B] cursor-pointer hover:opacity-90 px-4 py-2 text-sm">
                      Get this Package
                    </button>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[#252C32]">
                      Datasheet
                    </h3>
                    <button className="rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] px-4 py-2 text-sm text-white">
                      Download Datasheet
                    </button>
                  </div>
                  <div className="mt-4 h-64 rounded-xl bg-white" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-[#F59E0B]">
              {"★★★★★"}
              <span className="text-[#5A646B]">
                ({data.reviewsCount} Reviews)
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-[#252C32]">
              {data.title}
            </h1>
            <p className="mt-2 text-sm text-[#5A646B]">{data.overview}</p>

            <div className="mt-4 text-xl font-semibold text-[#252C32]">
              ₦{data.price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  addToCart({ id: data.id, itemType: "package" });
                  updateCartQuantity({
                    id: data.id,
                    itemType: "package",
                    quantity: 1,
                  });
                  requireCustomerLogin({
                    redirectTo: "/store/checkout",
                    onAuthenticated: () => router.push("/store/checkout"),
                  });
                }}
                className="flex-1 rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] py-3 text-sm font-semibold text-white"
              >
                Get Package
              </button>
              <button
                onClick={() => toggleFavorite(data.id)}
                className="h-11 w-11 rounded-xl border border-[#E4E9EC] grid place-items-center"
              >
                <HeartIcon
                  filled={favorites.includes(data.id)}
                  className={favorites.includes(data.id) ? "text-[#E11D48]" : "text-[#3B3B3B]/60"}
                />
              </button>
            </div>

            <div className="mt-6  p-4 text-sm">
              <div className="flex items-center justify-between text-[#252C32] font-semibold">
                <span>Package/ Package Includes</span>
                <span onClick={() => setShowFeatures(!showFeatures)}>
                  {showFeatures ? <ChevronDown className="text-gray-500 w-5 h-5" /> : <ChevronUp className="text-gray-500 w-5 h-5" />}
                </span>
              </div>
              {
                showFeatures ? (
                  <div className="mt-3  text-[#5A646B]">
                    {data.packageIncludes.map((item) => (
                      <div key={item.label} className="flex justify-between py-3 border-b">
                        <span>{item.label}</span>
                        <span className="text-[#252C32]">{item.qty}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div />
                )
              }

            </div>

            <div className="mt-4 space-y-3">
              <div className="flex gap-4 text-xs rounded-xl bg-[#EBFAEB] p-3  text-[#3B3B3B]">
                <FinancingIcon />
                <div>
                  <p>Optional Financing Available</p>
                  <p className="hover:underline cursor-pointer">3 - 24 Months</p>
                </div>

              </div>
              <div className="mt-4 flex gap-4 text-xs rounded-xl bg-[#EBFAEB] p-3  text-[#3B3B3B]">
                <DeliveryIcon />
                <div>
                  <p>Free Delivery</p>
                  <p className="hover:underline cursor-pointer">Enter your postal code for Delivery Availability</p>
                </div>
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
          <h2 className="text-2xl font-semibold text-[#252C32]">
            Other Related Packages
          </h2>
          <Link
            href="/store/packages"
            className="rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] px-4 py-2 text-sm text-white"
          >
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
