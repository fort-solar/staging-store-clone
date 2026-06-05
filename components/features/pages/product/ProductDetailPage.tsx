"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Share2 } from "lucide-react";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { CartIcon } from "@/components/features/icons/CartIcon";
import HeartIcon from "@/components/features/icons/HeartIcon";
import { DeliveryIcon } from "@/components/features/icons/DeliveryIcon";
import ProductsGrid from "@/components/features/pages/product/ProductsGrid";
import GetQuoteModal from "@/components/features/pages/product/GetQuoteModal";
import EmptyStatePanel from "@/components/ui/empty-state-panel";
import { useCustomerFavoriteToggle } from "@/hooks/use-customer-favorite-toggle";
import { useCustomerLoginGate } from "@/hooks/use-customer-login-gate";
import {
  STORE_PAGE_SIZE,
  useStoreProductById,
  useStoreProducts,
} from "@/lib/store-catalog";
import { clampCartQuantity, getProductCartMaxQuantity } from "@/lib/cart";
import { useGeneralStore } from "@/store/GeneralStore";
import type { CatalogId } from "@/types/common.types";

type QuoteProduct = {
  id: CatalogId;
  title: string;
  image: string;
  price: number;
};

const ProductDetailPage = () => {
  const params = useParams<{ id: string }>();
  const [query, setQuery] = useState("");
  const [showFeatures, setShowFeatures] = useState(true);
  const [quoteProduct, setQuoteProduct] = useState<QuoteProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const router = useRouter();
  const id = params?.id;
  const { product, isLoading } = useStoreProductById(id);
  const {
    items: productSuggestions,
  } = useStoreProducts({
    page: 1,
    limit: STORE_PAGE_SIZE,
    isActive: true,
    categoryId: product?.categoryId || undefined,
  });

  const addToCart = useGeneralStore((state) => state.addToCart);
  const updateCartQuantity = useGeneralStore((state) => state.updateCartQuantity);
  const favorites = useGeneralStore((state) => state.favorites.products);
  const { toggleProductFavorite } = useCustomerFavoriteToggle();
  const { requireCustomerLogin } = useCustomerLoginGate();

  const activeImage = selectedImage || product?.image || "";
  const maxProductQuantity = product ? getProductCartMaxQuantity(product) ?? 1 : 1;
  const isOutOfStock = !product || product.availability === "Out Of Stock" || product.stockQuantity <= 0;
  const normalizedQuantity = clampCartQuantity(quantity, maxProductQuantity);
  const relatedProducts = useMemo(
    () =>
      productSuggestions.filter((item) => String(item.id) !== String(id)).slice(0, 3),
    [id, productSuggestions],
  );

  if (isLoading && !product) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <DashboardHeader query={query} onQueryChange={setQuery} />
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <EmptyStatePanel
            title="Loading product details"
            description="We are fetching the latest product information for this page."
            className="min-h-64"
          />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <DashboardHeader query={query} onQueryChange={setQuery} />
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <EmptyStatePanel
            title="Product not found"
            description="This product is unavailable or no longer exists in the store catalog."
            className="min-h-64"
          />
        </div>
      </div>
    );
  }

  const datasheetKind = product.datasheet?.kind || null;
  const specRows = product.sectionValues?.length ? product.sectionValues : product.quickSpecs;
  const totalPrice = product.price * normalizedQuantity;
  const totalOriginalPrice = product.priceOriginal * normalizedQuantity;
  const deliveryWarrantyInfo =
    product.deliveryWarrantyInfo ||
    (product.freeDelivery
      ? `This product qualifies for free delivery and includes a ${product.warrantyYears}-year performance warranty.`
      : `This product includes a ${product.warrantyYears}-year performance warranty. Delivery charges may apply.`);

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareFeedback("Link copied.");
    } catch {
      setShareFeedback("Unable to copy the link right now.");
    }

    window.setTimeout(() => {
      setShareFeedback(null);
    }, 2200);
  }

  return (
    <div className="min-h-screen bg-white py-24">
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto mt-26 w-full max-w-6xl px-4 lg:mt-0">
        <button onClick={() => router.back()} className="flex cursor-pointer items-center gap-2 text-sm text-[#5A646B]">
          <span className="text-lg">←</span>
          <span>Back</span>
        </button>

        <div className="mt-4 text-sm text-[#5A646B]">
          Home / Products / {product.categoryLabel || "Product Category"} /{" "}
          <span className="text-[#252C32]">{product.title}</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[88px_1fr]">
              <div className="flex gap-3 lg:flex-col">
                {product.images.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`h-20 w-20 overflow-hidden rounded-lg border ${activeImage === img ? "border-[#058A05]" : "border-[#E9EEF0]"} bg-[#F3F4F6]`}
                  >
                    <img src={img} alt={`${product.title} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center rounded-2xl bg-[#F3F4F6] p-6">
                <img src={activeImage} alt={product.title} className="h-96 w-full rounded-2xl object-contain" />
              </div>
            </div>

            <div className="mt-8 space-y-6 rounded-2xl border bg-[#B8C0CC33] p-6">
              <div>
                <h2 className="text-xl font-semibold text-[#101828]">Product Description</h2>
                <p className="mt-2 text-sm text-[#333333]">{product.description}</p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#101828]">Delivery & Warranty Info</h3>
                <p className="mt-2 text-sm text-[#333333]">{deliveryWarrantyInfo}</p>
              </div>

              <div className="w-fit max-w-xs rounded-2xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] p-4 text-white">
                <p className="font-semibold">Looking for a full solar solution?</p>
                <p className="mt-2 text-sm">This product is included in one of our recommended packages.</p>
                <Link href="/packages" className="mt-4 inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm text-[#1FA21B] hover:opacity-90">
                  View Packages
                </Link>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-[#101828]">Product Details Gallery or Showcase</h3>
                  {product.datasheet?.url ? (
                    <a href={product.datasheet.url} target="_blank" rel="noreferrer" className="rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] px-4 py-2 text-sm text-white">
                      Download Datasheet
                    </a>
                  ) : null}
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4">
                  {product.datasheet?.url ? (
                    datasheetKind === "image" ? (
                      <img src={product.datasheet.url} alt={`${product.title} datasheet`} className="h-80 w-full rounded-xl object-contain" />
                    ) : datasheetKind === "pdf" ? (
                      <iframe src={product.datasheet.url} title={`${product.title} datasheet`} className="h-80 w-full rounded-xl border border-[#E4E9EC]" />
                    ) : (
                      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[#E4E9EC] bg-[#F8F9FA] text-sm text-[#5A646B]">
                        This datasheet can be downloaded in a new tab.
                      </div>
                    )
                  ) : (
                    <EmptyStatePanel
                      title="No datasheet available"
                      description="This product does not have a published datasheet yet."
                      className="min-h-48 rounded-xl px-5 py-8"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-end">
              <span className={`text-sm ${product.availability === "Out Of Stock" ? "text-[#EF5350]" : product.availability === "Limited Stock" ? "text-[#FFAD33]" : "text-[#1FA21B]"}`}>
                {product.availability}
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-semibold text-[#252C32]">{product.title}</h1>
            <p className="mt-2 text-sm text-[#5A646B]">{product.mini_description}</p>

            <div className="mt-4 flex w-fit items-center gap-3 overflow-hidden rounded-sm border">
              <button
                disabled={isOutOfStock}
                onClick={() => setQuantity((prev) => clampCartQuantity(prev - 1, maxProductQuantity))}
                className="h-9 w-9 border-r border-[#E4E9EC] text-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={maxProductQuantity}
                value={normalizedQuantity}
                onChange={(event) =>
                  setQuantity(
                    clampCartQuantity(Number(event.target.value), maxProductQuantity),
                  )
                }
                className="h-9 w-16 border-0 text-center outline-none"
              />
              <button
                disabled={isOutOfStock || normalizedQuantity >= maxProductQuantity}
                onClick={() =>
                  setQuantity((prev) => clampCartQuantity(prev + 1, maxProductQuantity))
                }
                className="h-9 w-9 border-l border-[#E4E9EC] bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] text-lg text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-xl font-semibold text-[#252C32]">
                ₦{totalPrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </span>
              {product.priceOriginal > product.price ? (
                <span className="text-sm text-[#9AA5AC] line-through">
                  ₦{totalOriginalPrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
              ) : null}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  setQuoteProduct({
                    id: product.id,
                    title: product.title,
                    image: product.image,
                    price: product.price,
                  });
                }}
                className="block w-full rounded-xl bg-[#1FA21B] py-3 text-center font-semibold text-white"
              >
                Get Quote
              </button>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  addToCart({ id: product.id, itemType: "product" });
                  updateCartQuantity({
                    id: product.id,
                    itemType: "product",
                    quantity: normalizedQuantity,
                  });
                  requireCustomerLogin({
                    redirectTo: "/checkout",
                    onAuthenticated: () => router.push("/checkout"),
                  });
                }}
                className="flex-1 rounded-xl border border-[#B0BABF] py-3 text-center font-semibold text-[#252C32] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buy Now
              </button>
              <button
                disabled={isOutOfStock}
                onClick={() => {
                  addToCart({ id: product.id, itemType: "product" });
                  updateCartQuantity({
                    id: product.id,
                    itemType: "product",
                    quantity: normalizedQuantity,
                  });
                }}
                className="grid h-11 w-11 place-items-center rounded-xl border border-[#E4E9EC] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CartIcon className="text-[#3B3B3B]/70" />
              </button>
              <button onClick={() => toggleProductFavorite(product.id)} className="grid h-11 w-11 place-items-center rounded-xl border border-[#E4E9EC]">
                <HeartIcon filled={favorites.includes(product.id)} className={favorites.includes(product.id) ? "text-[#E11D48]" : "text-[#3B3B3B]/60"} />
              </button>
            </div>

            <div className="mt-6 p-4 text-xs">
              <div className="flex items-center justify-between font-semibold text-[#252C32]">
                <span>Product Highlights / Quick Specs</span>
                <span onClick={() => setShowFeatures(!showFeatures)}>
                  {showFeatures ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronUp className="h-5 w-5 text-gray-500" />}
                </span>
              </div>
              {showFeatures ? (
                <div className="mt-3 text-[#5A646B]">
                  {specRows.map((spec) => (
                    <div key={spec.label} className="flex justify-between border-b py-3">
                      <span>{spec.label}</span>
                      <span className="text-[#252C32]">{spec.value}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex gap-4 rounded-xl bg-[#EBFAEB] p-3 text-xs text-[#3B3B3B]">
              <DeliveryIcon />
              <div>
                <p>{product.freeDelivery ? "Free Delivery" : "Delivery Available"}</p>
                <p>{deliveryWarrantyInfo}</p>
              </div>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#D0D5DD] px-4 py-2 text-sm font-medium text-[#3B3B3B] transition-colors hover:border-[#058A05] hover:text-[#058A05]"
              >
                <Share2 className="h-4 w-4" />
                Share Product
              </button>
              {shareFeedback ? (
                <p className="mt-2 text-xs text-[#058A05]">{shareFeedback}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[#252C32]">Other Related Products</h2>
          <Link href="/products" className="rounded-xl bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] px-4 py-2 text-sm text-white">
            View All Products
          </Link>
        </div>
        <div className="mt-6">
          <ProductsGrid
            items={relatedProducts}
            view="grid"
            favorites={favorites}
            onToggleFavorite={toggleProductFavorite}
            onGetQuote={(item) =>
              setQuoteProduct({
                id: item.id,
                title: item.title,
                image: item.image,
                price: item.price,
              })
            }
          />
        </div>
      </div>

      {quoteProduct ? (
        <GetQuoteModal open={Boolean(quoteProduct)} product={quoteProduct} onClose={() => setQuoteProduct(null)} />
      ) : null}
    </div>
  );
};

export default ProductDetailPage;
