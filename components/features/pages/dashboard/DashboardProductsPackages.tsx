"use client";

import React, { useMemo, useState } from "react";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { CardViewIcon } from "@/components/features/icons/CardViewIcon";
import { ListViewIcon } from "@/components/features/icons/ListViewIcon";
import ProductsGrid from "@/components/features/pages/product/ProductsGrid";
import PackagesGrid from "@/components/features/pages/packages/PackagesGrid";
import { Button } from "@/components/ui/button";
import EmptyStatePanel from "@/components/ui/empty-state-panel";
import { Input } from "@/components/ui/input";
import { useGeneralStore } from "@/store/GeneralStore";
import GetQuoteModal from "@/components/features/pages/product/GetQuoteModal";
import { useStoreCatalog } from "@/lib/store-catalog";
import type { CatalogId } from "@/types/common.types";

type TabKey = "products" | "packages";
type QuoteProduct = {
  id: CatalogId;
  title: string;
  image: string;
  price: number;
};

type FilterState = {
  priceMin: string;
  priceMax: string;
  category: string;
  powerRatings: string[];
  features: string[];
  availability: string[];
  warrantyMin: number;
};

const powerRatingsProducts = ["1kVA - 5kVA", "6kVA - 10kVA", "10kVA+"];

const powerRatingsPackages = ["1kVA - 2kVA", "3kVA - 5kVA", "6kVA - 10kVA", "10kVA+"];

// const featureOptions = ["Battery Backup", "Smart Monitoring"];

// const availabilityOptions = ["In Stock", "Pre-Order"];

const sortOptions = [
  "Newest",
  "Price: Low to High",
  "Price: High to Low",
  "Warranty: High to Low",
  "Name: A-Z",
];

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
  <label className="flex items-center gap-2 text-sm text-[#3B3B3B] cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border border-[#B0BABF] accent-[#058A05]"
    />
    {label}
  </label>
);

const DashboardProductsPackages = ({ initialTab }: { initialTab: TabKey }) => {
  const { products, packages, source, isLoading } = useStoreCatalog();
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [productFilters, setProductFilters] = useState<FilterState>({
    priceMin: "",
    priceMax: "",
    category: "",
    powerRatings: [],
    features: [],
    availability: [],
    warrantyMin: 1,
  });
  const [packageFilters, setPackageFilters] = useState<FilterState>({
    priceMin: "",
    priceMax: "",
    category: "",
    powerRatings: [],
    features: [],
    availability: [],
    warrantyMin: 1,
  });
  const [productSort, setProductSort] = useState("Newest");
  const [packageSort, setPackageSort] = useState("Newest");
  const [productView, setProductView] = useState<"grid" | "list">("grid");
  const [packageView, setPackageView] = useState<"grid" | "list">("grid");
  const [productQuery, setProductQuery] = useState("");
  const [packageQuery, setPackageQuery] = useState("");
  const [quoteProduct, setQuoteProduct] = useState<QuoteProduct | null>(null);
  const favorites = useGeneralStore((state) => state.favorites);
  const toggleFavoriteProduct = useGeneralStore(
    (state) => state.toggleFavoriteProduct
  );
  const toggleFavoritePackage = useGeneralStore(
    (state) => state.toggleFavoritePackage
  );
  const isCategorySidebarOpen = useGeneralStore(
    (state) => state.isCategorySidebarOpen
  );
  const toggleCategorySidebar = useGeneralStore(
    (state) => state.toggleCategorySidebar
  );
  const productSections = useMemo(
    () => [
      "All Products",
      ...Array.from(
        new Set(
          products
            .map((product) => product.category)
            .filter((category) => category && category !== "All")
        )
      ),
    ],
    [products]
  );
  const productCategories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category).filter(Boolean)))],
    [products],
  );
  const packageCategories = useMemo(
    () => ["All", ...Array.from(new Set(packages.map((pkg) => pkg.category).filter(Boolean)))],
    [packages],
  );

  const toggleArrayValue = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];

  const sortItems = <T extends { createdAt: string; price: number; warrantyYears: number; title: string }>(
    items: T[],
    sortBy: string
  ) => {
    const sorted = [...items];
    switch (sortBy) {
      case "Price: Low to High":
        return sorted.sort((a, b) => a.price - b.price);
      case "Price: High to Low":
        return sorted.sort((a, b) => b.price - a.price);
      case "Warranty: High to Low":
        return sorted.sort((a, b) => b.warrantyYears - a.warrantyYears);
      case "Name: A-Z":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "Newest":
      default:
        return sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  };

  const filteredProducts = useMemo(() => {
    const filters = productFilters;
    const items = products.filter((product) => {
      const matchesQuery =
        productQuery.trim().length === 0 ||
        product.title.toLowerCase().includes(productQuery.toLowerCase()) ||
        product.mini_description.toLowerCase().includes(productQuery.toLowerCase());
      const matchesCategory =
        !filters.category || product.category === filters.category;
      const matchesPower =
        filters.powerRatings.length === 0 ||
        filters.powerRatings.includes(product.powerRating);
      const matchesFeatures =
        filters.features.length === 0 ||
        filters.features.every((feature) => product.features.includes(feature));
      const matchesAvailability =
        filters.availability.length === 0 ||
        filters.availability.includes(product.availability);
      const matchesPriceMin =
        !filters.priceMin || product.price >= Number(filters.priceMin);
      const matchesPriceMax =
        !filters.priceMax || product.price <= Number(filters.priceMax);
      const matchesWarranty = product.warrantyYears >= filters.warrantyMin;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesPower &&
        matchesFeatures &&
        matchesAvailability &&
        matchesPriceMin &&
        matchesPriceMax &&
        matchesWarranty
      );
    });

    return sortItems(items, productSort);
  }, [productFilters, productQuery, productSort, products]);

  const filteredPackages = useMemo(() => {
    const filters = packageFilters;
    const items = packages.filter((item) => {
      const matchesQuery =
        packageQuery.trim().length === 0 ||
        item.title.toLowerCase().includes(packageQuery.toLowerCase()) ||
        item.mini_description.toLowerCase().includes(packageQuery.toLowerCase());
      const matchesCategory = !filters.category || item.category === filters.category;
      const matchesPower =
        filters.powerRatings.length === 0 ||
        filters.powerRatings.includes(item.powerRating);
      const matchesFeatures =
        filters.features.length === 0 ||
        filters.features.every((feature) => item.features.includes(feature));
      const matchesAvailability =
        filters.availability.length === 0 ||
        filters.availability.includes(item.availability);
      const matchesPriceMin =
        !filters.priceMin || item.price >= Number(filters.priceMin);
      const matchesPriceMax =
        !filters.priceMax || item.price <= Number(filters.priceMax);
      const matchesWarranty = item.warrantyYears >= filters.warrantyMin;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesPower &&
        matchesFeatures &&
        matchesAvailability &&
        matchesPriceMin &&
        matchesPriceMax &&
        matchesWarranty
      );
    });

    return sortItems(items, packageSort);
  }, [packageFilters, packageQuery, packageSort, packages]);

  const activeFilters = activeTab === "products" ? productFilters : packageFilters;
  const setActiveFilters =
    activeTab === "products" ? setProductFilters : setPackageFilters;
  const activeSort = activeTab === "products" ? productSort : packageSort;
  const setActiveSort = activeTab === "products" ? setProductSort : setPackageSort;
  const activeView = activeTab === "products" ? productView : packageView;
  const setActiveView =
    activeTab === "products" ? setProductView : setPackageView;
  const activeQuery = activeTab === "products" ? productQuery : packageQuery;
  const setActiveQuery =
    activeTab === "products" ? setProductQuery : setPackageQuery;

  const resultsCount =
    activeTab === "products" ? filteredProducts.length : filteredPackages.length;
  const activeProductSection = productFilters.category || "All Products";

  return (
    <div className="min-h-screen bg-white py-22">
      <DashboardHeader query={activeQuery} onQueryChange={setActiveQuery} />

      <div className="mx-auto w-full max-w-6xl px-4 py-2  ">
        <div className="flex flex-col w-full lg:flex-row mt-26 lg:mt-0 lg:justify-between lg:items-center">
          {activeTab === "products" ? (
            <div className="order-2 lg:order-1 w-full flex flex-wrap items-center justify-center lg:justify-start gap-2 text-sm text-[#5A646B]">
              {productSections.map((section) => (
                <button
                  key={section}
                  onClick={() => {
                    setProductFilters((prev) => ({
                      ...prev,
                      category: section === "All Products" ? "" : section,
                    }));
                  }}
                  className={`rounded-full px-2 lg:px-3 py-1 transition-colors ${activeProductSection === section
                    ? "text-[#058A05] font-semibold"
                    : "hover:text-[#252C32]"
                    }`}
                >
                  {section}
                </button>
              ))}
            </div>
          ) : (
            <div className=""/>
          )}
          <div className="order-1 lg:order-2 flex flex-col gap-3 mb-5 lg:mb-0  lg:mt-0 ">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="inline-flex w-full lg:w-fit  rounded-lg mt-5 lg:mt-0 bg-[#F3F4F6]">
                <button
                  onClick={() => {
                    setActiveTab("packages");
                  }}
                  className={`px-4 py-3 lg:py-1.5 rounded-l-lg w-[50%] lg:w-fit text-sm ${activeTab === "packages"
                    ? "bg-[#058A05] text-white"
                    : "text-[#3B3B3B]"
                    }`}
                >
                  Packages
                </button>
                <button
                  onClick={() => {
                    setActiveTab("products");
                  }}
                  className={`px-4 py-3 lg:py-1.5 w-[50%] lg:w-fit rounded-r-lg text-sm ${activeTab === "products"
                    ? "bg-[#058A05] text-white"
                    : "text-[#3B3B3B]"
                    }`}
                >
                  Products
                </button>

              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col mt-6 lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            {activeQuery.trim().length > 0 ? (
              <p className="text-xl font-semibold text-[#252C32]">
                Found {resultsCount} results for{" "}
                <span className="text-[#058A05]">{activeQuery}</span>
              </p>
            ) : (
              <p className="text-xl font-semibold text-[#252C32]">
                {activeTab === "products" ? "All Products" : "All Packages"}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between lg:justify-start gap-3">
            <div className="relative">
              <select
                value={activeSort}
                onChange={(event) => setActiveSort(event.target.value)}
                className="h-10 rounded-lg border border-[#E4E9EC] bg-white px-3 pr-4 text-sm text-[#3B3B3B] outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    <span className="text-xs text-[#9AA6AC]">Sort by </span>{opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center  bg-gray-50 rounded-md">
              <button
                onClick={() => setActiveView("grid")}
                className={`h-9 w-9 rounded-l-md  grid place-items-center ${activeView === "grid"
                  ? "border-[#BFE8BF] bg-[#EBFAEB] "
                  : "border-[#E4E9EC]"
                  }`}
              >
                <CardViewIcon
                  className={
                    activeView === "grid"
                      ? "text-[#252C32]"
                      : "text-[#B0BABF]"
                  }
                />
              </button>
              <button
                onClick={() => setActiveView("list")}
                className={`h-9 w-9 rounded-r-md  grid place-items-center ${activeView === "list"
                  ? "border-[#BFE8BF] bg-[#EBFAEB] "
                  : "border-[#E4E9EC]"
                  }`}
              >
                <ListViewIcon
                  className={
                    activeView === "list"
                      ? "text-[#252C32]"
                      : "text-[#B0BABF]"
                  }
                />
              </button>
            </div>
          </div>
        </div>


        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">

          {isCategorySidebarOpen && (
            <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden" onClick={toggleCategorySidebar} />
          )}
          <aside
            className={`space-y-6 transition-all duration-300 ${isCategorySidebarOpen
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-4 pointer-events-none lg:hidden"
              } ${isCategorySidebarOpen
                ? "fixed left-0 top-0 z-50 lg:z-2 h-full w-80 overflow-y-auto bg-white px-4 py-14 shadow-lg lg:static lg:h-auto lg:w-auto lg:overflow-visible lg:bg-transparent lg:px-0 lg:pt-0 lg:shadow-none"
                : "hidden lg:static"
              }`}
          >
            <FilterSection title="Price, ₦">
              <div className="flex gap-3">
                <Input
                  placeholder="Min"
                  value={activeFilters.priceMin}
                  onChange={(event) =>
                    setActiveFilters((prev) => ({
                      ...prev,
                      priceMin: event.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Max"
                  value={activeFilters.priceMax}
                  onChange={(event) =>
                    setActiveFilters((prev) => ({
                      ...prev,
                      priceMax: event.target.value,
                    }))
                  }
                />
              </div>
            </FilterSection>
            <FilterSection title="Category">
              <div className="space-y-2">
                {(activeTab === "products" ? productCategories : packageCategories).map((cat) => (
                  <CheckboxItem
                    key={cat}
                    label={cat}
                    checked={activeFilters.category === (cat === "All" ? "" : cat)}
                    onChange={() =>
                      setActiveFilters((prev) => ({
                        ...prev,
                        category: cat === "All" ? "" : cat,
                      }))
                    }
                  />
                ))}
              </div>
            </FilterSection>
            <FilterSection title="Power Rating/ Capacity">
              <div className="space-y-2">
                {(activeTab === "products" ? powerRatingsProducts : powerRatingsPackages).map((rating) => (
                  <CheckboxItem
                    key={rating}
                    label={rating}
                    checked={activeFilters.powerRatings.includes(rating)}
                    onChange={() =>
                      setActiveFilters((prev) => ({
                        ...prev,
                        powerRatings: toggleArrayValue(prev.powerRatings, rating),
                      }))
                    }
                  />
                ))}
              </div>
            </FilterSection>
          </aside>

          <section
            className={`transition-all duration-300 ${isCategorySidebarOpen ? "" : "lg:col-span-2"
              }`}
          >
            {activeTab === "products" ? (
              filteredProducts.length > 0 ? (
                <ProductsGrid
                  items={filteredProducts}
                  view={productView}
                  favorites={favorites.products}
                  onToggleFavorite={toggleFavoriteProduct}
                  onGetQuote={(item) =>
                    setQuoteProduct({
                      id: item.id,
                      title: item.title,
                      image: item.image,
                      price: item.price,
                    })
                  }
                />
              ) : (
                <EmptyStatePanel
                  title={
                    isLoading
                      ? "Loading products"
                      : source === "unavailable"
                        ? "Products are unavailable right now"
                        : "No products found"
                  }
                  description={
                    isLoading
                      ? "We are fetching the latest product catalog for this page."
                      : source === "unavailable"
                        ? "The product catalog could not be reached. Check the API configuration and try again."
                        : "No products matched the current filters. Adjust your search or clear some filters to continue."
                  }
                  className="min-h-[22rem]"
                />
              )
            ) : (
              <>
                {filteredPackages.length > 0 ? (
                  <>
                    <PackagesGrid
                      items={filteredPackages}
                      view={packageView}
                      favorites={favorites.packages}
                      onToggleFavorite={toggleFavoritePackage}
                    />
                  </>
                ) : (
                  <EmptyStatePanel
                    title={
                      isLoading
                        ? "Loading packages"
                        : source === "unavailable"
                          ? "Packages are unavailable right now"
                          : "No packages found"
                    }
                    description={
                      isLoading
                        ? "We are fetching the latest package catalog for this page."
                        : source === "unavailable"
                          ? "The package catalog could not be reached. Check the API configuration and try again."
                          : "No packages matched the current filters. Adjust your search or clear some filters to continue."
                    }
                    className="min-h-[22rem]"
                  />
                )}
              </>
            )}
          </section>
        </div>
      </div>
      {quoteProduct && (
        <GetQuoteModal
          key={quoteProduct.id}
          open={!!quoteProduct}
          product={quoteProduct}
          onClose={() => setQuoteProduct(null)}
        />
      )}
    </div>
  );
};

export default DashboardProductsPackages;
