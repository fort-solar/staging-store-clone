import React from 'react'
import Link from 'next/link';
import HeartIcon from '@/components/features/icons/HeartIcon';
import { CartIcon } from '@/components/features/icons/CartIcon';
import { useGeneralStore } from '@/store/GeneralStore';
import type { CatalogId } from '@/types/common.types';

function truncateCardDescription(value: string, limit = 200) {
  const normalized = value.trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit).trimEnd()}...`;
}

const ProductCard
  = ({
    id,
    title,
    mini_description,
    price,
    priceOriginal,
    image,
    availability,
    stockQuantity,
    href,
    isFavorite = false,
    onToggleFavorite,
    onGetQuote,
  }: {
    id: CatalogId;
    title: string;
    mini_description: string;
    price: number;
    priceOriginal: number;
    image: string;
    availability: string;
    stockQuantity: number;
    href: string;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
    onGetQuote?: () => void;
  }) => {
    const addToCart = useGeneralStore((state) => state.addToCart);
    const cartQuantity = useGeneralStore(
      (state) =>
        Array.isArray(state?.cartItems)
          ? state.cartItems.find((item) => item?.itemType === "product" && String(item?.id) === String(id))?.quantity ?? 0
          : 0,
    );
    const cardDescription = truncateCardDescription(mini_description);
    const isAddToCartDisabled =
      availability === "Out Of Stock" || (stockQuantity > 0 && cartQuantity >= stockQuantity);
    return (
      <div className="group h-full bg-[#EBFAEB] dark:bg-[#048A05]/15 p-2 rounded-xl overflow-hidden border border-transparent dark:border-[#048A05]/20">
        <div className='bg-white dark:bg-[#0e1726] flex flex-col h-full rounded-xl overflow-hidden border border-transparent dark:border-slate-800 shadow-sm'>
          <div
            className="relative z-10 w-full overflow-hidden rounded-[16px] bg-slate-100 dark:bg-slate-800 bg-cover bg-center bg-no-repeat aspect-[4/3]"
            style={{ backgroundImage: `url(${image})` }}
          >
            <div className="hidden absolute lg:flex justify-between left-0 right-0 top-3 z-20  opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
              <div className={`text-sm font-medium rounded-md px-3 py-2 ${availability === "Out Of Stock" ? "bg-[#EF5350]" : availability === "Limited Stock" ? "bg-[#FFAD33]" : "bg-[#048A05]"}  text-white`}>
                {availability}
              </div>
              <div className="flex">
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    onToggleFavorite?.();
                  }}
                  className="h-9 w-9 rounded-l-md border-l border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 shadow-sm grid place-items-center hover:bg-white dark:hover:bg-slate-800"
                >
                  <HeartIcon
                    filled={isFavorite}
                    className={isFavorite ? "text-[#E11D48]" : "text-[#E11D48]"}
                  />
                </button>
                <button
                  disabled={isAddToCartDisabled}
                  onClick={(event) => {
                    event.preventDefault();
                    addToCart({ id, itemType: "product" });
                  }}
                  className={`disabled:opacity-50 disabled:cursor-not-allowed h-9 w-9 rounded-r-md bg-white/90 dark:bg-slate-800/90 shadow-sm grid place-items-center hover:bg-white dark:hover:bg-slate-800`}
                >
                  <CartIcon className="text-slate-600 dark:text-slate-300 group-hover:text-[#048A05]" />
                </button>
              </div>

            </div>
            <div className="flex absolute lg:hidden justify-between left-0 right-0 top-3 z-20  transition-all duration-300 opacity-100 translate-y-0">
              <div className={`text-sm font-medium rounded-md px-3 py-2 ${availability === "Out Of Stock" ? "bg-[#EF5350]" : availability === "Limited Stock" ? "bg-[#FFAD33]" : "bg-[#048A05]"}  text-white`}>
                {availability}
              </div>
              <div className="flex">
                <button
                 disabled={availability === "Out Of Stock" ? true : false}
                  onClick={(event) => {
                    event.preventDefault();
                    onToggleFavorite?.();
                  }}
                  className="h-9 w-9 rounded-l-md border-l border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 shadow-sm grid place-items-center hover:bg-white dark:hover:bg-slate-800"
                >
                  <HeartIcon
                    filled={isFavorite}
                    className={isFavorite ? "text-[#E11D48]" : "text-[#E11D48]"}
                  />
                </button>
                <button
                  disabled={isAddToCartDisabled}
                  onClick={(event) => {
                    event.preventDefault();
                    addToCart({ id, itemType: "product" });
                  }}
                 className={`disabled:opacity-50 disabled:cursor-not-allowed h-9 w-9 rounded-r-md bg-white/90 dark:bg-slate-800/90 shadow-sm grid place-items-center hover:bg-white dark:hover:bg-slate-800`}
                >
                  <CartIcon className="text-slate-600 dark:text-slate-300 group-hover:text-[#048A05]" />
                </button>
              </div>

            </div>
            <div></div>
          </div>
          <div className='border-t border-[#9A9EA6]/30 dark:border-slate-800 px-4 py-4 w-full flex flex-col flex-1 bg-white dark:bg-[#0e1726] text-slate-900 dark:text-slate-100 space-y-2'>
            <p className="text-lg font-semibold font-poppins text-slate-900 dark:text-white">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                ₦{price.toLocaleString()}{" "}
                {priceOriginal > price ? (
                  <span className='text-[10px] text-rose-500 line-through decoration-rose-500 font-normal'>
                    ₦{priceOriginal.toLocaleString()}
                  </span>
                ) : null}
              </p>
            </div>
            <p className='text-xs text-slate-600 dark:text-slate-400'>{cardDescription}</p>
            <div className="flex gap-3 w-full mt-auto pt-2">
              <Link
                href={href}
                className='text-sm border border-slate-300 dark:border-slate-700 rounded-lg py-2 w-full text-slate-800 dark:text-slate-200 text-center hover:text-[#2CB22C] dark:hover:text-[#2CB22C] hover:border-[#2CB22C] dark:hover:border-[#2CB22C] transition-colors cursor-pointer'
              >
                View Details
              </Link>
              <button
                type="button"
                disabled={isAddToCartDisabled}
                onClick={(event) => {
                  event.preventDefault();
                  addToCart({ id, itemType: "product" });
                }}
                className='text-sm rounded-lg py-2 w-full text-white bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] cursor-pointer ring-0 border border-[#2CB22C] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {cartQuantity > 0 ? `In Cart (${cartQuantity})` : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

export default ProductCard
