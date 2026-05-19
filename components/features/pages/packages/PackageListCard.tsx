import React from 'react';
import Image from 'next/image';
import { SlantedArrow } from "@/components/features/icons/SlantedArrow";
import Link from 'next/link';

const PackageListCard = ({
  title,
  mini_description,
  image,
  href,
}: {
  title: string;
  mini_description: string;
  image: string;
  price: number;
  availability: string;
  href: string;
}) => {
  return (
    <div className="group flex flex-col sm:flex-row gap-4 rounded-xl border border-[#E6EFE6] bg-white  shadow-sm hover:border-[#058A05] transition-colors">
      <div className="relative h-20 w-full sm:w-56 overflow-hidden rounded-lg">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <div className="flex-1 flex flex-col gap-2 p-5 lg:p-2">
         <div className='flex gap-2 lg:gap-0 flex-col lg:flex-row lg:justify-between lg:items-center'>
          <p className="order-2  lg:order-1 text-lg font-bold text-[#252C32]">{title}</p>
          <Link
            href={href}
            className="order-1 lg:order-2 inline-flex items-center gap-2 text-sm rounded-lg border border-[#BFE8BF] px-2 py-2 text-[#058A05] hover:bg-[#EBFAEB]"
          >
            View Package
            <span className="border border-[#D1D5DB] rounded-lg p-1 group-hover:bg-[#058A05] group-hover:border-[#058A05]">
              <SlantedArrow className="text-[#058A05] group-hover:text-white" />
            </span>
          </Link>
        </div>
       
        <p className="text-sm text-[#5A646B]">{mini_description}</p>
      </div>
    </div>
  );
};

export default PackageListCard;
