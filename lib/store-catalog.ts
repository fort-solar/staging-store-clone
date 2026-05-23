"use client";

import { useEffect, useState } from "react";
import { appGet } from "@/lib/api/client";
import type {
  ProductBatteryDetailApiResponse,
  ProductBatteryListApiResponse,
  ProductInverterDetailApiResponse,
  ProductInverterListApiResponse,
  ProductPackageDetailApiResponse,
  ProductPackageListApiResponse,
  ProductPanelDetailApiResponse,
  ProductPanelListApiResponse,
  ProductBatteryRecord,
  ProductInverterRecord,
  ProductPackageRecord,
  ProductPanelRecord,
  StoreAssetRecord,
  StoreCatalogPackage,
  StoreCatalogProduct,
  StorePackageItemRecord,
} from "@/types/api.types";

type CatalogResult = {
  products: StoreCatalogProduct[];
  packages: StoreCatalogPackage[];
  source: "api" | "unavailable";
};

const PRODUCT_IMAGE_FALLBACK = "/double_solar_panels.png";

let catalogCache: CatalogResult | null = null;
let catalogPromise: Promise<CatalogResult> | null = null;
const productDetailCache = new Map<string, StoreCatalogProduct | null>();
const packageDetailCache = new Map<string, StoreCatalogPackage | null>();

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

function readArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
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

  const productRecord = isRecord(record.product)
    ? (record.product as ProductPanelRecord | ProductInverterRecord | ProductBatteryRecord)
    : null;

  return {
    id: readString(record, ["id"]) || undefined,
    category_id: readString(record, ["category_id"]),
    category_name: readString(record, ["category_name", "category"], productRecord?.category_name || undefined),
    product_id: readString(record, ["product_id", "id"], productRecord?.id || ""),
    product_name: readString(record, ["product_name", "name"], productRecord?.name || `Product ${index + 1}`),
    quantity: readNumber(record, ["quantity"], 1),
    product: productRecord || null,
  };
}

function normalizeSectionValues(record: ProductPanelRecord | ProductInverterRecord | ProductBatteryRecord) {
  if (record.section_values?.length) {
    return record.section_values.map((item) => ({
      label: item.section_name,
      value: `${item.value}${item.unit ? ` ${item.unit}` : ""}`,
    }));
  }

  return [];
}

function normalizePanelProduct(panel: ProductPanelRecord): StoreCatalogProduct {
  const datasheet = normalizeAsset(panel.datasheet_url || null, `${panel.name} Datasheet`);
  const sectionValues = normalizeSectionValues(panel);
  const powerRating = panel.wattage ? `${panel.wattage}W` : panel.efficiency ? `${panel.efficiency}%` : "Standard";

  return {
    id: panel.id,
    title: panel.name,
    mini_description: panel.overview || panel.brand || panel.slug || "Solar panel",
    image: toImageUrl(panel.image_url),
    images: [toImageUrl(panel.image_url)],
    datasheet,
    price: panel.price,
    priceOriginal: Math.round(panel.price * 1.12),
    category: "Solar Products",
    categoryLabel: panel.category_name || "Panels",
    productType: "Solar Panel",
    powerRating,
    features: panel.efficiency ? [`${panel.efficiency}% Efficiency`] : [],
    availability: buildAvailability(panel.stock_quantity, panel.is_active),
    warrantyYears: 10,
    createdAt: panel.created_at,
    section: panel.category_name || "Panels",
    rating: 4.8,
    reviewsCount: 0,
    description: panel.overview || panel.name,
    quickSpecs: sectionValues.length
      ? sectionValues
      : [
          { label: "Brand", value: panel.brand || "Fortsolar" },
          { label: "Wattage", value: panel.wattage ? `${panel.wattage}W` : "N/A" },
          { label: "Voltage", value: panel.voltage ? `${panel.voltage}V` : "N/A" },
          { label: "Dimensions", value: panel.dimensions || "N/A" },
          { label: "Weight", value: panel.weight_kg ? `${panel.weight_kg}kg` : "N/A" },
        ],
    sectionValues,
    sourceType: "panel",
    sourceId: panel.id,
  };
}

function normalizeInverterProduct(inverter: ProductInverterRecord): StoreCatalogProduct {
  const datasheet = normalizeAsset(inverter.datasheet_url || null, `${inverter.name} Datasheet`);
  const sectionValues = normalizeSectionValues(inverter);
  const powerRating = inverter.capacity_kva ? `${inverter.capacity_kva}kVA` : inverter.type || "Standard";

  return {
    id: inverter.id,
    title: inverter.name,
    mini_description: inverter.overview || inverter.brand || inverter.type || "Solar inverter",
    image: toImageUrl(inverter.image_url),
    images: [toImageUrl(inverter.image_url)],
    datasheet,
    price: inverter.price,
    priceOriginal: Math.round(inverter.price * 1.12),
    category: "Solar Products",
    categoryLabel: inverter.category_name || "Inverters",
    productType: "Inverter",
    powerRating,
    features: inverter.efficiency ? [`${inverter.efficiency}% Efficiency`] : [],
    availability: buildAvailability(inverter.stock_quantity, inverter.is_active),
    warrantyYears: 8,
    createdAt: inverter.created_at,
    section: inverter.category_name || "Inverters",
    rating: 4.7,
    reviewsCount: 0,
    description: inverter.overview || inverter.name,
    quickSpecs: sectionValues.length
      ? sectionValues
      : [
          { label: "Brand", value: inverter.brand || "Fortsolar" },
          { label: "Type", value: inverter.type || "N/A" },
          { label: "Capacity", value: inverter.capacity_kva ? `${inverter.capacity_kva}kVA` : "N/A" },
          { label: "Efficiency", value: inverter.efficiency ? `${inverter.efficiency}%` : "N/A" },
          { label: "Voltage Range", value: inverter.voltage_range || "N/A" },
        ],
    sectionValues,
    sourceType: "inverter",
    sourceId: inverter.id,
  };
}

function normalizeBatteryProduct(battery: ProductBatteryRecord): StoreCatalogProduct {
  const datasheet = normalizeAsset(battery.datasheet_url || null, `${battery.name} Datasheet`);
  const sectionValues = normalizeSectionValues(battery);
  const powerRating = battery.capacity_ah ? `${battery.capacity_ah}Ah` : battery.type || "Standard";

  return {
    id: battery.id,
    title: battery.name,
    mini_description: battery.overview || battery.brand || battery.type || "Solar battery",
    image: toImageUrl(battery.image_url),
    images: [toImageUrl(battery.image_url)],
    datasheet,
    price: battery.price,
    priceOriginal: Math.round(battery.price * 1.12),
    category: "Solar Products",
    categoryLabel: battery.category_name || "Batteries",
    productType: "Battery",
    powerRating,
    features: battery.cycle_life ? [`${battery.cycle_life} Cycle Life`] : [],
    availability: buildAvailability(battery.stock_quantity, battery.is_active),
    warrantyYears: 10,
    createdAt: battery.created_at,
    section: battery.category_name || "Batteries",
    rating: 4.7,
    reviewsCount: 0,
    description: battery.overview || battery.name,
    quickSpecs: sectionValues.length
      ? sectionValues
      : [
          { label: "Brand", value: battery.brand || "Fortsolar" },
          { label: "Type", value: battery.type || "N/A" },
          { label: "Capacity", value: battery.capacity_ah ? `${battery.capacity_ah}Ah` : "N/A" },
          { label: "Voltage", value: battery.voltage ? `${battery.voltage}V` : "N/A" },
          { label: "Cycle Life", value: battery.cycle_life ? `${battery.cycle_life}` : "N/A" },
        ],
    sectionValues,
    sourceType: "battery",
    sourceId: battery.id,
  };
}

function normalizePackage(item: ProductPackageRecord): StoreCatalogPackage {
  const raw = item as unknown as Record<string, unknown>;
  const includedProducts = (item.items ?? readArray(raw, ["items", "products"]))
    .map((candidate, index) => normalizePackageItem(candidate, index))
    .filter((candidate): candidate is StorePackageItemRecord => Boolean(candidate));
  const packageImage = toImageUrl(item.package_image_url || item.image_url);
  const thumbnail = toImageUrl(item.thumbnail_url || item.image_url);
  const productImages = [
    ...((item.product_images ?? readArray(raw, ["product_images"])) as string[]),
    ...includedProducts.map((product) => product.product?.image_url || null).filter((value): value is string => Boolean(value)),
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
    powers: item.what_it_powers?.length ? item.what_it_powers : ["Lighting", "Home and office electronics", item.battery_included ? "Backup during outages" : "Daytime solar loads"],
    solarFinanceEnabled: Boolean(item.solar_finance_enabled),
    discountPercentage,
    includedProducts: includedProducts.map((product) => ({
      id: product.product_id,
      categoryLabel: product.category_name || product.product?.category_name || "Product Category",
      productName: product.product_name || "Product",
      quantity: product.quantity,
      image: product.product?.image_url || null,
      datasheet: normalizeAsset(product.product?.datasheet_url || null, `${product.product_name || "Product"} Datasheet`),
    })),
    sourceType: "package",
    sourceId: item.id,
  };
}

async function safeAppGet<T>(path: string) {
  try {
    return await appGet<T>(path);
  } catch {
    return null;
  }
}

async function fetchCatalogFromApi(): Promise<CatalogResult> {
  const [packagesPayload, bundlesPayload, panelsPayload, invertersPayload, batteriesPayload] =
    await Promise.all([
      appGet<ProductPackageListApiResponse>("/api/v1/products/packages"),
      safeAppGet<ProductPackageListApiResponse>("/api/v1/products/bundles"),
      appGet<ProductPanelListApiResponse>("/api/v1/products/panels"),
      appGet<ProductInverterListApiResponse>("/api/v1/products/inverters"),
      appGet<ProductBatteryListApiResponse>("/api/v1/products/batteries"),
    ]);

  return {
    products: [
      ...panelsPayload.data.map(normalizePanelProduct),
      ...invertersPayload.data.map(normalizeInverterProduct),
      ...batteriesPayload.data.map(normalizeBatteryProduct),
    ],
    packages: [
      ...packagesPayload.data.map(normalizePackage),
      ...(bundlesPayload?.success ? bundlesPayload.data.map(normalizePackage) : []),
    ].filter((item, index, all) => all.findIndex((candidate) => String(candidate.id) === String(item.id)) === index),
    source: "api",
  };
}

export async function getStoreCatalog() {
  if (catalogCache) {
    return catalogCache;
  }

  if (catalogPromise) {
    return catalogPromise;
  }

  catalogPromise = fetchCatalogFromApi()
    .catch(() => ({
      products: [],
      packages: [],
      source: "unavailable" as const,
    }))
    .then((result) => {
      catalogCache = result;
      return result;
    })
    .finally(() => {
      catalogPromise = null;
    });

  return catalogPromise;
}

export function getFallbackCatalog() {
  return {
    products: [],
    packages: [],
    source: "unavailable" as const,
  };
}

export async function getStoreProductById(id: string) {
  if (productDetailCache.has(id)) {
    return productDetailCache.get(id) ?? null;
  }

  const [panelPayload, inverterPayload, batteryPayload] = await Promise.all([
    safeAppGet<ProductPanelDetailApiResponse>(`/api/v1/products/panels/${id}`),
    safeAppGet<ProductInverterDetailApiResponse>(`/api/v1/products/inverters/${id}`),
    safeAppGet<ProductBatteryDetailApiResponse>(`/api/v1/products/batteries/${id}`),
  ]);

  const resolvedProduct =
    (panelPayload?.success ? normalizePanelProduct(panelPayload.data) : null) ??
    (inverterPayload?.success ? normalizeInverterProduct(inverterPayload.data) : null) ??
    (batteryPayload?.success ? normalizeBatteryProduct(batteryPayload.data) : null) ??
    (await getStoreCatalog()).products.find((item) => String(item.id) === id) ??
    null;

  productDetailCache.set(id, resolvedProduct);
  return resolvedProduct;
}

export async function getStorePackageById(id: string) {
  if (packageDetailCache.has(id)) {
    return packageDetailCache.get(id) ?? null;
  }

  const [packagePayload, bundlePayload] = await Promise.all([
    safeAppGet<ProductPackageDetailApiResponse>(`/api/v1/products/packages/${id}`),
    safeAppGet<ProductPackageDetailApiResponse>(`/api/v1/products/bundles/${id}`),
  ]);

  const resolvedPackage =
    (packagePayload?.success ? normalizePackage(packagePayload.data) : null) ??
    (bundlePayload?.success ? normalizePackage(bundlePayload.data) : null) ??
    (await getStoreCatalog()).packages.find((item) => String(item.id) === id) ??
    null;

  packageDetailCache.set(id, resolvedPackage);
  return resolvedPackage;
}

export function useStoreCatalog() {
  const [catalog, setCatalog] = useState<CatalogResult>(catalogCache ?? getFallbackCatalog());
  const [isLoading, setIsLoading] = useState(catalogCache === null);

  useEffect(() => {
    let cancelled = false;

    getStoreCatalog()
      .then((result) => {
        if (!cancelled) {
          setCatalog(result);
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
    ...catalog,
    isLoading,
  };
}

export function useStoreProductById(id: string | undefined) {
  const [product, setProduct] = useState<StoreCatalogProduct | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getStoreProductById(id)
      .then((result) => {
        if (!cancelled) {
          setProduct(result);
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
  }, [id]);

  return {
    product,
    isLoading,
  };
}

export function useStorePackageById(id: string | undefined) {
  const [pkg, setPackage] = useState<StoreCatalogPackage | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;

    getStorePackageById(id)
      .then((result) => {
        if (!cancelled) {
          setPackage(result);
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
  }, [id]);

  return {
    package: pkg,
    isLoading,
  };
}
