"use client";

import { useEffect, useMemo, useState } from "react";
import { AppRequestError, appGet } from "@/lib/api/client";
import type {
  PaginationMeta,
  ProductCategoryListApiResponse,
  ProductPackageDetailApiResponse,
  ProductPackageListApiResponse,
  ProductPackageRecord,
  StoreAssetRecord,
  StoreCatalogPackage,
  StoreCatalogProduct,
  StorePackageItemRecord,
  UnifiedProductDetailApiResponse,
  UnifiedProductListApiResponse,
  UnifiedProductRecord,
} from "@/types/api.types";

export type StoreCatalogSource = "api" | "unavailable";

export type StoreCatalogCategoryOption = {
  id: string;
  label: string;
};

export const STORE_PAGE_SIZE = 20;

type StoreCatalogListResult<TItem> = {
  items: TItem[];
  pagination: PaginationMeta;
  source: StoreCatalogSource;
};

export type StoreProductListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  categoryId?: string;
};

export type StorePackageListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  status?: string;
};

const PRODUCT_IMAGE_FALLBACK = "/double_solar_panels.png";
let productCategoryOptionsCache: StoreCatalogCategoryOption[] | null = null;
let productCategoryOptionsPromise: Promise<StoreCatalogCategoryOption[]> | null = null;
const productDetailCache = new Map<string, StoreCatalogProduct | null>();
const packageDetailCache = new Map<string, StoreCatalogPackage | null>();

export function resetStoreCatalogCaches() {
  productCategoryOptionsCache = null;
  productCategoryOptionsPromise = null;
  productDetailCache.clear();
  packageDetailCache.clear();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return fallback;
}

function readNumber(record: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function readNullableNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readBoolean(record: Record<string, unknown>, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value > 0;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();

      if (["true", "1", "yes"].includes(normalized)) {
        return true;
      }

      if (["false", "0", "no"].includes(normalized)) {
        return false;
      }
    }
  }

  return fallback;
}

function readArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

function readStringArray(record: Record<string, unknown>, keys: string[]) {
  return readArray(record, keys)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function withQuery(
  path: string,
  params: Record<string, string | number | boolean | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function createPaginationMeta(
  page: number,
  limit: number,
  total = 0,
  totalPages = total > 0 ? Math.ceil(total / Math.max(limit, 1)) : 0,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages,
  };
}

function normalizePaginationMeta(
  pagination: PaginationMeta | undefined,
  page: number,
  limit: number,
  totalItems: number,
) {
  if (pagination) {
    return {
      page: Number.isFinite(pagination.page) ? pagination.page : page,
      limit: Number.isFinite(pagination.limit) ? pagination.limit : limit,
      total: Number.isFinite(pagination.total) ? pagination.total : totalItems,
      totalPages: Number.isFinite(pagination.totalPages)
        ? pagination.totalPages
        : totalItems > 0
          ? Math.ceil(totalItems / Math.max(limit, 1))
          : 0,
    };
  }

  return createPaginationMeta(page, limit, totalItems);
}

function toImageUrl(value: string | { src?: string } | null | undefined) {
  if (!value) {
    return PRODUCT_IMAGE_FALLBACK;
  }

  if (typeof value === "string") {
    return value;
  }

  return value.src ?? PRODUCT_IMAGE_FALLBACK;
}

function collectProductImagesFromRecord(raw: Record<string, unknown>) {
  const mediaRecord = isRecord(raw.media) ? raw.media : null;
  const mediaImageUrls = mediaRecord ? readStringArray(mediaRecord, ["image_urls"]) : [];
  const explicitImages = readStringArray(raw, ["product_image_urls", "image_urls", "images"]);
  const fallbackImage = readString(raw, ["product_image_url", "image_url", "image"]);

  const imageUrls = [...explicitImages, ...mediaImageUrls, fallbackImage]
    .filter(Boolean)
    .map((value) => toImageUrl(value))
    .filter((value, index, all) => all.indexOf(value) === index);

  return imageUrls.length ? imageUrls : [PRODUCT_IMAGE_FALLBACK];
}

function collectProductImages(product: UnifiedProductRecord) {
  return collectProductImagesFromRecord(product as unknown as Record<string, unknown>);
}

function getPrimaryProductImage(product: UnifiedProductRecord | null | undefined) {
  if (!product) {
    return null;
  }

  return collectProductImages(product)[0] ?? null;
}

function buildAvailability(stockQuantity: number | undefined, isActive = true) {
  if (!isActive) {
    return "Unavailable";
  }

  if ((stockQuantity ?? 0) <= 0) {
    return "Out Of Stock";
  }

  if ((stockQuantity ?? 0) < 5) {
    return "Limited Stock";
  }

  return "In Stock";
}

function truncateWords(value: string, limit: number) {
  const normalized = value.trim();

  if (!normalized) {
    return "";
  }

  const words = normalized.split(/\s+/);

  if (words.length <= limit) {
    return normalized;
  }

  return `${words.slice(0, limit).join(" ")}...`;
}

function inferAssetKind(source: string, mimeType?: string | null) {
  const normalizedSource = source.toLowerCase();
  const normalizedMime = mimeType?.toLowerCase() ?? "";

  if (normalizedMime.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/.test(normalizedSource)) {
    return "image" as const;
  }

  if (normalizedMime.includes("pdf") || normalizedSource.endsWith(".pdf")) {
    return "pdf" as const;
  }

  return "file" as const;
}

function normalizeAsset(record: unknown, fallbackName: string): StoreAssetRecord | null {
  if (typeof record === "string" && record.trim()) {
    return {
      name: fallbackName,
      url: record.trim(),
      kind: inferAssetKind(record.trim()),
    };
  }

  if (!isRecord(record)) {
    return null;
  }

  const url = readString(record, ["url", "file_url", "image_url", "datasheet_url", "href"]);
  if (!url) {
    return null;
  }

  const mimeType = readString(record, ["mime_type", "mimeType"]) || null;

  return {
    id: readString(record, ["id"]) || undefined,
    name: readString(record, ["name", "filename", "title"], fallbackName),
    url,
    mime_type: mimeType,
    kind: inferAssetKind(url, mimeType),
  };
}

function normalizePackageItem(record: unknown, index: number): StorePackageItemRecord | null {
  if (!isRecord(record)) {
    return null;
  }

  const productRecord = isRecord(record.product) ? (record.product as UnifiedProductRecord) : null;

  return {
    id: readString(record, ["id"]) || undefined,
    category_id: readString(record, ["category_id"]),
    category_name: readString(record, ["category_name", "category"], productRecord?.category?.name || undefined),
    product_id: readString(record, ["product_id", "id"], productRecord?.id || ""),
    product_name: readString(record, ["product_name", "name"], productRecord?.name || `Product ${index + 1}`),
    quantity: readNumber(record, ["quantity"], 1),
    product: productRecord || null,
  };
}

function normalizeSectionValues(record: UnifiedProductRecord) {
  if (record.section_values?.length) {
    return record.section_values.map((item) => ({
      label: item.section_name,
      value: `${item.value}${item.unit ? ` ${item.unit}` : ""}`,
    }));
  }

  return [];
}

function inferPowerRating(product: UnifiedProductRecord, sectionValues: Array<{ label: string; value: string }>) {
  const prioritizedMatch = sectionValues.find((item) =>
    /(size|capacity|power|rating|watt|kw|kva|ah|voltage)/i.test(item.label),
  );

  return prioritizedMatch?.value || product.category?.name || "Standard";
}

export function normalizeUnifiedProduct(product: UnifiedProductRecord): StoreCatalogProduct {
  const raw = product as unknown as Record<string, unknown>;
  const datasheet = normalizeAsset(product.datasheet_url || null, `${product.name} Datasheet`);
  const sectionValues = normalizeSectionValues(product);
  const categoryLabel = product.category?.name || "Uncategorised";
  const productImages = collectProductImages(product);
  const discountedPrice = readNullableNumber(raw, ["discounted_price", "sale_price", "offer_price"]);
  const effectivePrice =
    discountedPrice && discountedPrice > 0 && discountedPrice < product.price
      ? discountedPrice
      : product.price;
  const deliveryWarrantyInfo =
    readString(raw, ["delivery_warranty_info", "delivery_and_warranty_info"], "") || null;
  const freeDelivery = readBoolean(raw, ["free_delivery", "is_free_delivery"]);
  const eligibleForInstallation = readBoolean(raw, ["eligible_for_installation"]);
  const description = product.overview || product.name;

  return {
    id: product.id,
    title: product.name,
    mini_description: truncateWords(description || product.slug || categoryLabel, 50),
    image: productImages[0],
    images: productImages,
    datasheet,
    price: effectivePrice,
    priceOriginal: product.price,
    stockQuantity: Math.max(0, product.stock_quantity),
    categoryId: product.category_id,
    category: categoryLabel,
    categoryLabel,
    productType: categoryLabel,
    powerRating: inferPowerRating(product, sectionValues),
    features: sectionValues.slice(0, 3).map((item) => `${item.label}: ${item.value}`),
    availability: buildAvailability(product.stock_quantity, product.is_active),
    warrantyYears: readNumber(raw, ["warranty_years"], 10),
    createdAt: product.created_at,
    section: categoryLabel,
    rating: 4.8,
    reviewsCount: 0,
    description,
    freeDelivery,
    deliveryWarrantyInfo,
    eligibleForInstallation,
    quickSpecs: sectionValues.length ? sectionValues : [{ label: "Category", value: categoryLabel }],
    sectionValues,
    isActive: product.is_active,
    sourceType: "product",
    sourceId: product.id,
  };
}

export function normalizePackage(item: ProductPackageRecord): StoreCatalogPackage {
  const raw = item as unknown as Record<string, unknown>;
  const includedProducts = (item.items ?? readArray(raw, ["items", "products"]))
    .map((candidate, index) => normalizePackageItem(candidate, index))
    .filter((candidate): candidate is StorePackageItemRecord => Boolean(candidate));
  const includedProductImages = includedProducts
    .map((product) => getPrimaryProductImage(product.product))
    .filter((value): value is string => Boolean(value));
  const packageImage = toImageUrl(item.package_image_url || item.image_url);
  const thumbnail = toImageUrl(item.thumbnail_url || item.image_url);
  const productImages = [
    ...((item.product_images ?? readArray(raw, ["product_images"])) as string[]),
    ...includedProductImages,
  ].map((value) => toImageUrl(value)).filter((value, index, all) => all.indexOf(value) === index);
  const datasheetCandidates = [
    ...((item.datasheets ?? readArray(raw, ["datasheets"])) as unknown[]).map((asset, index) => normalizeAsset(asset, `Datasheet ${index + 1}`)),
    ...includedProducts.map((product) => normalizeAsset(product.product?.datasheet_url || null, `${product.product_name || "Product"} Datasheet`)),
  ].filter((asset): asset is StoreAssetRecord => Boolean(asset));
  const datasheets = datasheetCandidates.filter((asset, index, all) => all.findIndex((candidate) => candidate.url === asset.url) === index);
  const discountPercentage = item.discount_percentage ?? readNumber(raw, ["discount_percentage", "discount"]);
  const finalPrice = Math.max(0, item.price - (item.price * discountPercentage) / 100);

  return {
    id: item.id,
    title: item.name,
    mini_description: item.overview || item.description || `${item.name} solar solution`,
    image: thumbnail,
    thumbnail,
    mainImage: packageImage,
    galleryImages: [packageImage, ...productImages].filter((value, index, all) => all.indexOf(value) === index),
    datasheets,
    price: item.price,
    finalPrice,
    isActive: item.is_active,
    category: "Solar Packages",
    packageType: "Package",
    powerRating: item.system_details?.pv_label || item.system_details?.inverter_label || (item.system_size_kw ? `${item.system_size_kw}kW` : "Standard"),
    features: [
      item.solar_finance_enabled ? "Solar Finance" : "Direct Purchase",
      discountPercentage ? `${discountPercentage}% Discount` : "Standard Pricing",
    ],
    availability: item.is_active ? "In Stock" : "Unavailable",
    warrantyYears: item.warranty_years || 5,
    createdAt: item.created_at,
    rating: 4.8,
    reviewsCount: 0,
    overview: item.overview || item.description || `${item.name} solar package.`,
    packageIncludes: includedProducts.length
      ? includedProducts.map((product) => ({
          label: product.product_name || "Product",
          qty: `x${product.quantity}`,
        }))
      : [
          { label: `${item.number_of_panels || 0} Panels`, qty: `${item.number_of_panels || 0}` },
          { label: item.panel_type || "Panel Type", qty: "Included" },
          { label: item.inverter_type || "Inverter", qty: "Included" },
          { label: "Battery Storage", qty: item.battery_included ? "Included" : "Optional" },
        ],
    systemDetails: [
      item.system_details?.inverter_label ? `Inverter Size: ${item.system_details.inverter_label}` : item.system_size_kw ? `System Size: ${item.system_size_kw}kW` : "System Size: N/A",
      item.system_details?.pv_label ? `PV Size: ${item.system_details.pv_label}` : item.estimated_savings_monthly ? `Monthly Savings Estimate: ₦${item.estimated_savings_monthly}` : "Monthly Savings Estimate: N/A",
      item.system_details?.battery_label ? `Battery Size: ${item.system_details.battery_label}` : item.payback_period_years ? `Payback Period: ${item.payback_period_years} years` : "Battery Size: N/A",
    ],
    installationSpecifications: {
      inverter_size: item.system_details?.inverter_size,
      inverter_label: item.system_details?.inverter_label,
      pv_size: item.system_details?.pv_size,
      pv_label: item.system_details?.pv_label,
      battery_size: item.system_details?.battery_size,
      battery_label: item.system_details?.battery_label,
    },
    powers: item.what_it_powers?.length ? item.what_it_powers : ["Lighting", "Home and office electronics", item.battery_included ? "Backup during outages" : "Daytime solar loads"],
    solarFinanceEnabled: Boolean(item.solar_finance_enabled),
    discountPercentage,
    includedProducts: includedProducts.map((product) => ({
      id: product.product_id,
      categoryLabel: product.category_name || product.product?.category?.name || "Product Category",
      productName: product.product_name || "Product",
      quantity: product.quantity,
      image: getPrimaryProductImage(product.product),
      datasheet: normalizeAsset(product.product?.datasheet_url || null, `${product.product_name || "Product"} Datasheet`),
    })),
    sourceType: "package",
    sourceId: item.id,
  };
}

function resolvePageNumber(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

function resolvePageSize(value: number | undefined, fallback = STORE_PAGE_SIZE) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}

export async function listStoreProducts(
  query: StoreProductListQuery = {},
): Promise<StoreCatalogListResult<StoreCatalogProduct>> {
  const page = resolvePageNumber(query.page);
  const limit = resolvePageSize(query.limit);
  const payload = await appGet<UnifiedProductListApiResponse>(
    withQuery("/api/v1/products/", {
      page,
      limit,
      search: query.search?.trim(),
      category_id: query.categoryId,
      is_active:
        typeof query.isActive === "boolean" ? String(query.isActive) : undefined,
    }),
  );
  const items = payload.data.map(normalizeUnifiedProduct);

  return {
    items,
    pagination: normalizePaginationMeta(payload.pagination, page, limit, items.length),
    source: "api",
  };
}

export async function listStorePackages(
  query: StorePackageListQuery = {},
): Promise<StoreCatalogListResult<StoreCatalogPackage>> {
  const page = resolvePageNumber(query.page);
  const limit = resolvePageSize(query.limit);
  const payload = await appGet<ProductPackageListApiResponse>(
    withQuery("/api/v1/products/packages", {
      page,
      limit,
      search: query.search?.trim(),
      status: query.status?.trim(),
      is_active:
        typeof query.isActive === "boolean" ? String(query.isActive) : undefined,
    }),
  );
  const items = payload.data.map(normalizePackage);

  return {
    items,
    pagination: normalizePaginationMeta(payload.pagination, page, limit, items.length),
    source: "api",
  };
}

async function fetchStoreProductCategoryOptions() {
  const firstPage = await appGet<ProductCategoryListApiResponse>(
    withQuery("/api/v1/product-categories", {
      page: 1,
      limit: STORE_PAGE_SIZE,
    }),
  );
  const categories = new Map<string, StoreCatalogCategoryOption>();

  firstPage.data.forEach((item) => {
    if (!item.id || !item.name) {
      return;
    }

    categories.set(item.id, {
      id: item.id,
      label: item.name,
    });
  });

  const totalPages = Math.max(firstPage.pagination?.totalPages ?? 0, 1);

  if (totalPages > 1) {
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        appGet<ProductCategoryListApiResponse>(
          withQuery("/api/v1/product-categories", {
            page: index + 2,
            limit: STORE_PAGE_SIZE,
          }),
        ).catch(() => null),
      ),
    );

    remainingPages.forEach((payload) => {
      payload?.data.forEach((item) => {
        if (!item.id || !item.name) {
          return;
        }

        categories.set(item.id, {
          id: item.id,
          label: item.name,
        });
      });
    });
  }

  return Array.from(categories.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
}

export async function getStoreProductCategoryOptions() {
  if (productCategoryOptionsCache) {
    return productCategoryOptionsCache;
  }

  if (productCategoryOptionsPromise) {
    return productCategoryOptionsPromise;
  }

  productCategoryOptionsPromise = fetchStoreProductCategoryOptions()
    .catch(() => [])
    .then((result) => {
      productCategoryOptionsCache = result;
      return result;
    })
    .finally(() => {
      productCategoryOptionsPromise = null;
    });

  return productCategoryOptionsPromise;
}

type StoreCatalogLookupResult<TItem> = {
  item: TItem | null;
  status: "found" | "missing" | "error";
};

async function getStoreProductLookupResult(id: string): Promise<StoreCatalogLookupResult<StoreCatalogProduct>> {
  if (productDetailCache.has(id)) {
    const cachedProduct = productDetailCache.get(id) ?? null;

    return {
      item: cachedProduct,
      status: cachedProduct ? "found" : "missing",
    };
  }

  try {
    const productPayload = await appGet<UnifiedProductDetailApiResponse>(`/api/v1/products/${id}`);
    const resolvedProduct = productPayload.success
      ? normalizeUnifiedProduct(productPayload.data)
      : null;

    productDetailCache.set(id, resolvedProduct);

    return {
      item: resolvedProduct,
      status: resolvedProduct ? "found" : "missing",
    };
  } catch (error) {
    if (error instanceof AppRequestError && error.status === 404) {
      productDetailCache.set(id, null);

      return {
        item: null,
        status: "missing",
      };
    }

    return {
      item: null,
      status: "error",
    };
  }
}

export async function getStoreProductById(id: string) {
  return (await getStoreProductLookupResult(id)).item;
}

async function getStorePackageLookupResult(id: string): Promise<StoreCatalogLookupResult<StoreCatalogPackage>> {
  if (packageDetailCache.has(id)) {
    const cachedPackage = packageDetailCache.get(id) ?? null;

    return {
      item: cachedPackage,
      status: cachedPackage ? "found" : "missing",
    };
  }

  try {
    const packagePayload = await appGet<ProductPackageDetailApiResponse>(
      `/api/v1/products/packages/${id}`,
    );
    const resolvedPackage = packagePayload.success ? normalizePackage(packagePayload.data) : null;

    packageDetailCache.set(id, resolvedPackage);

    return {
      item: resolvedPackage,
      status: resolvedPackage ? "found" : "missing",
    };
  } catch (error) {
    if (error instanceof AppRequestError && error.status === 404) {
      packageDetailCache.set(id, null);

      return {
        item: null,
        status: "missing",
      };
    }

    return {
      item: null,
      status: "error",
    };
  }
}

export async function getStorePackageById(id: string) {
  return (await getStorePackageLookupResult(id)).item;
}

type StoreCatalogListHookState<TItem> = StoreCatalogListResult<TItem> & {
  requestKey: string;
};

function createCatalogListHookState<TItem>(
  page: number,
  limit: number,
  requestKey: string,
): StoreCatalogListHookState<TItem> {
  return {
    items: [],
    pagination: createPaginationMeta(page, limit),
    source: "api",
    requestKey,
  };
}

export function useStoreProducts(query: StoreProductListQuery = {}) {
  const page = resolvePageNumber(query.page);
  const limit = resolvePageSize(query.limit);
  const search = query.search?.trim() || undefined;
  const categoryId = query.categoryId || undefined;
  const isActive = query.isActive;
  const requestKey = JSON.stringify({
    page,
    limit,
    search: search ?? "",
    categoryId: categoryId ?? "",
    isActive: isActive === undefined ? "" : String(isActive),
  });
  const [state, setState] = useState<StoreCatalogListHookState<StoreCatalogProduct>>(
    () => createCatalogListHookState(page, limit, ""),
  );

  useEffect(() => {
    let cancelled = false;

    listStoreProducts({
      page,
      limit,
      search,
      categoryId,
      isActive,
    })
      .then((result) => {
        if (!cancelled) {
          setState({
            ...result,
            requestKey,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            items: [],
            pagination: createPaginationMeta(page, limit),
            source: "unavailable",
            requestKey,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categoryId, isActive, limit, page, requestKey, search]);

  const isLoading = state.requestKey !== requestKey;

  return {
    items: isLoading ? [] : state.items,
    pagination: isLoading ? createPaginationMeta(page, limit) : state.pagination,
    source: isLoading ? "api" : state.source,
    isLoading,
  };
}

export function useStorePackages(query: StorePackageListQuery = {}) {
  const page = resolvePageNumber(query.page);
  const limit = resolvePageSize(query.limit);
  const search = query.search?.trim() || undefined;
  const isActive = query.isActive;
  const status = query.status?.trim() || undefined;
  const requestKey = JSON.stringify({
    page,
    limit,
    search: search ?? "",
    status: status ?? "",
    isActive: isActive === undefined ? "" : String(isActive),
  });
  const [state, setState] = useState<StoreCatalogListHookState<StoreCatalogPackage>>(
    () => createCatalogListHookState(page, limit, ""),
  );

  useEffect(() => {
    let cancelled = false;

    listStorePackages({
      page,
      limit,
      search,
      isActive,
      status,
    })
      .then((result) => {
        if (!cancelled) {
          setState({
            ...result,
            requestKey,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            items: [],
            pagination: createPaginationMeta(page, limit),
            source: "unavailable",
            requestKey,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isActive, limit, page, requestKey, search, status]);

  const isLoading = state.requestKey !== requestKey;

  return {
    items: isLoading ? [] : state.items,
    pagination: isLoading ? createPaginationMeta(page, limit) : state.pagination,
    source: isLoading ? "api" : state.source,
    isLoading,
  };
}

export function useStoreProductCategoryOptions() {
  const [categories, setCategories] = useState<StoreCatalogCategoryOption[]>(
    productCategoryOptionsCache ?? [],
  );
  const [isLoading, setIsLoading] = useState(productCategoryOptionsCache === null);

  useEffect(() => {
    let cancelled = false;

    getStoreProductCategoryOptions()
      .then((result) => {
        if (!cancelled) {
          setCategories(result);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    categories,
    isLoading,
  };
}

export function useStoreProductById(id: string | undefined) {
  const requestKey = id ?? "";
  const [state, setState] = useState<{
    product: StoreCatalogProduct | null;
    requestKey: string;
  }>({
    product: null,
    requestKey: "",
  });

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getStoreProductById(id)
      .then((result) => {
        if (!cancelled) {
          setState({
            product: result,
            requestKey,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            product: null,
            requestKey,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, requestKey]);

  const isLoading = Boolean(id) && state.requestKey !== requestKey;

  return {
    product: isLoading ? null : state.product,
    isLoading,
  };
}

export function useStorePackageById(id: string | undefined) {
  const requestKey = id ?? "";
  const [state, setState] = useState<{
    package: StoreCatalogPackage | null;
    requestKey: string;
  }>({
    package: null,
    requestKey: "",
  });

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getStorePackageById(id)
      .then((result) => {
        if (!cancelled) {
          setState({
            package: result,
            requestKey,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({
            package: null,
            requestKey,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, requestKey]);

  const isLoading = Boolean(id) && state.requestKey !== requestKey;

  return {
    package: isLoading ? null : state.package,
    isLoading,
  };
}

async function getStoreProductsByIds(ids: string[]) {
  const records = await Promise.all(ids.map((id) => getStoreProductLookupResult(id)));

  return {
    items: records
      .map((record) => record.item)
      .filter((item): item is StoreCatalogProduct => Boolean(item)),
    hasError: records.some((record) => record.status === "error"),
  };
}

async function getStorePackagesByIds(ids: string[]) {
  const records = await Promise.all(ids.map((id) => getStorePackageLookupResult(id)));

  return {
    items: records
      .map((record) => record.item)
      .filter((item): item is StoreCatalogPackage => Boolean(item)),
    hasError: records.some((record) => record.status === "error"),
  };
}

type StoreCatalogItemsByIdsState<TItem> = {
  items: TItem[];
  hasError: boolean;
  requestKey: string;
};

function createStoreCatalogItemsByIdsState<TItem>(
  requestKey: string,
): StoreCatalogItemsByIdsState<TItem> {
  return {
    items: [],
    hasError: false,
    requestKey,
  };
}

function normalizeIds(ids: Array<string | number>) {
  return Array.from(new Set(ids.map((id) => String(id).trim()).filter(Boolean)));
}

export function useStoreProductsByIds(ids: Array<string | number>) {
  const normalizedIds = useMemo(() => normalizeIds(ids), [ids]);
  const requestKey = normalizedIds.join("|");
  const [state, setState] = useState<StoreCatalogItemsByIdsState<StoreCatalogProduct>>(
    () => createStoreCatalogItemsByIdsState(""),
  );

  useEffect(() => {
    if (normalizedIds.length === 0) {
      return;
    }

    let cancelled = false;

    getStoreProductsByIds(normalizedIds)
      .then((result) => {
        if (!cancelled) {
          setState({
            items: result.items,
            hasError: result.hasError,
            requestKey,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState(createStoreCatalogItemsByIdsState(requestKey));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedIds, requestKey]);

  const isLoading = normalizedIds.length > 0 && state.requestKey !== requestKey;

  return {
    items: requestKey ? (isLoading ? [] : state.items) : [],
    isLoading,
    hasError: requestKey ? (isLoading ? false : state.hasError) : false,
  };
}

export function useStorePackagesByIds(ids: Array<string | number>) {
  const normalizedIds = useMemo(() => normalizeIds(ids), [ids]);
  const requestKey = normalizedIds.join("|");
  const [state, setState] = useState<StoreCatalogItemsByIdsState<StoreCatalogPackage>>(
    () => createStoreCatalogItemsByIdsState(""),
  );

  useEffect(() => {
    if (normalizedIds.length === 0) {
      return;
    }

    let cancelled = false;

    getStorePackagesByIds(normalizedIds)
      .then((result) => {
        if (!cancelled) {
          setState({
            items: result.items,
            hasError: result.hasError,
            requestKey,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState(createStoreCatalogItemsByIdsState(requestKey));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedIds, requestKey]);

  const isLoading = normalizedIds.length > 0 && state.requestKey !== requestKey;

  return {
    items: requestKey ? (isLoading ? [] : state.items) : [],
    isLoading,
    hasError: requestKey ? (isLoading ? false : state.hasError) : false,
  };
}
