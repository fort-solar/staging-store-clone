"use client";

import { useEffect, useMemo } from "react";
import { useStorePackagesByIds, useStoreProductsByIds } from "@/lib/store-catalog";
import { areCartItemsEqual, sanitizeCartItemsWithCatalog } from "@/lib/cart";
import { useGeneralStore } from "@/store/GeneralStore";

export function CartCatalogBridge() {
  const isHydrated = useGeneralStore((state) => state.isHydrated);
  const cartItems = useGeneralStore((state) => state.cartItems);
  const replaceCart = useGeneralStore((state) => state.replaceCart);

  const productIds = useMemo(
    () => cartItems.filter((item) => item.itemType === "product").map((item) => item.id),
    [cartItems],
  );
  const packageIds = useMemo(
    () => cartItems.filter((item) => item.itemType === "package").map((item) => item.id),
    [cartItems],
  );

  const {
    items: products,
    isLoading: isProductsLoading,
    hasError: hasProductLookupError,
  } = useStoreProductsByIds(productIds);
  const {
    items: packages,
    isLoading: isPackagesLoading,
    hasError: hasPackageLookupError,
  } = useStorePackagesByIds(packageIds);

  const productMap = useMemo(
    () => new Map(products.map((item) => [String(item.id), item])),
    [products],
  );
  const packageMap = useMemo(
    () => new Map(packages.map((item) => [String(item.id), item])),
    [packages],
  );

  useEffect(() => {
    if (
      !isHydrated ||
      isProductsLoading ||
      isPackagesLoading ||
      hasProductLookupError ||
      hasPackageLookupError
    ) {
      return;
    }

    const sanitizedCartItems = sanitizeCartItemsWithCatalog(cartItems, {
      productMap,
      packageMap,
    });

    if (areCartItemsEqual(cartItems, sanitizedCartItems)) {
      return;
    }

    replaceCart(sanitizedCartItems, { pending: true });
  }, [
    cartItems,
    hasPackageLookupError,
    hasProductLookupError,
    isHydrated,
    isPackagesLoading,
    isProductsLoading,
    packageMap,
    productMap,
    replaceCart,
  ]);

  return null;
}
