import React from 'react';
import Image from 'next/image';
import { SlantedArrow } from "@/components/features/icons/SlantedArrow";

const PackageCard = ({
    title,
    mini_description,
    image,
    price,
    packageIncludes = [],
    powers = [],
}: {
    title: string;
    mini_description: string;
    image: string;
    price: number;
    packageIncludes?: Array<{ label: string; qty: string }>;
    powers?: string[];
}) => {
    const highlights = packageIncludes.length
        ? packageIncludes.map((item) => `${item.label} ${item.qty}`).slice(0, 4)
        : powers.slice(0, 4);

    return (
        <div className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[#DDE7DD] bg-white p-3 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#048A05] hover:shadow-[0_16px_36px_-26px_rgba(5,138,5,0.38)]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-[#EDF5ED]">
                <Image
                    fill
                    src={image}
                    alt={title}
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
            </div>

            <div className="flex flex-1 flex-col gap-4 px-1 pb-2 pt-5">
                <div className="flex w-full items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#048A05]">
                            Solar Package
                        </p>
                        <p className="mt-2 text-lg font-semibold leading-tight text-[#101828]">
                            {title}
                        </p>
                    </div>

                    <div className="rounded-xl border border-[#D7E2D7] p-3 transition-all duration-300 group-hover:border-[#048A05] group-hover:bg-[#048A05]">
                        <SlantedArrow className="text-[#048A05] transition-colors duration-300 group-hover:text-white" />
                    </div>
                </div>

                <p className="line-clamp-3 text-sm leading-6 text-[#667085]">
                    {mini_description}
                </p>

                <div className="flex flex-wrap gap-2">
                    {highlights.length ? (
                        highlights.map((highlight) => (
                            <span
                                key={highlight}
                                className="rounded-full border border-[#E2E8E2] bg-[#F8FBF8] px-3 py-1 text-xs text-[#475467]"
                            >
                                {highlight}
                            </span>
                        ))
                    ) : (
                        <span className="rounded-full border border-[#E2E8E2] bg-[#F8FBF8] px-3 py-1 text-xs text-[#475467]">
                            Package details available on the product page
                        </span>
                    )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-[#111827]">
                        ₦{price.toLocaleString("en-NG")}
                    </p>
                    <span className="text-sm font-medium text-[#048A05]">
                        View Package
                    </span>
                </div>
            </div>
        </div>
    )
}

export default PackageCard
