/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { useGeneralStore } from "@/store/GeneralStore";
import { packages_dummy, products_dummy } from "@/components/features/constants";
import { DeliveryIcon } from "@/components/features/icons/DeliveryIcon";
import Link from "next/link";
import GetQuoteModal from "@/components/features/pages/product/GetQuoteModal";
import { getMockCurrentUser, getMockSession } from "@/lib/localAuth";
import { useRouter } from "next/navigation";

const formatNaira = (value: number) =>
  `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const CheckoutPage = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const session = useMemo(() => getMockSession(), []);
  const currentUser = useMemo(() => getMockCurrentUser(), []);
  const cartItems = useGeneralStore((state) => state.cartItems);
  const isAuthenticatedCustomer = !!session && session.role === "customer";

  useEffect(() => {
    if (!isAuthenticatedCustomer) {
      router.replace("/login");
    }
  }, [isAuthenticatedCustomer, router]);

  const cartDetails = useMemo(() => {
    return cartItems
      .map((item) => {
        const product =
          item.itemType === "product"
            ? products_dummy.find((p) => p.id === item.id)
            : packages_dummy.find((p) => p.id === item.id);
        if (!product) return null;
        return {
          ...item,
          title: product.title,
          price: product.price * 2930,
          image: product.image,
        };
      })
      .filter(Boolean) as Array<{
        id: number;
        itemType: "product" | "package";
        quantity: number;
        title: string;
        price: number;
        image: any;
      }>;
  }, [cartItems]);

  const subtotal = cartDetails.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = 168224;
  const tax = subtotal * 0.05;
  const discount = 50000;
  const total = subtotal + shipping + tax - discount;

  const quoteProducts = useMemo(() => {
    return cartDetails
      .filter((item) => item.itemType === "product")
      .map((item) => ({
      id: item.id,
      title: item.title,
      image: String(item.image),
      price: item.price / 2930,
      quantity: item.quantity,
    }));
  }, [cartDetails]);

  if (!isAuthenticatedCustomer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-24">
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="text-sm text-[#5A646B]">
          Store / Jinko 550W Monocrystalline Solar Panel / Checkout
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#252C32]">
                Shipping Info
              </h1>
              <div className="mt-4 rounded-2xl border border-[#E9EEF0] p-4">
                {[
                  { label: "Email", value: currentUser?.email ?? session?.email ?? "exampleuser32@email.com" },
                  { label: "Phone", value: currentUser?.phone ?? "+234 901 2624 183" },
                  {
                    label: "Ship To",
                    value: currentUser?.address ?? "No 21 Chindah Street, Agip Ada-George Port Harcourt, Rivers State",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="grid grid-cols-[1fr_6fr_1fr] border-b border-[#E9EEF0] py-3 text-sm"
                  >
                    <span className="text-[#5A646B]">{row.label}</span>
                    <span className="text-[#252C32] flex justify-start">{row.value}</span>
                    <button className="text-xs text-[#9AA5AC] flex justify-end">Change</button>
                  </div>
                ))}
                <div className="mt-6 flex items-center justify-between rounded-xl border border-[#058A0580] bg-[#EBFAEB] px-4 py-1 text-sm font-semibold text-[#058A05]">
                  <div className="flex items-center gap-2">
                    <DeliveryIcon className="w-6 h-6" />
                    Standard Shipping Within Nigeria
                  </div>
                  <span>(4-5 Working Days)</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#252C32]">
                Billing Address
              </h2>
              <p className="mt-1 text-sm text-[#5A646B]">
                Select the address that matches your card or payment details.
              </p>
              <div className="mt-4 rounded-2xl border border-[#E9EEF0] p-4">
                <label className="flex items-center gap-3 border-b border-[#E9EEF0] py-4 text-sm text-[#252C32]">
                  <input type="radio" name="billing" defaultChecked className="text-gray-500" />
                  Same as Shipping Address
                </label>
                <label className="flex items-center justify-between gap-3 py-4 text-sm text-[#252C32]">
                  <div className="flex items-center gap-3">
                    <input type="radio" name="billing" />
                    Use a Different Billing Address
                  </div>
                  <span className="text-[#9AA5AC]">⌄</span>
                </label>
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#E9EEF0] p-4">
              <p className="font-semibold text-[#252C32]">Summary</p>
              <div className="mt-4 space-y-4">
                {cartDetails.map((item, index) => (
                  <div key={`${item.itemType}-${item.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-xl bg-[#D9D9D9] bg-[url('/double_solar_panels.png')] bg-contain bg-center bg-no-repeat" >
                        <span className="absolute -right-2 -top-1 h-5 w-5 rounded-full bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] text-[10px] text-white grid place-items-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="text-[#252C32]">{item.title}</p>
                        <p className="font-semibold text-[#252C32]">
                          {formatNaira(item.price)}
                        </p>
                      </div>
                      <span className="text-xs text-[#9AA5AC]">
                        {index + 1}
                      </span>
                    </div>
                    {index !== cartDetails.length - 1 && (
                      <div className="mt-4 border-b border-[#E9EEF0]" />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3">
                <input
                  placeholder="Discount Code"
                  className="h-10 flex-1 rounded-lg border border-[#E4E9EC] px-3 text-sm"
                />
                <button className="h-10 rounded-lg bg-[#1FA21B] px-6 text-sm font-semibold text-white">
                  Apply
                </button>
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
                    {formatNaira(shipping)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Tax</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(tax)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Discount</span>
                  <span className="font-semibold text-[#252C32]">
                    -{formatNaira(discount)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-[#E9EEF0] pt-3">
                  <span className="font-semibold text-[#252C32]">Total</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(total)}
                  </span>
                </div>
              </div>

              <button className="mt-5 w-full rounded-xl bg-[#1FA21B] py-3 text-center font-semibold text-white">
                Continue
              </button>
              <button
                type="button"
                onClick={() => setIsQuoteModalOpen(true)}
                disabled={quoteProducts.length === 0}
                className="block mt-2 w-full rounded-xl border border-[#B0BABF] py-3 text-center font-semibold text-[#252C32]"
              >
               Get Quote
              </button>
              <div className="mt-20 text-sm text-[#5A646B]">
                <p className="mb-2">Good to know</p>
                <p className="font-semibold text-[#252C32]">
                  This Product Has a Package Package
                </p>
                <p className="mt-2">
                  Get this product as part of a complete solar setup that includes panels, batteries, and expert installation all optimized for performance and savings. Installation is completely free.  <Link
                    href="/store/packages"
                    className="inline-flex items-center gap-1 text-[#252C32] font-medium underline"
                  >
                    View the Package Package
                    <span>↗</span>
                  </Link> {" "}to see what’s included.
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

export default CheckoutPage;
