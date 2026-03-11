/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import PackageCard from './PackageCard';
import PackageListCard from './PackageListCard';
import Link from 'next/link';
// import HeartIcon from '@/components/features/icons/HeartIcon';

type PackageItem = {
    id: number;
    title: string;
    mini_description: string;
    image: any;
    price: number;
    availability: string;
};

const PackagesGrid = ({
    items,
    view,
    favorites = [],
    onToggleFavorite,
}: {
    items: PackageItem[];
    view: "grid" | "list";
    favorites?: number[];
    onToggleFavorite?: (id: number) => void;
}) => {
    if (view === "list") {
        return (
            <div className="flex flex-col gap-4">
                {items.map((p) => (
                    <div key={p.id} className="relative">
                     
                        <PackageListCard
                            title={p.title}
                            mini_description={p.mini_description}
                            image={p.image}
                            price={p.price}
                            availability={p.availability}
                            href={`/store/packages/${p.id}`}
                        />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="@container">
            <div className="
        grid grid-cols-1
        sm:grid-cols-3
        @[900px]:grid-cols-4
        gap-5
      ">
                {
                    items.map((p) => (
                        <div key={p.id} className="relative">
                         
                            <Link href={`/store/packages/${p.id}`}>
                                <PackageCard title={p.title} mini_description={p.mini_description} image={p.image} />
                            </Link>
                        </div>
                    ))
                }
            </div>
        </div>

    )
}

export default PackagesGrid
