"use client";

import React, { useMemo, useState } from "react";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { products_dummy } from "@/components/features/constants";
import { useGeneralStore } from "@/store/GeneralStore";
import { CartIcon } from "@/components/features/icons/CartIcon";
import HeartIcon from "@/components/features/icons/HeartIcon";
import ProductsGrid from "@/components/features/pages/product/ProductsGrid";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DeliveryIcon } from "@/components/features/icons/DeliveryIcon";
import { useRouter } from "next/navigation";
import { FaTiktok, FaYoutube, FaInstagram, FaFacebook, FaLinkedin, FaShare } from 'react-icons/fa';

const ProductDetailPage = () => {
  const [query, setQuery] = useState("");
  const [showFeatures, setShowFeatures] = useState(false)
  const [quantity, setQuantity] = useState(1);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const product = useMemo(
    () => products_dummy.find((item) => String(item.id) === id),
    [id]
  );

  const addToCart = useGeneralStore((state) => state.addToCart);
  const updateCartQuantity = useGeneralStore(
    (state) => state.updateCartQuantity
  );
  const favorites = useGeneralStore((state) => state.favorites.products);
  const toggleFavorite = useGeneralStore((state) => state.toggleFavoriteProduct);

  if (!product) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <DashboardHeader query={query} onQueryChange={setQuery} />
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <p className="text-[#252C32]">Product not found.</p>
        </div>
      </div>
    );
  }

  const relatedProducts = products_dummy.filter((item) => String(item.id) !== id).slice(0, 3);

  return (
    <div className="min-h-screen bg-white py-24">
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto w-full max-w-6xl px-4">
        <button
          onClick={() => router.back()}
          className="flex cursor-pointer items-center gap-2 text-sm text-[#5A646B]"
        >
          <span className="text-lg">←</span>
          <span>Back</span>
        </button>


        <div className="mt-4 text-sm text-[#5A646B]">
          Home / Store / Product Category /{" "}
          <span className="text-[#252C32]">{product.title}</span>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-[88px_1fr] gap-4">
              <div className="flex lg:flex-col gap-3">
                {product.images.map((img, index) => (
                  <div
                    key={`${img}-${index}`}
                    className="h-20 w-20 rounded-lg border border-[#E9EEF0] bg-[#F3F4F6]"
                  />
                ))}
              </div>
              <div className="rounded-2xl bg-[#F3F4F6] p-6 flex items-center justify-center">
                <div className="h-96 w-full rounded-2xl bg-[url('/double_solar_panels.png')] bg-contain bg-center bg-no-repeat" />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-8">
              <div className="space-y-6">
                <div className="rounded-2xl border bg-[#B8C0CC33] p-6">
                  <h2 className="text-xl font-semibold text-[#101828]">
                    Product Description
                  </h2>
                  <p className="mt-2 text-sm text-[#333333]">
                    {product.description}
                  </p>

                  <h3 className="mt-6 text-xl font-semibold text-[#101828]">
                    Delivery & Warranty Info
                  </h3>
                  <p className="mt-2 text-sm text-[#333333]">
                    Enjoy free nationwide delivery on bulk orders and a{" "}
                    {product.warrantyYears}-year performance warranty.
                  </p>

                  <div className="mt-6 rounded-2xl w-fit max-w-xs bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] p-4 text-white">
                    <p className="font-semibold">Looking for a full solar solution?</p>
                    <p className="mt-2 text-sm">
                      This product is included in one of our recommended Packages.
                    </p>
                    <Link
                      href="/dashboard/packages"
                      className="mt-4 inline-flex items-center rounded-lg bg-white text-[#1FA21B] cursor-pointer hover:opacity-90 px-4 py-2 text-sm"
                    >
                      View Packages
                    </Link>
                  </div>

                  <h3 className="mt-6 text-xl font-semibold text-[#101828]">
                    Product Details Gallery or Showcase
                  </h3>
                  <div className="mt-4 h-48 rounded-xl bg-white" />
                  <div className="grid grid-cols-2 gap-5">
                    <div className="mt-4 h-48 rounded-xl bg-white" />
                    <div className="mt-4 h-48 rounded-xl bg-white" />
                  </div>

                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#F59E0B]">
                {"★★★★★"}
                <span className="text-[#5A646B]">
                  ({product.reviewsCount} Reviews)
                </span>
              </div>
              <span className="text-sm text-[#1FA21B]">{product.availability}</span>
            </div>
            <div className="mt-2">
              <h1 className="text-2xl font-semibold text-[#252C32]">
                {product.title}
              </h1>
            </div>
            <p className="mt-2 text-sm text-[#5A646B]">{product.description}</p>

            <div className="mt-4 flex items-center gap-3 border w-fit rounded-sm overflow-hidden">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="h-9 w-9 border-r border-[#E4E9EC] text-lg"
              >
                -
              </button>
              <span className="min-w-8 text-center ">{quantity}</span>
              <button
                onClick={() => setQuantity((prev) => prev + 1)}
                className="h-9 w-9  border-l border-[#E4E9EC] text-lg text-white bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)]"
              >
                +
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-xl font-semibold text-[#252C32]">
                ₦{(product.price * 2930).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-sm text-[#9AA5AC] line-through">
                ₦{(product.priceOriginal * 2930).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  addToCart({ id: product.id, itemType: "product" });
                  updateCartQuantity({
                    id: product.id,
                    itemType: "product",
                    quantity,
                  });
                }}
                className="flex-1 rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] py-3 text-sm font-semibold text-white"
              >
                Buy Now
              </button>
              <button
                onClick={() => {
                  addToCart({ id: product.id, itemType: "product" });
                  updateCartQuantity({
                    id: product.id,
                    itemType: "product",
                    quantity,
                  });
                }}
                className="h-11 w-11 rounded-xl border border-[#E4E9EC] grid place-items-center"
              >
                <CartIcon className="text-[#3B3B3B]/70" />
              </button>
              <button
                onClick={() => toggleFavorite(product.id)}
                className="h-11 w-11 rounded-xl border border-[#E4E9EC] grid place-items-center"
              >
                <HeartIcon
                  filled={favorites.includes(product.id)}
                  className={favorites.includes(product.id) ? "text-[#E11D48]" : "text-[#3B3B3B]/60"}
                />
              </button>
            </div>

            <div className="mt-6  p-4 text-xs">
              <div className="flex items-center justify-between text-[#252C32] font-semibold">
                <span>Product Highlights / Quick Specs</span>
                <span onClick={() => setShowFeatures(!showFeatures)}>
                  {showFeatures ? <ChevronDown className="text-gray-500 w-5 h-5" /> : <ChevronUp className="text-gray-500 w-5 h-5"/>}
                </span>
              </div>
              {
                showFeatures ? (
                  <div className="mt-3 text-[#5A646B]">
                    <div className="flex justify-between py-3 border-b">
                      <span>Feature</span>
                      <span>Value</span>
                    </div>
                    {product.quickSpecs.map((spec) => (
                      <div key={spec.label} className="flex justify-between py-3 border-b">
                        <span>{spec.label}</span>
                        <span className="text-[#252C32]">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div />
                )
              }

            </div>

            <div className="mt-4 flex gap-4 text-xs rounded-xl bg-[#EBFAEB] p-3  text-[#3B3B3B]">
              <DeliveryIcon />
              <div>
                <p>Free Delivery</p>
                <p className="hover:underline cursor-pointer">Enter your postal code for Delivery Availability</p>
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
          <h2 className="text-3xl font-semibold text-[#252C32]">
            Other Related Products
          </h2>
          <Link
            href="/dashboard/products"
            className="rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] px-4 py-2 text-sm text-white"
          >
            View all Panels
          </Link>
        </div>
        <div className="mt-6">
          <ProductsGrid
            items={relatedProducts}
            view="grid"
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
