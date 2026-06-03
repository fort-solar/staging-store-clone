"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { toggleCustomerFavorite } from "@/lib/customer";
import { useGeneralStore } from "@/store/GeneralStore";
import type { CatalogId } from "@/types/common.types";

function toFavoritesMapKey(itemType: "product" | "package", id: CatalogId) {
  return `${itemType}:${String(id)}`;
}

export function useCustomerFavoriteToggle() {
  const { isAuthenticated } = useAuth();
  const toggleFavoriteProduct = useGeneralStore((state) => state.toggleFavoriteProduct);
  const toggleFavoritePackage = useGeneralStore((state) => state.toggleFavoritePackage);
  const replaceFavorites = useGeneralStore((state) => state.replaceFavorites);
  const [pendingKeys, setPendingKeys] = useState<Record<string, boolean>>({});

  const toggleFavorite = useCallback(
    (id: CatalogId, itemType: "product" | "package") => {
      if (!isAuthenticated) {
        if (itemType === "product") {
          toggleFavoriteProduct(id);
          return;
        }

        toggleFavoritePackage(id);
        return;
      }

      const key = toFavoritesMapKey(itemType, id);

      if (pendingKeys[key]) {
        return;
      }

      setPendingKeys((current) => ({
        ...current,
        [key]: true,
      }));

      void toggleCustomerFavorite({
        id: String(id),
        itemType,
      })
        .then((payload) => {
          replaceFavorites(
            {
              products: payload.data.products.map(String),
              packages: payload.data.packages.map(String),
            },
            { pending: false },
          );
        })
        .catch(() => null)
        .finally(() => {
          setPendingKeys((current) => {
            const next = { ...current };
            delete next[key];
            return next;
          });
        });
    },
    [
      isAuthenticated,
      pendingKeys,
      replaceFavorites,
      toggleFavoritePackage,
      toggleFavoriteProduct,
    ],
  );

  return {
    toggleProductFavorite: (id: CatalogId) => toggleFavorite(id, "product"),
    togglePackageFavorite: (id: CatalogId) => toggleFavorite(id, "package"),
    isFavoriteTogglePending: (id: CatalogId, itemType: "product" | "package") =>
      Boolean(pendingKeys[toFavoritesMapKey(itemType, id)]),
  };
}
