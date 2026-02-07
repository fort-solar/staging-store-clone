"use client";

import React, { useMemo, useState } from "react";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { useGeneralStore } from "@/store/GeneralStore";
import { packages_dummy, products_dummy } from "@/components/features/constants";
import Link from "next/link";
import { DeliveryIcon } from "@/components/features/icons/DeliveryIcon";
import { TrashIcon } from "@/components/features/icons/TrashIcon";

const formatNaira = (value: number) =>
  `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const CartPage = () => {
  const [query, setQuery] = useState("");
  const cartItems = useGeneralStore((state) => state.cartItems);
  const updateCartQuantity = useGeneralStore((state) => state.updateCartQuantity);
  const removeFromCart = useGeneralStore((state) => state.removeFromCart);

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
        };
      })
      .filter(Boolean) as Array<{
        id: number;
        itemType: "product" | "package";
        quantity: number;
        title: string;
        price: number;
      }>;
  }, [cartItems]);

  const subtotal = cartDetails.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalItems = cartDetails.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = 0;
  const tax = subtotal * 0.05;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-white py-24">
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-28 lg:py-2">
        <div className="text-sm text-[#5A646B]">Store / Cart</div>
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
                        <select
                          value={item.quantity}
                          onChange={(event) =>
                            updateCartQuantity({
                              id: item.id,
                              itemType: item.itemType,
                              quantity: Number(event.target.value),
                            })
                          }
                          className="h-8 w-16 rounded-md border border-[#E4E9EC] text-sm"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((qty) => (
                            <option key={qty} value={qty}>
                              {qty}
                            </option>
                          ))}
                        </select>
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

            <div className="mt-6 flex flex-col lg:flex-row items-center lg:justify-between rounded-xl border border-[#058A0580] bg-[#EBFAEB] px-4 py-1 text-sm font-semibold text-[#058A05]">
              <div className="flex items-center gap-2">
                <DeliveryIcon className="w-6 h-6" />
                Standard Shipping Within Nigeria
              </div>
              <span>(4-5 Working Days)</span>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#E9EEF0] p-4">
              <div className="rounded-xl shadow-sm bg-[#B8C0CC14] p-4">
                <div className="flex items-center justify-between border-b py-4">
                  <span className="text-sm text-[#5A646B]">Sub Total</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b py-4">
                  <span className="text-sm text-[#5A646B]">Shipping</span>
                  <span className="rounded-md bg-[#EBFAEB] px-2 py-1 text-xs text-[#058A05]">
                    Free
                  </span>
                </div>
                <div className="flex items-center justify-between border-b py-4 border-[#E9EEF0] pb-3">
                  <span className="text-sm text-[#5A646B]">Tax</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(tax)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-4">
                  <span className="font-semibold text-[#252C32]">Total</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(total)}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Link
                  href="/dashboard/checkout"
                  className="block w-full rounded-xl bg-[#1FA21B] py-3 text-center text-white font-semibold"
                >
                  Checkout
                </Link>
                <Link
                  href="/dashboard/products"
                  className="block w-full rounded-xl border border-[#B0BABF] py-3 text-center font-semibold text-[#252C32]"
                >
                  Continue Shopping
                </Link>
              </div>

              <div className="mt-20 text-sm text-[#5A646B]">
                <p className="mb-2">Good to know</p>
                <p className="font-semibold text-[#252C32]">
                  This Product Has a Package Package
                </p>
                <p className="mt-2">
                  Get this product as part of a complete solar setup that includes panels, batteries, and expert installation all optimized for performance and savings. Installation is completely free.  <Link
                    href="/dashboard/packages"
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
    </div>
  );
};

export default CartPage;
