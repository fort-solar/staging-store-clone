"use client";

import React, { useMemo, useState } from "react";

import DashboardHeader from "@/components/features/layout/DashboardHeader";
import PackagesGrid from "@/components/features/pages/packages/PackagesGrid";
import ProductsGrid from "@/components/features/pages/product/ProductsGrid";
import EmptyStatePanel from "@/components/ui/empty-state-panel";
import { useStoreCatalog } from "@/lib/store-catalog";
import { useGeneralStore } from "@/store/GeneralStore";

export default function FavoritesPage() {
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
          <EmptyStatePanel
            title="No favourites saved yet"
            description="Products and packages you mark as favourites will be collected here for quick access."
            className="mt-8 min-h-64"
          />
        ) : (
          <div className="mt-8 space-y-10">
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#252C32]">Products</h2>
              {favoriteProducts.length === 0 ? (
                <EmptyStatePanel
                  title="No favourite products yet"
                  description="Save a product from the catalog to keep it handy in this list."
                  className="min-h-52"
                />
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
                <EmptyStatePanel
                  title="No favourite packages yet"
                  description="Save a package from the catalog to keep it handy in this list."
                  className="min-h-52"
                />
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
}
