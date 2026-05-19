"use client";

import React, { useMemo, useState } from "react";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { useGeneralStore } from "@/store/GeneralStore";
import ProductsGrid from "@/components/features/pages/product/ProductsGrid";
import PackagesGrid from "@/components/features/pages/packages/PackagesGrid";
import { useStoreCatalog } from "@/lib/store-catalog";

const FavoritesPage = () => {
  const { products, packages } = useStoreCatalog();
  const [query, setQuery] = useState("");
  const favoriteProductsIds = useGeneralStore((state) => state.favorites.products);
  const favoritePackageIds = useGeneralStore((state) => state.favorites.packages);
  const toggleFavoriteProduct = useGeneralStore((state) => state.toggleFavoriteProduct);
  const toggleFavoritePackage = useGeneralStore((state) => state.toggleFavoritePackage);

  const favoriteProducts = useMemo(() => {
    return products.filter((item) => favoriteProductsIds.includes(item.id));
  }, [favoriteProductsIds, products]);

  const favoritePackages = useMemo(() => {
    return packages.filter((item) => favoritePackageIds.includes(item.id));
  }, [favoritePackageIds, packages]);

  const hasFavorites = favoriteProducts.length > 0 || favoritePackages.length > 0;

  return (
    <div className="min-h-screen bg-white pt-22">
      <DashboardHeader query={query} onQueryChange={setQuery} />
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-[#252C32]">Favourites</h1>

        {!hasFavorites ? (
          <div className="mt-8 rounded-xl border border-[#E4E9EC] bg-[#FAFAFA] p-8 text-center text-[#6B7280]">
            No Favourite Product
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#252C32]">Products</h2>
              {favoriteProducts.length === 0 ? (
                <div className="rounded-xl border border-[#E4E9EC] bg-[#FAFAFA] p-6 text-center text-[#6B7280]">
                  No Favourite Product
                </div>
              ) : (
                <ProductsGrid
                  items={favoriteProducts}
                  view="grid"
                  favorites={favoriteProductsIds}
                  onToggleFavorite={toggleFavoriteProduct}
                />
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#252C32]">Packages</h2>
              {favoritePackages.length === 0 ? (
                <div className="rounded-xl border border-[#E4E9EC] bg-[#FAFAFA] p-6 text-center text-[#6B7280]">
                  No Favourite Package
                </div>
              ) : (
                <PackagesGrid
                  items={favoritePackages}
                  view="grid"
                  favorites={favoritePackageIds}
                  onToggleFavorite={toggleFavoritePackage}
                />
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
