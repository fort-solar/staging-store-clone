/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import PackageCard from './PackageCard';
import PackageListCard from './PackageListCard';
import Link from 'next/link';

type PackageItem = {
    id: number;
    title: string;
    mini_description: string;
    image: any;
    price: number;
    availability: string;
};

const PackagesGrid = ({ items, view }: { items: PackageItem[]; view: "grid" | "list"; }) => {
    if (view === "list") {
        return (
            <div className="flex flex-col gap-4">
                {items.map((p) => (
                    <PackageListCard
                        key={p.id}
                        title={p.title}
                        mini_description={p.mini_description}
                        image={p.image}
                        price={p.price}
                        availability={p.availability}
                        href={`/dashboard/packages/${p.id}`}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {
                items.map((p) => (
                    <Link key={p.id} href={`/dashboard/packages/${p.id}`}>
                        <PackageCard title={p.title} mini_description={p.mini_description} image={p.image} />
                    </Link>
                ))
            }
        </div>
    )
}

export default PackagesGrid
