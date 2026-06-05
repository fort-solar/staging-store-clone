import {
  areCartItemsEqual,
  clampCartQuantity,
  sanitizeCartItemsWithCatalog,
} from "@/lib/cart";

describe("clampCartQuantity", () => {
  it("keeps quantities at or above one and respects max quantity", () => {
    expect(clampCartQuantity(0)).toBe(1);
    expect(clampCartQuantity(4.8)).toBe(4);
    expect(clampCartQuantity(50, 20)).toBe(20);
  });
});

describe("sanitizeCartItemsWithCatalog", () => {
  it("removes missing items and clamps product quantity to stock", () => {
    const cartItems = [
      { id: "missing-product", itemType: "product" as const, quantity: 1 },
      { id: "product-1", itemType: "product" as const, quantity: 25 },
      { id: "package-1", itemType: "package" as const, quantity: 2 },
      { id: "missing-package", itemType: "package" as const, quantity: 1 },
    ];

    const sanitizedCartItems = sanitizeCartItemsWithCatalog(cartItems, {
      productMap: new Map([
        [
          "product-1",
          {
            stockQuantity: 20,
          },
        ],
      ]),
      packageMap: new Map([
        [
          "package-1",
          {
            id: "package-1",
          } as never,
        ],
      ]),
    });

    expect(sanitizedCartItems).toEqual([
      { id: "product-1", itemType: "product", quantity: 20 },
      { id: "package-1", itemType: "package", quantity: 2 },
    ]);
  });
});

describe("areCartItemsEqual", () => {
  it("compares id, type, quantity, and order", () => {
    expect(
      areCartItemsEqual(
        [{ id: "product-1", itemType: "product", quantity: 2 }],
        [{ id: "product-1", itemType: "product", quantity: 2 }],
      ),
    ).toBe(true);

    expect(
      areCartItemsEqual(
        [{ id: "product-1", itemType: "product", quantity: 2 }],
        [{ id: "product-1", itemType: "product", quantity: 3 }],
      ),
    ).toBe(false);
  });
});
