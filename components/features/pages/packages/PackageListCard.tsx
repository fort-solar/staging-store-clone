import React from 'react';
import Image from 'next/image';
import { SlantedArrow } from "@/components/features/icons/SlantedArrow";
import Link from 'next/link';

const PackageListCard = ({
  title,
  mini_description,
  image,
  price,
  priceOriginal,
  discountPercentage,
  href,
}: {
  title: string;
  mini_description: string;
  image: string;
  price: number;
  availability: string;
  priceOriginal?: number;
  discountPercentage?: number;
  href: string;
}) => {
  return (
    <div className="group flex flex-col sm:flex-row gap-4 rounded-xl border border-[#E6EFE6] dark:border-slate-800 bg-white dark:bg-[#0e1726] shadow-sm hover:border-[#048A05] transition-colors">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg sm:w-44 sm:shrink-0 bg-slate-100 dark:bg-slate-800">
        <Image src={image} alt={title} fill className="object-cover" />
        {discountPercentage && discountPercentage > 0 ? (
          <div className="absolute top-2 left-2 z-10 rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white shadow-md">
            -{discountPercentage}% OFF
          </div>
        ) : null}
      </div>
      <div className="flex-1 flex flex-col gap-2 p-5 lg:p-2">
         <div className='flex gap-2 lg:gap-0 flex-col lg:flex-row lg:justify-between lg:items-center'>
          <p className="order-2 lg:order-1 text-lg font-bold text-[#252C32] dark:text-white">{title}</p>
          <Link
            href={href}
            className="order-1 lg:order-2 inline-flex items-center gap-2 text-sm rounded-lg border border-[#BFE8BF] dark:border-[#048A05]/40 px-2 py-2 text-[#048A05] dark:text-[#2CB22C] hover:bg-[#EBFAEB] dark:hover:bg-[#048A05]/20 transition-colors"
          >
            View Package
            <span className="border border-[#D1D5DB] dark:border-slate-700 rounded-lg p-1 group-hover:bg-[#048A05] group-hover:border-[#048A05]">
              <SlantedArrow className="text-[#048A05] group-hover:text-white" />
            </span>
          </Link>
        </div>
       
        <p className="text-sm text-[#5A646B] dark:text-slate-400">{mini_description}</p>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-base font-bold text-[#111827] dark:text-white">
            ₦{price.toLocaleString("en-NG")}
          </span>
          {priceOriginal && priceOriginal > price ? (
            <span className="text-xs text-[#9AA5AC] dark:text-slate-500 line-through">
              ₦{priceOriginal.toLocaleString("en-NG")}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PackageListCard;
