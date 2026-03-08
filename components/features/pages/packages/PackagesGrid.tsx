/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import PackageCard from './PackageCard';
import PackageListCard from './PackageListCard';
import Link from 'next/link';
import HeartIcon from '@/components/features/icons/HeartIcon';

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
                        {onToggleFavorite && (
                            <button
                                type="button"
                                onClick={() => onToggleFavorite(p.id)}
                                className="absolute right-3 top-3 z-20 h-8 w-8 rounded-md border border-[#E4E9EC] bg-white/95 grid place-items-center"
                            >
                                <HeartIcon
                                    filled={favorites.includes(p.id)}
                                    className={
                                        favorites.includes(p.id)
                                            ? "text-[#E11D48]"
                                            : "text-[#3B3B3B]/60"
                                    }
                                />
                            </button>
                        )}
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
                            {onToggleFavorite && (
                                <button
                                    type="button"
                                    onClick={() => onToggleFavorite(p.id)}
                                    className="absolute right-3 top-3 z-20 h-8 w-8 rounded-md border border-[#E4E9EC] bg-white/95 grid place-items-center"
                                >
                                    <HeartIcon
                                        filled={favorites.includes(p.id)}
                                        className={
                                            favorites.includes(p.id)
                                                ? "text-[#E11D48]"
                                                : "text-[#3B3B3B]/60"
                                        }
                                    />
                                </button>
                            )}
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
