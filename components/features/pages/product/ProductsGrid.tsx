import React from 'react';
import ProductCard from './ProductCard';
import ProductListCard from './ProductListCard';

type ProductItem = {
    id: number;
    title: string;
    mini_description: string;
    price: number;
    image: string;
    availability: string;
    warrantyYears: number;
};

const ProductsGrid = ({
    items,
    view,
    favorites,
    onToggleFavorite,
}: {
    items: ProductItem[];
    view: "grid" | "list";
    favorites: Record<number, boolean>;
    onToggleFavorite: (id: number) => void;
}) => {
    if (view === "list") {
        return (
            <div className="flex flex-col gap-4">
                {items.map((p) => (
                    <ProductListCard
                        key={p.id}
                        title={p.title}
                        mini_description={p.mini_description}
                        price={p.price}
                        image={p.image}
                        availability={p.availability}
                        warrantyYears={p.warrantyYears}
                        href={`/dashboard/products/${p.id}`}
                        isFavorite={!!favorites[p.id]}
                        onToggleFavorite={() => onToggleFavorite(p.id)}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {
                items.map((p) => (
                    <ProductCard
                        key={p.id}
                        title={p.title}
                        mini_description={p.mini_description}
                        price={p.price}
                        image={p.image}
                        availability={p.availability}
                        href={`/dashboard/products/${p.id}`}
                        isFavorite={!!favorites[p.id]}
                        onToggleFavorite={() => onToggleFavorite(p.id)}
                    />
                ))
            }
        </div>
    )
}

export default ProductsGrid
