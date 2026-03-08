import React from 'react';
import ProductCard from './ProductCard';
import ProductListCard from './ProductListCard';

type ProductItem = {
    id: number;
    title: string;
    mini_description: string;
    price: number;
    priceOriginal: number;
    image: string;
    availability: string;
    warrantyYears: number;
};

const ProductsGrid = ({
    items,
    view,
    favorites,
    onToggleFavorite,
    onGetQuote,
}: {
    items: ProductItem[];
    view: "grid" | "list";
    favorites: number[];
    onToggleFavorite: (id: number) => void;
    onGetQuote?: (item: ProductItem) => void;
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
                        href={`/store/products/${p.id}`}
                        id={p.id}
                        isFavorite={favorites.includes(p.id)}
                        onToggleFavorite={() => onToggleFavorite(p.id)}
                        onGetQuote={() => onGetQuote?.(p)}
                    />
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
                        <ProductCard
                            key={p.id}
                            id={p.id}
                            title={p.title}
                            mini_description={p.mini_description}
                            price={p.price}
                             priceOriginal={p.priceOriginal}
                            image={p.image}
                            availability={p.availability}
                            href={`/store/products/${p.id}`}
                            isFavorite={favorites.includes(p.id)}
                            onToggleFavorite={() => onToggleFavorite(p.id)}
                            onGetQuote={() => onGetQuote?.(p)}
                        />
                    ))
                }
            </div>
        </div>
    )
}

export default ProductsGrid
