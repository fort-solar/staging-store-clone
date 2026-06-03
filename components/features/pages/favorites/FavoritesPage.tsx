"use client";

import React, { useMemo, useState } from "react";

import DashboardHeader from "@/components/features/layout/DashboardHeader";
import PackagesGrid from "@/components/features/pages/packages/PackagesGrid";
import ProductsGrid from "@/components/features/pages/product/ProductsGrid";
import EmptyStatePanel from "@/components/ui/empty-state-panel";
import PaginationControls from "@/components/ui/pagination-controls";
import { useCustomerFavoriteToggle } from "@/hooks/use-customer-favorite-toggle";
import {
  STORE_PAGE_SIZE,
  useStorePackagesByIds,
  useStoreProductsByIds,
} from "@/lib/store-catalog";
import { useGeneralStore } from "@/store/GeneralStore";

const FAVORITES_PAGE_SIZE = STORE_PAGE_SIZE;

function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const startIndex = (page - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
}

export default function FavoritesPage() {
  const [query, setQuery] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [packagePage, setPackagePage] = useState(1);
  const favoriteProductsIds = useGeneralStore((state) => state.favorites.products);
  const favoritePackageIds = useGeneralStore((state) => state.favorites.packages);
  const { toggleProductFavorite, togglePackageFavorite } =
    useCustomerFavoriteToggle();
  const { items: products, isLoading: isLoadingProducts } = useStoreProductsByIds(
    favoriteProductsIds,
  );
  const { items: packages, isLoading: isLoadingPackages } = useStorePackagesByIds(
    favoritePackageIds,
  );

  const favoriteProducts = useMemo(() => {
    return products.filter((item) => favoriteProductsIds.includes(item.id));
  }, [favoriteProductsIds, products]);

  const favoritePackages = useMemo(() => {
    return packages.filter((item) => favoritePackageIds.includes(item.id));
  }, [favoritePackageIds, packages]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredFavoriteProducts = useMemo(() => {
    if (!normalizedQuery) {
      return favoriteProducts;
    }

    return favoriteProducts.filter(
      (item) =>
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.mini_description.toLowerCase().includes(normalizedQuery),
    );
  }, [favoriteProducts, normalizedQuery]);

  const filteredFavoritePackages = useMemo(() => {
    if (!normalizedQuery) {
      return favoritePackages;
    }

    return favoritePackages.filter(
      (item) =>
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.mini_description.toLowerCase().includes(normalizedQuery),
    );
  }, [favoritePackages, normalizedQuery]);

  const productTotalPages = Math.max(
    1,
    Math.ceil(filteredFavoriteProducts.length / FAVORITES_PAGE_SIZE),
  );
  const packageTotalPages = Math.max(
    1,
    Math.ceil(filteredFavoritePackages.length / FAVORITES_PAGE_SIZE),
  );
  const resolvedProductPage = Math.min(productPage, productTotalPages);
  const resolvedPackagePage = Math.min(packagePage, packageTotalPages);

  const paginatedFavoriteProducts = useMemo(
    () => paginateItems(filteredFavoriteProducts, resolvedProductPage, FAVORITES_PAGE_SIZE),
    [filteredFavoriteProducts, resolvedProductPage],
  );
  const paginatedFavoritePackages = useMemo(
    () => paginateItems(filteredFavoritePackages, resolvedPackagePage, FAVORITES_PAGE_SIZE),
    [filteredFavoritePackages, resolvedPackagePage],
  );

  const hasFavorites = favoriteProductsIds.length > 0 || favoritePackageIds.length > 0;
  const handleQueryChange = (value: string) => {
    setQuery(value);
    setProductPage(1);
    setPackagePage(1);
  };

  return (
    <div className="min-h-screen bg-white pt-22">
      <DashboardHeader query={query} onQueryChange={handleQueryChange} />
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
              {isLoadingProducts && favoriteProductsIds.length > 0 ? (
                <EmptyStatePanel
                  title="Loading favourite products"
                  description="We are fetching your saved product records from the store."
                  className="min-h-52"
                />
              ) : filteredFavoriteProducts.length === 0 ? (
                <EmptyStatePanel
                  title={
                    normalizedQuery
                      ? "No favourite products match your search"
                      : "No favourite products yet"
                  }
                  description={
                    normalizedQuery
                      ? "Try a different search term or browse your saved catalogue again."
                      : "Save a product from the catalog to keep it handy in this list."
                  }
                  className="min-h-52"
                />
              ) : (
                <>
                  <ProductsGrid
                    items={paginatedFavoriteProducts}
                    view="grid"
                    favorites={favoriteProductsIds}
                    onToggleFavorite={toggleProductFavorite}
                  />
                  <PaginationControls
                    className="pt-2"
                    page={resolvedProductPage}
                    totalPages={productTotalPages}
                    totalItems={filteredFavoriteProducts.length}
                    onPageChange={setProductPage}
                  />
                </>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-[#252C32]">Packages</h2>
              {isLoadingPackages && favoritePackageIds.length > 0 ? (
                <EmptyStatePanel
                  title="Loading favourite packages"
                  description="We are fetching your saved package records from the store."
                  className="min-h-52"
                />
              ) : filteredFavoritePackages.length === 0 ? (
                <EmptyStatePanel
                  title={
                    normalizedQuery
                      ? "No favourite packages match your search"
                      : "No favourite packages yet"
                  }
                  description={
                    normalizedQuery
                      ? "Try a different search term or browse your saved catalogue again."
                      : "Save a package from the catalog to keep it handy in this list."
                  }
                  className="min-h-52"
                />
              ) : (
                <>
                  <PackagesGrid
                    items={paginatedFavoritePackages}
                    view="grid"
                    favorites={favoritePackageIds}
                    onToggleFavorite={togglePackageFavorite}
                  />
                  <PaginationControls
                    className="pt-2"
                    page={resolvedPackagePage}
                    totalPages={packageTotalPages}
                    totalItems={filteredFavoritePackages.length}
                    onPageChange={setPackagePage}
                  />
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
