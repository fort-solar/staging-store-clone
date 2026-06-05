import type { StoreCatalogPackage, StoreCatalogProduct } from "@/types/api.types";
import type { CartItem } from "@/types/common.types";

type CartCatalogMaps = {
  packageMap: Map<string, StoreCatalogPackage>;
  productMap: Map<string, Pick<StoreCatalogProduct, "stockQuantity">>;
};

export function clampCartQuantity(quantity: number, maxQuantity?: number | null) {
  const normalizedQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

  if (typeof maxQuantity === "number" && maxQuantity > 0) {
    return Math.min(normalizedQuantity, maxQuantity);
  }

  return normalizedQuantity;
}

export function getProductCartMaxQuantity(
  product: Pick<StoreCatalogProduct, "stockQuantity"> | null | undefined,
) {
  if (!product || product.stockQuantity <= 0) {
    return null;
  }

  return product.stockQuantity;
}

export function sanitizeCartItemsWithCatalog(
  cartItems: CartItem[],
  { packageMap, productMap }: CartCatalogMaps,
) {
  return cartItems.flatMap((item) => {
    if (item.itemType === "package") {
      if (!packageMap.has(String(item.id))) {
        return [];
      }

      return [
        {
          ...item,
          quantity: clampCartQuantity(item.quantity),
        },
      ];
    }

    const product = productMap.get(String(item.id));

    if (!product) {
      return [];
    }

    return [
      {
        ...item,
        quantity: clampCartQuantity(item.quantity, getProductCartMaxQuantity(product)),
      },
    ];
  });
}

export function areCartItemsEqual(left: CartItem[], right: CartItem[]) {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((item, index) => {
    const candidate = right[index];

    return (
      String(item.id) === String(candidate?.id) &&
      item.itemType === candidate?.itemType &&
      item.quantity === candidate?.quantity
    );
  });
}
