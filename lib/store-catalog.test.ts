import { normalizePackage, normalizeUnifiedProduct } from "@/lib/store-catalog";
import type { ProductPackageRecord, UnifiedProductRecord } from "@/types/api.types";

describe("normalizeUnifiedProduct", () => {
  it("maps unified category-driven products into store cards", () => {
    const product: UnifiedProductRecord = {
      id: "prod-1",
      slug: "12kva-hybrid-inverter",
      name: "12kVA Hybrid Inverter",
      category_id: "cat-1",
      category: { id: "cat-1", name: "Inverters" },
      price: 2500000,
      stock_quantity: 12,
      overview: "Three-phase hybrid inverter",
      section_values: [{ section_id: "sec-1", section_name: "Size", value: "12", unit: "kVA" }],
      product_image_url: "https://cdn.example.com/products/prod-1/image.jpg",
      datasheet_url: "https://cdn.example.com/products/prod-1/datasheet.pdf",
      specifications: {},
      is_active: true,
      status: "published",
      created_at: "2026-05-26T00:00:00.000Z",
      updated_at: "2026-05-26T00:00:00.000Z",
    };

    const normalized = normalizeUnifiedProduct(product);

    expect(normalized.categoryLabel).toBe("Inverters");
    expect(normalized.productType).toBe("Inverters");
    expect(normalized.image).toBe("https://cdn.example.com/products/prod-1/image.jpg");
    expect(normalized.sectionValues).toEqual([{ label: "Size", value: "12 kVA" }]);
  });
});

describe("normalizePackage", () => {
  it("prefers R2 response URLs for included product media", () => {
    const pkg: ProductPackageRecord = {
      id: "pkg-1",
      slug: "starter-solar-package",
      name: "Starter Solar Package",
      description: "Entry package",
      overview: "Entry package",
      category_id: null,
      system_size_kw: 5,
      price: 1000000,
      number_of_panels: 4,
      panel_type: "550W Mono",
      inverter_type: "Hybrid Inverter",
      battery_included: true,
      warranty_years: 5,
      estimated_savings_monthly: 10000,
      payback_period_years: 3,
      image_url: "https://cdn.example.com/packages/pkg-1/image.jpg",
      thumbnail_url: "https://cdn.example.com/packages/pkg-1/thumb.jpg",
      package_image_url: "https://cdn.example.com/packages/pkg-1/hero.jpg",
      items: [
        {
          category_id: "cat-1",
          category_name: "Inverters",
          product_id: "prod-1",
          product_name: "12kVA Hybrid Inverter",
          quantity: 1,
          product: {
            id: "prod-1",
            slug: "12kva-hybrid-inverter",
            name: "12kVA Hybrid Inverter",
            category_id: "cat-1",
            category: { id: "cat-1", name: "Inverters" },
            price: 2500000,
            stock_quantity: 12,
            overview: "Three-phase hybrid inverter",
            section_values: [],
            product_image_url: "https://cdn.example.com/products/prod-1/image.jpg",
            datasheet_url: "https://cdn.example.com/products/prod-1/datasheet.pdf",
            specifications: {},
            is_active: true,
            status: "published",
            created_at: "2026-05-26T00:00:00.000Z",
            updated_at: "2026-05-26T00:00:00.000Z",
          },
        },
      ],
      what_it_powers: ["Lighting"],
      system_details: {
        inverter_size: "12",
        inverter_label: "12kVA",
        pv_size: "5",
        pv_label: "5kWp",
        battery_size: "10",
        battery_label: "10kWh",
      },
      datasheets: [],
      product_images: [],
      is_active: true,
      created_at: "2026-05-26T00:00:00.000Z",
      updated_at: "2026-05-26T00:00:00.000Z",
    };

    const normalized = normalizePackage(pkg);

    expect(normalized.mainImage).toBe("https://cdn.example.com/packages/pkg-1/hero.jpg");
    expect(normalized.thumbnail).toBe("https://cdn.example.com/packages/pkg-1/thumb.jpg");
    expect(normalized.includedProducts).toEqual([
      expect.objectContaining({
        categoryLabel: "Inverters",
        image: "https://cdn.example.com/products/prod-1/image.jpg",
      }),
    ]);
    expect(normalized.datasheets).toEqual([
      expect.objectContaining({
        url: "https://cdn.example.com/products/prod-1/datasheet.pdf",
      }),
    ]);
  });
});
