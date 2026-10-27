import React from 'react';
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

const ProductListCard = ({
  id,
  title,
  mini_description,
  image,
  href,
  isFavorite = false,
  onToggleFavorite,
  onGetQuote,
  availability,
  stockQuantity,
}: {
  id: CatalogId;
  title: string;
  mini_description: string;
  price: number;
  image: string;
  availability: string;
  stockQuantity: number;
  warrantyYears: number;
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
    <div className="group overflow-hidden flex flex-col sm:flex-row gap-8 rounded-lg border border-[#E6EFE6] dark:border-slate-800 bg-white dark:bg-[#0e1726] shadow-sm hover:border-[#048A05] transition-colors">
      <div
        className="relative aspect-[4/3] w-full rounded-lg bg-cover bg-center bg-no-repeat sm:w-44 sm:shrink-0 bg-slate-100 dark:bg-slate-800"
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="absolute right-2 top-2 z-20 flex gap-2 opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          <button
            onClick={(event) => {
              event.preventDefault();
              onToggleFavorite?.();
            }}
            className="h-8 w-8 rounded-md bg-white/90 dark:bg-slate-800/90 shadow-sm grid place-items-center hover:bg-white dark:hover:bg-slate-800"
          >
            <HeartIcon
              filled={isFavorite}
              className={isFavorite ? "text-[#E11D48]" : "text-slate-600 dark:text-slate-300"}
            />
          </button>
          <button
            disabled={isAddToCartDisabled}
            onClick={(event) => {
              event.preventDefault();
              addToCart({ id, itemType: "product" });
            }}
            className="grid h-8 w-8 place-items-center rounded-md bg-white/90 dark:bg-slate-800/90 shadow-sm hover:bg-white dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CartIcon className="text-slate-600 dark:text-slate-300 group-hover:text-[#048A05]" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1 p-5 lg:p-2">
        <div className='flex gap-2 lg:gap-0 flex-col lg:flex-row lg:justify-between lg:items-center'>
          <p className="order-2 lg:order-1 text-lg font-bold text-[#252C32] dark:text-white">{title}</p>
          <div className="order-1 lg:order-2 flex items-center gap-2">
            <Link
              href={href}
              className="text-sm border border-[#BFE8BF] dark:border-[#048A05]/40 rounded-xl py-1 px-2 text-[#048A05] dark:text-[#2CB22C] text-center hover:bg-[#EBFAEB] dark:hover:bg-[#048A05]/20 transition-colors"
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
              className="text-sm rounded-xl border border-[#2CB22C] bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#048A05_110.95%)] px-3 py-1 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cartQuantity > 0 ? `In Cart (${cartQuantity})` : 'Add to Cart'}
            </button>
          </div>
        </div>
        <p className="text-sm text-[#5A646B] dark:text-slate-400">{cardDescription}</p>
      </div>
    </div>
  );
};

export default ProductListCard;
