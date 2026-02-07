import React from 'react';
import Link from 'next/link';
import HeartIcon from '@/components/features/icons/HeartIcon';
import { CartIcon } from '@/components/features/icons/CartIcon';
import { useGeneralStore } from '@/store/GeneralStore';

const ProductListCard = ({
  id,
  title,
  mini_description,
  image,
  href,
  isFavorite = false,
  onToggleFavorite,
}: {
  id: number;
  title: string;
  mini_description: string;
  price: number;
  image: string;
  availability: string;
  warrantyYears: number;
  href: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) => {
  const addToCart = useGeneralStore((state) => state.addToCart);
  return (
    <div className="group overfow-hidden flex flex-col sm:flex-row gap-8 rounded-lg border border-[#E6EFE6] bg-white  shadow-sm hover:border-[#058A05] transition-colors">
      <div
        className="relative h-20 w-full sm:w-56 rounded-lg bg-contain bg-bottom"
        style={{ backgroundImage: `url(${image})` }}
      >
        <div className="absolute right-2 top-2 z-20 flex gap-2 opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          <button
            onClick={(event) => {
              event.preventDefault();
              onToggleFavorite?.();
            }}
            className="h-8 w-8 rounded-md bg-white/90 shadow-sm grid place-items-center hover:bg-white"
          >
            <HeartIcon
              filled={isFavorite}
              className={isFavorite ? "text-[#E11D48]" : "text-[#3B3B3B]/70"}
            />
          </button>
          <button
            onClick={(event) => {
              event.preventDefault();
              addToCart({ id, itemType: "product" });
            }}
            className="h-8 w-8 rounded-md bg-white/90 shadow-sm grid place-items-center hover:bg-white"
          >
            <CartIcon className="text-[#3B3B3B]/70 group-hover:text-[#058A05]" />
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-1 p-5 lg:p-2">
        <div className='flex gap-2 lg:gap-0 flex-col lg:flex-row lg:justify-between lg:items-center'>
          <p className="order-2  lg:order-1 text-lg font-bold text-[#252C32]">{title}</p>
          <Link
            href={href}
            className="text-sm order-1 lg:order-2 border border-[#BFE8BF] rounded-xl py-1 px-2 text-[#058A05] text-center hover:bg-[#EBFAEB]"
          >
            View Details
          </Link>
        </div>
        <p className="text-sm text-[#5A646B]">{mini_description}</p>
      </div>
    </div>
  );
};

export default ProductListCard;
