"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { appLogger } from "@/lib/api/logger";
import {
  getCustomerCart,
  getCustomerFavorites,
  replaceCustomerCart,
  replaceCustomerFavorites,
} from "@/lib/customer";
import { useGeneralStore } from "@/store/GeneralStore";
import type { CustomerCartItemRecord } from "@/types/api.types";
import type { CartItem, FavoritesState } from "@/types/common.types";

function normalizeCartItems(items: CartItem[] | CustomerCartItemRecord[]) {
  return items.map((item) => ({
    id: String(item.id),
    itemType: item.itemType,
    quantity: Math.max(1, Number(item.quantity) || 1),
  })) satisfies CustomerCartItemRecord[];
}

function mergeCartItems(
  serverItems: CustomerCartItemRecord[],
  localItems: CustomerCartItemRecord[],
) {
  const merged = new Map<string, CustomerCartItemRecord>();

  const targetType =
    localItems.length > 0
      ? localItems[0].itemType
      : serverItems.length > 0
        ? serverItems[0].itemType
        : null;

  const filteredItems = [...serverItems, ...localItems].filter(
    (item) => !targetType || item.itemType === targetType
  );

  filteredItems.forEach((item) => {
    const key = `${item.itemType}:${item.id}`;
    const current = merged.get(key);

    if (!current) {
      merged.set(key, item);
      return;
    }

    merged.set(key, {
      ...current,
      quantity: current.quantity + item.quantity,
    });
  });

  return Array.from(merged.values());
}

function mergeFavorites(serverFavorites: FavoritesState, localFavorites: FavoritesState) {
  return {
    products: Array.from(new Set([...serverFavorites.products, ...localFavorites.products])).map(String),
    packages: Array.from(new Set([...serverFavorites.packages, ...localFavorites.packages])).map(String),
  } satisfies FavoritesState;
}

function areCartItemsEqual(left: CustomerCartItemRecord[], right: CustomerCartItemRecord[]) {
  const normalize = (items: CustomerCartItemRecord[]) =>
    [...items]
      .map((item) => `${item.itemType}:${item.id}:${item.quantity}`)
      .sort();

  const leftKeys = normalize(left);
  const rightKeys = normalize(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((value, index) => value === rightKeys[index]);
}

function areFavoritesEqual(left: FavoritesState, right: FavoritesState) {
  const normalize = (items: Array<string | number>) => [...items].map(String).sort();
  const leftProducts = normalize(left.products);
  const rightProducts = normalize(right.products);
  const leftPackages = normalize(left.packages);
  const rightPackages = normalize(right.packages);

  return (
    leftProducts.length === rightProducts.length &&
    leftPackages.length === rightPackages.length &&
    leftProducts.every((value, index) => value === rightProducts[index]) &&
    leftPackages.every((value, index) => value === rightPackages[index])
  );
}

export function StoreSyncBridge() {
  const { session, isAuthenticated, isRefreshing } = useAuth();
  const isHydrated = useGeneralStore((state) => state.isHydrated);
  const cartItems = useGeneralStore((state) => state.cartItems);
  const favorites = useGeneralStore((state) => state.favorites);
  const syncState = useGeneralStore((state) => state.syncState);
  const replaceCart = useGeneralStore((state) => state.replaceCart);
  const replaceFavorites = useGeneralStore((state) => state.replaceFavorites);

  const activeUserId = session?.user.id ?? null;
  const initializedUserRef = useRef<string | null>(null);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      initializedUserRef.current = null;
      isInitializingRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !activeUserId || !isHydrated || isRefreshing) {
      return;
    }

    if (initializedUserRef.current === activeUserId || isInitializingRef.current) {
      return;
    }

    let cancelled = false;
    isInitializingRef.current = true;

    (async () => {
      try {
        const [cartPayload, favoritesPayload] = await Promise.all([
          getCustomerCart().catch(() => null),
          getCustomerFavorites().catch(() => null),
        ]);

        if (cancelled) {
          return;
        }

        const serverCart = normalizeCartItems(cartPayload?.data.items ?? []);
        const localCart = normalizeCartItems(cartItems);
        const shouldMergeLocalCart =
          syncState.cartPending || (!syncState.lastCartSyncAt && localCart.length > 0);
        const mergedCart = shouldMergeLocalCart
          ? mergeCartItems(serverCart, localCart)
          : serverCart;
        const serverFavorites = {
          products: (favoritesPayload?.data.products ?? []).map(String),
          packages: (favoritesPayload?.data.packages ?? []).map(String),
        } satisfies FavoritesState;
        const localFavorites = {
          products: favorites.products.map(String),
          packages: favorites.packages.map(String),
        } satisfies FavoritesState;
        const shouldMergeLocalFavorites =
          syncState.favoritesPending ||
          (!syncState.lastFavoritesSyncAt &&
            (localFavorites.products.length > 0 || localFavorites.packages.length > 0));
        const mergedFavorites = shouldMergeLocalFavorites
          ? mergeFavorites(serverFavorites, localFavorites)
          : serverFavorites;

        const [nextCart, nextFavorites] = await Promise.all([
          !areCartItemsEqual(serverCart, mergedCart) || syncState.cartPending
            ? replaceCustomerCart({ items: mergedCart })
                .then((payload) => normalizeCartItems(payload.data.items))
                .catch((error) => {
                  appLogger.warn("Unable to merge the customer cart with local state.", error);
                  return mergedCart;
                })
            : Promise.resolve(serverCart),
          !areFavoritesEqual(serverFavorites, mergedFavorites) || syncState.favoritesPending
            ? replaceCustomerFavorites(mergedFavorites)
                .then((payload) => ({
                  products: payload.data.products.map(String),
                  packages: payload.data.packages.map(String),
                }))
                .catch((error) => {
                  appLogger.warn("Unable to merge customer favorites with local state.", error);
                  return mergedFavorites;
                })
            : Promise.resolve(serverFavorites),
        ]);

        if (cancelled) {
          return;
        }

        replaceCart(nextCart, { pending: false });
        replaceFavorites(nextFavorites, { pending: false });
        initializedUserRef.current = activeUserId;
      } catch (error) {
        appLogger.warn("Unable to initialize customer store sync.", error);
      } finally {
        isInitializingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    activeUserId,
    cartItems,
    favorites,
    isAuthenticated,
    isHydrated,
    isRefreshing,
    replaceCart,
    replaceFavorites,
    syncState.cartPending,
    syncState.favoritesPending,
    syncState.lastCartSyncAt,
    syncState.lastFavoritesSyncAt,
  ]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !activeUserId ||
      !isHydrated ||
      isRefreshing ||
      initializedUserRef.current !== activeUserId ||
      isInitializingRef.current
    ) {
      return;
    }

    if (!syncState.cartPending && !syncState.favoritesPending) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        if (syncState.cartPending) {
          const payload = await replaceCustomerCart({
            items: normalizeCartItems(cartItems),
          });

          if (!cancelled) {
            replaceCart(normalizeCartItems(payload.data.items), { pending: false });
          }
        }

        if (syncState.favoritesPending) {
          const payload = await replaceCustomerFavorites({
            products: favorites.products.map(String),
            packages: favorites.packages.map(String),
          });

          if (!cancelled) {
            replaceFavorites(
              {
                products: payload.data.products.map(String),
                packages: payload.data.packages.map(String),
              },
              { pending: false },
            );
          }
        }
      } catch (error) {
        appLogger.warn("Unable to synchronize customer catalog state.", error);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    activeUserId,
    cartItems,
    favorites,
    isAuthenticated,
    isHydrated,
    isRefreshing,
    replaceCart,
    replaceFavorites,
    syncState.cartPending,
    syncState.favoritesPending,
  ]);

  return null;
}
