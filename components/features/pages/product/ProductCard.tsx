import React from 'react'
import Link from 'next/link';
import HeartIcon from '@/components/features/icons/HeartIcon';
import { CartIcon } from '@/components/features/icons/CartIcon';
import { useGeneralStore } from '@/store/GeneralStore';

const ProductCard
  = ({
    id,
    title,
    mini_description,
    price,
    image,
    availability,
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
    href: string;
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
  }) => {
    const addToCart = useGeneralStore((state) => state.addToCart);
    return (
      <div className="group h-80 bg-[#EBFAEB] p-2 rounded-xl">
        <div
          className="relative rounded-lg overflow-hidden bg-cover bg-center h-full z-10"
          style={{ backgroundImage: `url(${image})` }}
        >
          <div className="absolute right-3 top-3 z-20 flex gap-2 opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <button
              onClick={(event) => {
                event.preventDefault();
                onToggleFavorite?.();
              }}
              className="h-9 w-9 rounded-md bg-white/90 shadow-sm grid place-items-center hover:bg-white"
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
              className="h-9 w-9 rounded-md bg-white/90 shadow-sm grid place-items-center hover:bg-white"
            >
              <CartIcon className="text-[#3B3B3B]/70 group-hover:text-[#058A05]" />
            </button>
          </div>

          <div className='absolute px-4 bottom-3 z-10 w-full flex flex-col items-start space-y-2'>
            <div className="flex items-center gap-2">
              <span className="text-xs rounded-full px-2 py-1 bg-white/15 text-white border border-white/30">
                {availability}
              </span>
              <span className="text-xs rounded-full px-2 py-1 bg-white/15 text-white border border-white/30">
                ${price.toLocaleString()}
              </span>
            </div>
            <p className="text-lg font-semibold font-poppins text-white">{title}</p>
            <p className='text-xs text-white'> {mini_description}</p>
            <div className="flex gap-3 w-full">
              <Link
                href={href}
                className='text-sm border border-white rounded-lg py-2 w-full text-white text-center hover:bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] cursor-pointer ring-0 hover:border-[#2CB22C]'
              >
                View Details
              </Link>
              <button className='text-sm rounded-lg py-2 w-full text-white bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] cursor-pointer ring-0 border border-[#2CB22C] hover:opacity-90'>
                Get Quote
              </button>
            </div>
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-[#000000af] via-[#0000002a] to-[#00000000] z-0" />
        </div>
      </div>
    )
  }

export default ProductCard
