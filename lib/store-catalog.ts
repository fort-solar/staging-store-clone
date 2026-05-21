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
  StoreCatalogPackage,
  StoreCatalogProduct,
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

function buildPowerRating(...values: Array<number | string | null | undefined>) {
  const firstValue = values.find((value) => value !== null && value !== undefined && value !== "");
  return firstValue ? String(firstValue) : "Standard";
}

function normalizePanelProduct(panel: ProductPanelRecord): StoreCatalogProduct {
  return {
    id: panel.id,
    title: panel.name,
    mini_description: panel.brand || panel.slug || "Solar panel",
    image: toImageUrl(panel.image_url),
    images: [toImageUrl(panel.image_url)],
    price: panel.price,
    priceOriginal: Math.round(panel.price * 1.12),
    category: "Solar Products",
    productType: "Solar Panel",
    powerRating: buildPowerRating(`${panel.wattage}W`, panel.efficiency ? `${panel.efficiency}%` : undefined),
    features: panel.efficiency ? [`${panel.efficiency}% Efficiency`] : [],
    availability: buildAvailability(panel.stock_quantity, panel.is_active),
    warrantyYears: 10,
    createdAt: panel.created_at,
    section: panel.brand ? "Panels" : "Solar Panels",
    rating: 4.8,
    reviewsCount: 0,
    description: panel.name,
    quickSpecs: [
      { label: "Brand", value: panel.brand || "Fortsolar" },
      { label: "Wattage", value: panel.wattage ? `${panel.wattage}W` : "N/A" },
      { label: "Voltage", value: panel.voltage ? `${panel.voltage}V` : "N/A" },
      { label: "Dimensions", value: panel.dimensions || "N/A" },
      { label: "Weight", value: panel.weight_kg ? `${panel.weight_kg}kg` : "N/A" },
    ],
    sourceType: "panel",
    sourceId: panel.id,
  };
}

function normalizePanelProducts(payload: ProductPanelListApiResponse): StoreCatalogProduct[] {
  return payload.data.map(normalizePanelProduct);
}

function normalizeInverterProduct(inverter: ProductInverterRecord): StoreCatalogProduct {
  return {
    id: inverter.id,
    title: inverter.name,
    mini_description: inverter.brand || inverter.type || "Solar inverter",
    image: toImageUrl(inverter.image_url),
    images: [toImageUrl(inverter.image_url)],
    price: inverter.price,
    priceOriginal: Math.round(inverter.price * 1.12),
    category: "Solar Products",
    productType: "Inverter",
    powerRating: buildPowerRating(`${inverter.capacity_kva}kVA`, inverter.type),
    features: inverter.efficiency ? [`${inverter.efficiency}% Efficiency`] : [],
    availability: buildAvailability(inverter.stock_quantity, inverter.is_active),
    warrantyYears: 8,
    createdAt: inverter.created_at,
    section: "Inverters",
    rating: 4.7,
    reviewsCount: 0,
    description: inverter.type
      ? `${inverter.name} ${inverter.type} inverter for dependable solar conversion.`
      : inverter.name,
    quickSpecs: [
      { label: "Brand", value: inverter.brand || "Fortsolar" },
      { label: "Type", value: inverter.type || "N/A" },
      { label: "Capacity", value: inverter.capacity_kva ? `${inverter.capacity_kva}kVA` : "N/A" },
      { label: "Efficiency", value: inverter.efficiency ? `${inverter.efficiency}%` : "N/A" },
      { label: "Voltage Range", value: inverter.voltage_range || "N/A" },
    ],
    sourceType: "inverter",
    sourceId: inverter.id,
  };
}

function normalizeInverterProducts(payload: ProductInverterListApiResponse): StoreCatalogProduct[] {
  return payload.data.map(normalizeInverterProduct);
}

function normalizeBatteryProduct(battery: ProductBatteryRecord): StoreCatalogProduct {
  return {
    id: battery.id,
    title: battery.name,
    mini_description: battery.brand || battery.type || "Solar battery",
    image: toImageUrl(battery.image_url),
    images: [toImageUrl(battery.image_url)],
    price: battery.price,
    priceOriginal: Math.round(battery.price * 1.12),
    category: "Solar Products",
    productType: "Battery",
    powerRating: buildPowerRating(`${battery.capacity_ah}Ah`, `${battery.voltage}V`),
    features: battery.cycle_life ? [`${battery.cycle_life} Cycle Life`] : [],
    availability: buildAvailability(battery.stock_quantity, battery.is_active),
    warrantyYears: 10,
    createdAt: battery.created_at,
    section: "Batteries",
    rating: 4.7,
    reviewsCount: 0,
    description: battery.type
      ? `${battery.name} ${battery.type} battery for long runtime and backup stability.`
      : battery.name,
    quickSpecs: [
      { label: "Brand", value: battery.brand || "Fortsolar" },
      { label: "Type", value: battery.type || "N/A" },
      { label: "Capacity", value: battery.capacity_ah ? `${battery.capacity_ah}Ah` : "N/A" },
      { label: "Voltage", value: battery.voltage ? `${battery.voltage}V` : "N/A" },
      { label: "Cycle Life", value: battery.cycle_life ? `${battery.cycle_life}` : "N/A" },
    ],
    sourceType: "battery",
    sourceId: battery.id,
  };
}

function normalizeBatteryProducts(payload: ProductBatteryListApiResponse): StoreCatalogProduct[] {
  return payload.data.map(normalizeBatteryProduct);
}

function normalizePackage(item: ProductPackageRecord, sourceType: "package" | "bundle"): StoreCatalogPackage {
  return {
    id: item.id,
    title: item.name,
    mini_description: item.description || `${item.name} solar solution`,
    image: toImageUrl(item.image_url),
    price: item.price,
    category: "Solar Packages",
    packageType: sourceType === "bundle" ? "Bundle" : "Package",
    powerRating: item.system_size_kw ? `${item.system_size_kw}kW` : "Standard",
    features: [
      item.battery_included ? "Battery Backup" : "No Battery Included",
      item.estimated_savings_monthly ? "Estimated Savings" : "Custom Quote Ready",
    ],
    availability: item.is_active ? "In Stock" : "Unavailable",
    warrantyYears: item.warranty_years || 5,
    createdAt: item.created_at,
    rating: 4.8,
    reviewsCount: 0,
    overview: item.description || `${item.name} solar package.`,
    packageIncludes: [
      { label: `${item.number_of_panels || 0} Panels`, qty: `${item.number_of_panels || 0}` },
      { label: item.panel_type || "Panel Type", qty: "Included" },
      { label: item.inverter_type || "Inverter", qty: "Included" },
      { label: "Battery Storage", qty: item.battery_included ? "Included" : "Optional" },
    ],
    systemDetails: [
      `System Size: ${item.system_size_kw || 0}kW`,
      `Monthly Savings Estimate: ${item.estimated_savings_monthly || 0}`,
      `Payback Period: ${item.payback_period_years || 0} years`,
    ],
    powers: [
      "Lighting",
      "Home and office electronics",
      item.battery_included ? "Backup during outages" : "Daytime solar loads",
    ],
    sourceType,
    sourceId: item.id,
  };
}

function normalizePackages(
  payload: ProductPackageListApiResponse,
  sourceType: "package" | "bundle",
): StoreCatalogPackage[] {
  return payload.data.map((item) => normalizePackage(item, sourceType));
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
      appGet<ProductPackageListApiResponse>("/api/v1/products/bundles"),
      appGet<ProductPanelListApiResponse>("/api/v1/products/panels"),
      appGet<ProductInverterListApiResponse>("/api/v1/products/inverters"),
      appGet<ProductBatteryListApiResponse>("/api/v1/products/batteries"),
    ]);

  return {
    products: [
      ...normalizePanelProducts(panelsPayload),
      ...normalizeInverterProducts(invertersPayload),
      ...normalizeBatteryProducts(batteriesPayload),
    ],
    packages: [
      ...normalizePackages(packagesPayload, "package"),
      ...normalizePackages(bundlesPayload, "bundle"),
    ],
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
    (packagePayload?.success ? normalizePackage(packagePayload.data, "package") : null) ??
    (bundlePayload?.success ? normalizePackage(bundlePayload.data, "bundle") : null) ??
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
