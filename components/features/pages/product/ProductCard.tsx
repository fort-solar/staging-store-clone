import React from 'react'
import Link from 'next/link';
import HeartIcon from '@/components/features/icons/HeartIcon';
import { CartIcon } from '@/components/features/icons/CartIcon';
import { useGeneralStore } from '@/store/GeneralStore';
import type { CatalogId } from '@/types/common.types';

const ProductCard
  = ({
    id,
    title,
    mini_description,
    price,
    priceOriginal,
    image,
    availability,
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
    href: string;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
    onGetQuote?: () => void;
  }) => {
    const addToCart = useGeneralStore((state) => state.addToCart);
    return (
      <div className="group h-full bg-[#EBFAEB] p-2 rounded-xl overflow-hidden">
        <div className='bg-white flex flex-col h-full rounded-xl overflow-hidden'>
          <div
            className="relative z-10 w-full overflow-hidden rounded-[16px] bg-cover bg-center bg-no-repeat aspect-[4/3]"
            style={{ backgroundImage: `url(${image})` }}
          >
            <div className="hidden absolute lg:flex justify-between left-0 right-0 top-3 z-20  opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
              <div className={`text-sm font-medium rounded-md px-3 py-2 ${availability === "Out Of Stock" ? "bg-[#EF5350]" : availability === "Limited Stock" ? "bg-[#FFAD33]" : "bg-[#058A05]"}  text-white`}>
                {availability}
              </div>
              <div className="flex">
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    onToggleFavorite?.();
                  }}
                  className="h-9 w-9 rounded-l-md border-l bg-white/90 shadow-sm grid place-items-center hover:bg-white"
                >
                  <HeartIcon
                    filled={isFavorite}
                    className={isFavorite ? "text-[#E11D48]" : "text-[#E11D48]"}
                  />
                </button>
                <button
                  disabled={availability === "Out Of Stock" ? true : false}
                  onClick={(event) => {
                    event.preventDefault();
                    addToCart({ id, itemType: "product" });
                  }}
                  className={`disabled:opacity-50 disabled:cursor-not-allowed h-9 w-9 rounded-r-md bg-white/90 shadow-sm grid place-items-center hover:bg-white`}
                >
                  <CartIcon className="text-[#3B3B3B]/70 group-hover:text-[#058A05]" />
                </button>
              </div>

            </div>
            <div className="flex absolute lg:hidden justify-between left-0 right-0 top-3 z-20  transition-all duration-300 opacity-100 translate-y-0">
              <div className={`text-sm font-medium rounded-md px-3 py-2 ${availability === "Out Of Stock" ? "bg-[#EF5350]" : availability === "Limited Stock" ? "bg-[#FFAD33]" : "bg-[#058A05]"}  text-white`}>
                {availability}
              </div>
              <div className="flex">
                <button
                 disabled={availability === "Out Of Stock" ? true : false}
                  onClick={(event) => {
                    event.preventDefault();
                    onToggleFavorite?.();
                  }}
                  className="h-9 w-9 rounded-l-md border-l bg-white/90 shadow-sm grid place-items-center hover:bg-white"
                >
                  <HeartIcon
                    filled={isFavorite}
                    className={isFavorite ? "text-[#E11D48]" : "text-[#E11D48]"}
                  />
                </button>
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    addToCart({ id, itemType: "product" });
                  }}
                 className={`disabled:opacity-50 disabled:cursor-not-allowed h-9 w-9 rounded-r-md bg-white/90 shadow-sm grid place-items-center hover:bg-white`}
                >
                  <CartIcon className="text-[#3B3B3B]/70 group-hover:text-[#058A05]" />
                </button>
              </div>

            </div>
            <div></div>
            {/* <div className="absolute inset-0 bg-linear-to-t from-[#000000af] via-[#0000002a] to-[#00000000] z-0" /> */}
          </div>
          <div className='border-t border-[#9A9EA6] px-4 py-4 w-full flex flex-col flex-1 bg-white text-[#000000] space-y-2'>
            <p className="text-lg font-semibold font-poppins text-[#000000]">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs rounded-ful text-[#000000] font-bold">
                ₦{price.toLocaleString()}{" "}
                {priceOriginal > price ? (
                  <span className='text-[8px] text-[#FF0000] line-through decoration-[#FF0000] decoration-1'>
                    ₦{priceOriginal.toLocaleString()}
                  </span>
                ) : null}
              </p>
            </div>
            <p className='text-xs text-[#50555C]'>{mini_description}</p>
            <div className="flex gap-3 w-full mt-auto pt-2">
              <Link
                href={href}
                className='text-sm border border-[#50555C] rounded-lg py-2 w-full text-[#000000] text-center hover:text-[#2CB22C] cursor-pointer ring-0 hover:border-[#2CB22C]'
              >
                View Details
              </Link>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onGetQuote?.();
                }}
                className='text-sm rounded-lg py-2 w-full text-white bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] cursor-pointer ring-0 border border-[#2CB22C] hover:opacity-90'
              >
                Get Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

export default ProductCard
