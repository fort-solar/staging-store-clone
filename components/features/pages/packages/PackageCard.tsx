import React from 'react';
import BundleIcon from '@/components/features/icons/BundleIcon';
import BoltIcon from '@/components/features/icons/BoltIcon';
import CircularGreenCheck from '@/components/features/icons/CircularGreenCheck';
import Image, { StaticImageData } from 'next/image';
import { SlantedArrow } from "@/components/features/icons/SlantedArrow";


const PackageCard = ({ title, mini_description, image, }: { title: string; mini_description: string; image: StaticImageData }) => {
    return (
        <div className="
      group flex flex-col gap-3 h-full justify-between overflow-hidden shadow-sm rounded-lg pt-4 px-4
      bg-white border border-transparent cursor-pointer
      transition-all duration-300
      hover:bg-[#EBFAEB] hover:border-[#058A05]
    ">
            <div className="flex w-full justify-between items-start">
                <div>
                    <p className="font-semibold text-lg">
                        {title}
                    </p>
                    <p className="text-sm">
                        {mini_description}
                    </p>
                </div>


                <div className="
          border p-3 rounded-lg border-[#CCCCCC]
          transition-all duration-300
          group-hover:bg-[#058A05]
          group-hover:border-[#058A05]
        ">
                    <SlantedArrow
                        className="
              text-[#058A05]
              transition-colors duration-300
              group-hover:text-white
            "
                    />
                </div>
            </div>

            <div className="
          relative h-72 lg:h-60
          pt-5
          perspective-1000
        ">
                <div
                    className="
            hidden md:block
            absolute inset-0
            backface-hidden
            transition-transform duration-700
            group-hover:rotate-y-180
          "
                >
                    <Image
                        fill
                        src={image}
                        alt="Campus Lite solar bundle package"
                        className="object-cover rounded-t-lg"
                    />
                </div>
                <div
                    className="
            relative
            h-full
            bg-white rounded-t-lg
            p-4
            md:absolute md:inset-0
            md:rotate-y-180
            md:backface-hidden
            transition-transform duration-700
            md:group-hover:rotate-y-360
          "
                >
                    <div className='space-y-4'>
                        <div className="flex gap-2 items-center">
                            <BundleIcon />
                            <p className='font-bold text-sm text-[#036D03]'>Bundle Components</p>
                        </div>
                        <div className="space-y-1">
                            <div className='flex items-center justify-between'>
                                <p className='text-[11px]'>1kva/2kwh All-in-one Power Station</p>
                                <CircularGreenCheck />
                            </div>
                            <div className='flex items-center justify-between'>
                                <p className='text-[11px]'>450W Monocrystalline Panels (x2)</p>
                                <CircularGreenCheck />
                            </div>
                        </div>
                        <hr className='border-[#3B3B3BB2]' />
                        <div className="flex gap-2 items-center">
                            <BoltIcon />
                            <p className='font-bold text-sm text-[#036D03]'>Fortified To Power</p>
                        </div>
                        <ul className='flex flex-col flex-wrap max-h-16'>
                            <li className='text-xs'>TV</li>
                            <li className='text-xs'>Laptop</li>
                            <li className='text-xs'>Standing Fan</li>
                            <li className='text-xs'>Led Bulbs</li>
                            <li className='text-xs'>Router</li>
                            <li className='text-xs'>Table Side Fridge</li>
                            <li className='text-xs'>Phones</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PackageCard
