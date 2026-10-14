"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { ArrowUpDown, Check, ChevronDown, ListFilter, SlidersHorizontal } from "lucide-react";
import PackagesGrid from "@/components/features/pages/packages/PackagesGrid";
import ProductsGrid from "@/components/features/pages/product/ProductsGrid";
import GetQuoteModal from "@/components/features/pages/product/GetQuoteModal";
import EmptyStatePanel from "@/components/ui/empty-state-panel";
import GradientCheckbox from "@/components/ui/gradient-checkbox";
import PaginationControls from "@/components/ui/pagination-controls";
import { useCustomerFavoriteToggle } from "@/hooks/use-customer-favorite-toggle";
import {
  STORE_PAGE_SIZE,
  useStorePackages,
  useStoreProductCategoryOptions,
  useStoreProducts,
} from "@/lib/store-catalog";
import { useGeneralStore } from "@/store/GeneralStore";
import type { CatalogId } from "@/types/common.types";

type TabKey = "products" | "packages";

type QuoteProduct = {
  id: CatalogId;
  title: string;
  image: string;
  price: number;
};

type ProductFilters = {
  categoryId: string;
  activeOnly: boolean;
};

type PackageFilters = {
  activeOnly: boolean;
};

const CATALOG_PAGE_SIZE = STORE_PAGE_SIZE;

const FilterSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <p className="text-sm font-semibold text-[#252C32]">{title}</p>
    {children}
  </div>
);

const CheckboxItem = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <GradientCheckbox
    checked={checked}
    onChange={onChange}
    label={label}
    labelClassName="text-sm text-[#3B3B3B]"
  />
);

function useDebouncedValue<T>(value: T, delayMs = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, value]);

  return debouncedValue;
}

const DashboardProductsPackages = ({ initialTab }: { initialTab: TabKey }) => {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [productFilters, setProductFilters] = useState<ProductFilters>({
    categoryId: "",
    activeOnly: false,
  });
  const [packageFilters, setPackageFilters] = useState<PackageFilters>({
    activeOnly: false,
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(true);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [mobileSort, setMobileSort] = useState<"default" | "price-low" | "price-high">("default");
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [productQuery, setProductQuery] = useState("");
  const [packageQuery, setPackageQuery] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [packagePage, setPackagePage] = useState(1);
  const [quoteProduct, setQuoteProduct] = useState<QuoteProduct | null>(null);
  const debouncedProductQuery = useDebouncedValue(productQuery);
  const debouncedPackageQuery = useDebouncedValue(packageQuery);
  const favorites = useGeneralStore((state) => state.favorites);
  const { toggleProductFavorite, togglePackageFavorite } =
    useCustomerFavoriteToggle();

  const {
    items: products,
    pagination: productPagination,
    source: productSource,
    isLoading: isLoadingProducts,
  } = useStoreProducts({
    page: productPage,
    limit: CATALOG_PAGE_SIZE,
    search: debouncedProductQuery,
    categoryId: productFilters.categoryId || undefined,
    isActive: productFilters.activeOnly ? true : undefined,
  });
  const {
    items: packages,
    pagination: packagePagination,
    source: packageSource,
    isLoading: isLoadingPackages,
  } = useStorePackages({
    page: packagePage,
    limit: CATALOG_PAGE_SIZE,
    search: debouncedPackageQuery,
    isActive: packageFilters.activeOnly ? true : undefined,
  });
  const { categories: productCategoryOptions } = useStoreProductCategoryOptions();

  const productSections = useMemo(
    () => [
      { id: "", label: "All Products" },
      ...productCategoryOptions.map((category) => ({
        id: category.id,
        label: category.label,
      })),
    ],
    [productCategoryOptions],
  );

  const productCategoryLabelById = useMemo(
    () =>
      new Map(
        productCategoryOptions.map((category) => [category.id, category.label]),
      ),
    [productCategoryOptions],
  );

  const activeProductSection =
    productCategoryLabelById.get(productFilters.categoryId) || "All Products";
  const activeQuery = activeTab === "products" ? productQuery : packageQuery;
  const resultsCount =
    activeTab === "products" ? productPagination.total : packagePagination.total;

  const handleActiveQueryChange = (value: string) => {
    if (activeTab === "products") {
      setProductQuery(value);
      setProductPage(1);
      return;
    }

    setPackageQuery(value);
    setPackagePage(1);
  };

  const handleProductCategorySelect = (categoryId: string) => {
    setProductFilters((prev) => ({
      ...prev,
      categoryId,
    }));
    setProductPage(1);
  };

  const activeItemCount = activeTab === "products" ? products.length : packages.length;
  const activeIsLoading =
    activeTab === "products" ? isLoadingProducts : isLoadingPackages;
  const activeSource = activeTab === "products" ? productSource : packageSource;
  const sortedProducts = useMemo(() => {
    if (mobileSort === "default") return products;
    return [...products].sort((a, b) => mobileSort === "price-low" ? a.price - b.price : b.price - a.price);
  }, [mobileSort, products]);
  const sortedPackages = useMemo(() => {
    if (mobileSort === "default") return packages;
    return [...packages].sort((a, b) => mobileSort === "price-low" ? a.price - b.price : b.price - a.price);
  }, [mobileSort, packages]);

  return (
    <div className="min-h-screen bg-white py-22">
      <DashboardHeader query={activeQuery} onQueryChange={handleActiveQueryChange} />

      <div className="mx-auto w-full max-w-6xl px-4 py-2">
        <div className="mt-26 flex w-full flex-col lg:mt-0 lg:flex-row lg:items-center lg:justify-between">
          {activeTab === "products" ? (
            <div className="order-2 flex w-full flex-wrap items-center justify-center gap-2 text-sm text-[#5A646B] lg:order-1 lg:justify-start">
              {productSections.map((section) => (
                <button
                  key={section.id || section.label}
                  onClick={() => handleProductCategorySelect(section.id)}
                  className={`rounded-full px-2 py-1 transition-colors lg:px-3 ${
                    activeProductSection === section.label
                      ? "font-semibold text-[#048A05]"
                      : "hover:text-[#252C32]"
                  }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          ) : (
            <div />
          )}

          <div className="order-1 mb-5 flex flex-col gap-3 lg:order-2 lg:mb-0">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="mt-5 inline-flex w-full rounded-lg bg-[#F3F4F6] lg:mt-0 lg:w-fit">
                <button
                  onClick={() => setActiveTab("packages")}
                  className={`w-[50%] rounded-l-lg px-4 py-3 text-sm lg:w-fit lg:py-1.5 ${
                    activeTab === "packages"
                      ? "bg-[#048A05] text-white"
                      : "text-[#3B3B3B]"
                  }`}
                >
                  Packages
                </button>
                <button
                  onClick={() => setActiveTab("products")}
                  className={`w-[50%] rounded-r-lg px-4 py-3 text-sm lg:w-fit lg:py-1.5 ${
                    activeTab === "products"
                      ? "bg-[#048A05] text-white"
                      : "text-[#3B3B3B]"
                  }`}
                >
                  Products
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Header & Controls Bar */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#E9EEF0] pb-4">
          <div>
            {activeQuery.trim().length > 0 ? (
              <h1 className="text-xl font-bold text-[#252C32]">
                Found {resultsCount} results for{" "}
                <span className="text-[#048A05]">&ldquo;{activeQuery}&rdquo;</span>
              </h1>
            ) : (
              <h1 className="text-xl font-bold text-[#252C32]">
                {activeTab === "products" ? activeProductSection : "All Packages"}
              </h1>
            )}
            <p className="text-xs text-[#5A646B] mt-0.5">
              Showing {activeItemCount} of {resultsCount} items
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Folded Categories Dropdown (when on products) */}
            {activeTab === "products" && (
              <div className="relative" ref={categoryMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryMenuOpen((prev) => !prev);
                    setSortMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    productFilters.categoryId
                      ? "border-[#048A05] bg-[#EAFBEA] text-[#048A05]"
                      : "border-[#D9E0E4] bg-white text-[#252C32] hover:border-[#048A05]"
                  }`}
                  aria-expanded={categoryMenuOpen}
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  <span>Category: {activeProductSection}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${categoryMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {categoryMenuOpen && (
                  <div className="absolute right-0 top-full z-30 mt-1.5 w-56 rounded-xl border border-[#E9EEF0] bg-white py-1.5 shadow-lg">
                    {productSections.map((section) => {
                      const isSelected = productFilters.categoryId === section.id;
                      return (
                        <button
                          key={section.id || section.label}
                          type="button"
                          onClick={() => {
                            handleProductCategorySelect(section.id);
                            setCategoryMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                            isSelected
                              ? "bg-[#EAFBEA] font-semibold text-[#048A05]"
                              : "text-[#252C32] hover:bg-[#F4F6F8]"
                          }`}
                        >
                          <span>{section.label}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#048A05]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Folded Sort Dropdown */}
            <div className="relative" ref={sortMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setSortMenuOpen((prev) => !prev);
                  setCategoryMenuOpen(false);
                }}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  mobileSort !== "default"
                    ? "border-[#048A05] bg-[#EAFBEA] text-[#048A05]"
                    : "border-[#D9E0E4] bg-white text-[#252C32] hover:border-[#048A05]"
                }`}
                aria-expanded={sortMenuOpen}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span>
                  Sort:{" "}
                  {mobileSort === "price-low"
                    ? "Price: Low to High"
                    : mobileSort === "price-high"
                    ? "Price: High to Low"
                    : "Default"}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sortMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {sortMenuOpen && (
                <div className="absolute right-0 top-full z-30 mt-1.5 w-48 rounded-xl border border-[#E9EEF0] bg-white py-1.5 shadow-lg">
                  {[
                    { key: "default", label: "Default / Recommended" },
                    { key: "price-low", label: "Price: Low to High" },
                    { key: "price-high", label: "Price: High to Low" },
                  ].map((option) => {
                    const isSelected = mobileSort === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => {
                          setMobileSort(option.key as "default" | "price-low" | "price-high");
                          setSortMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                          isSelected
                            ? "bg-[#EAFBEA] font-semibold text-[#048A05]"
                            : "text-[#252C32] hover:bg-[#F4F6F8]"
                        }`}
                      >
                        <span>{option.label}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-[#048A05]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Filters Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setShowMobileFilters((prev) => !prev);
                setShowDesktopFilters((prev) => !prev);
              }}
              className="flex items-center gap-2 rounded-lg border border-[#D9E0E4] bg-white px-3 py-2 text-xs font-semibold text-[#252C32] hover:border-[#048A05] transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
              {(Boolean(productFilters.categoryId) || productFilters.activeOnly || packageFilters.activeOnly) ? (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#048A05] text-[10px] font-bold text-white">
                  {Number(Boolean(productFilters.categoryId)) +
                    Number(productFilters.activeOnly) +
                    Number(packageFilters.activeOnly)}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className={`mt-6 grid grid-cols-1 gap-6 ${showDesktopFilters ? "lg:grid-cols-[260px_1fr]" : "lg:grid-cols-1"}`}>
          <aside
            id="mobile-catalog-filters"
            className={`${showMobileFilters ? "block" : "hidden"} ${showDesktopFilters ? "lg:block" : "lg:hidden"} space-y-6 rounded-xl border border-[#E4E9EC] bg-[#FAFBFB] p-4 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0`}
          >
            {activeTab === "products" ? (
              <>
                <FilterSection title="Category">
                  <div className="space-y-2">
                    {productSections.map((section) => (
                      <CheckboxItem
                        key={section.id || section.label}
                        label={section.label}
                        checked={productFilters.categoryId === section.id}
                        onChange={() => handleProductCategorySelect(section.id)}
                      />
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Availability">
                  <div className="space-y-2">
                    <CheckboxItem
                      label="Active Products"
                      checked={productFilters.activeOnly}
                      onChange={() => {
                        setProductFilters((prev) => ({
                          ...prev,
                          activeOnly: !prev.activeOnly,
                        }));
                        setProductPage(1);
                      }}
                    />
                  </div>
                </FilterSection>
              </>
            ) : (
              <FilterSection title="Availability">
                <div className="space-y-2">
                  <CheckboxItem
                    label="Active Packages"
                    checked={packageFilters.activeOnly}
                    onChange={() => {
                      setPackageFilters((prev) => ({
                        ...prev,
                        activeOnly: !prev.activeOnly,
                      }));
                      setPackagePage(1);
                    }}
                  />
                </div>
              </FilterSection>
            )}
          </aside>

          <section
            className="transition-all duration-300"
          >
            {activeTab === "products" ? (
              activeItemCount > 0 ? (
                <>
                  <ProductsGrid
                    items={sortedProducts}
                    view="grid"
                    favorites={favorites.products}
                    onToggleFavorite={toggleProductFavorite}
                    onGetQuote={(item) =>
                      setQuoteProduct({
                        id: item.id,
                        title: item.title,
                        image: item.image,
                        price: item.price,
                      })
                    }
                  />
                  <PaginationControls
                    className="mt-8"
                    page={productPagination.page}
                    totalPages={Math.max(productPagination.totalPages, 1)}
                    totalItems={productPagination.total}
                    onPageChange={setProductPage}
                  />
                </>
              ) : (
                <EmptyStatePanel
                  title={
                    activeIsLoading
                      ? "Loading products"
                      : activeSource === "unavailable"
                        ? "Products are unavailable right now"
                        : "No products found"
                  }
                  description={
                    activeIsLoading
                      ? "We are fetching products directly from the catalog."
                      : activeSource === "unavailable"
                        ? "The product catalog could not be reached. Check the API configuration and try again."
                        : "No products matched the current database filters. Adjust your search or clear a filter to continue."
                  }
                  className="min-h-[22rem]"
                />
              )
            ) : activeItemCount > 0 ? (
              <>
                <PackagesGrid
                  items={sortedPackages}
                  view="grid"
                  favorites={favorites.packages}
                  onToggleFavorite={togglePackageFavorite}
                />
                <PaginationControls
                  className="mt-8"
                  page={packagePagination.page}
                  totalPages={Math.max(packagePagination.totalPages, 1)}
                  totalItems={packagePagination.total}
                  onPageChange={setPackagePage}
                />
              </>
            ) : (
              <EmptyStatePanel
                title={
                  activeIsLoading
                    ? "Loading packages"
                    : activeSource === "unavailable"
                      ? "Packages are unavailable right now"
                      : "No packages found"
                }
                description={
                  activeIsLoading
                    ? "We are fetching packages directly from the catalog."
                    : activeSource === "unavailable"
                      ? "The package catalog could not be reached. Check the API configuration and try again."
                      : "No packages matched the current database filters. Adjust your search or clear a filter to continue."
                }
                className="min-h-[22rem]"
              />
            )}
          </section>
        </div>
      </div>

      <div className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 overflow-hidden rounded-full bg-[#252C32] text-sm font-semibold text-white shadow-xl lg:hidden">
        <label className="relative px-5 py-3">
          <span>{mobileSort === "price-low" ? "Price: low" : mobileSort === "price-high" ? "Price: high" : "Sort by"}</span>
          <select aria-label="Sort catalog" value={mobileSort} onChange={(event) => setMobileSort(event.target.value as typeof mobileSort)} className="absolute inset-0 cursor-pointer opacity-0">
            <option value="default">Default</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
        <button type="button" className="flex items-center gap-2 border-l border-white/25 px-5 py-3" onClick={() => setShowMobileFilters((open) => !open)}><SlidersHorizontal className="h-4 w-4" /> Filter</button>
      </div>

      {quoteProduct ? (
        <GetQuoteModal
          key={quoteProduct.id}
          open={Boolean(quoteProduct)}
          product={quoteProduct}
          onClose={() => setQuoteProduct(null)}
        />
      ) : null}
    </div>
  );
};

export default DashboardProductsPackages;
