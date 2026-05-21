import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { GeneralStoreState, type SyncResource } from "@/types/common.types";

const initialState: GeneralStoreState = {
    isHydrated: false,
    setHydrated: () => { },
    isCategorySidebarOpen: false,
    toggleCategorySidebar: () => { },
    cartItems: [],
    favorites: {
        products: [],
        packages: [],
    },
    addToCart: () => { },
    replaceCart: () => { },
    setCategorySidebarOpen: () => { }, 
    updateCartQuantity: () => { },
    removeFromCart: () => { },
    clearCart: () => { },
    toggleFavoriteProduct: () => { },
    toggleFavoritePackage: () => { },
    replaceFavorites: () => { },
    syncState: {
        cartPending: false,
        favoritesPending: false,
        lastCartSyncAt: null,
        lastFavoritesSyncAt: null,
    },
    markCatalogSyncPending: () => { },
    markCatalogSyncComplete: () => { },
}

export const useGeneralStore = create<GeneralStoreState>()(
    persist(
        immer((set) => ({
            ...initialState,

            setHydrated: () => {
                set((state) => {
                    state.isHydrated = true;
                });
            },
            toggleCategorySidebar: () => {
                set((state) => {
                    state.isCategorySidebarOpen = !state.isCategorySidebarOpen;
                });
            },

            markCatalogSyncPending: (resource: SyncResource) => {
                set((state) => {
                    if (resource === "cart") {
                        state.syncState.cartPending = true;
                        state.syncState.lastCartSyncAt = null;
                        return;
                    }

                    state.syncState.favoritesPending = true;
                    state.syncState.lastFavoritesSyncAt = null;
                });
            },

            markCatalogSyncComplete: (resource: SyncResource) => {
                set((state) => {
                    const timestamp = new Date().toISOString();

                    if (resource === "cart") {
                        state.syncState.cartPending = false;
                        state.syncState.lastCartSyncAt = timestamp;
                        return;
                    }

                    state.syncState.favoritesPending = false;
                    state.syncState.lastFavoritesSyncAt = timestamp;
                });
            },

            addToCart: ({ id, itemType }) => {
                set((state) => {
                    const existing = state.cartItems.find(
                        (item) => item.id === id && item.itemType === itemType
                    );
                    if (existing) {
                        existing.quantity += 1;
                    } else {
                        state.cartItems.push({ id, itemType, quantity: 1 });
                    }

                    state.syncState.cartPending = true;
                    state.syncState.lastCartSyncAt = null;
                });
            },

            replaceCart: (items, options) => {
                set((state) => {
                    state.cartItems = items;

                    if (options?.pending) {
                        state.syncState.cartPending = true;
                        state.syncState.lastCartSyncAt = null;
                        return;
                    }

                    state.syncState.cartPending = false;
                    state.syncState.lastCartSyncAt = new Date().toISOString();
                });
            },

            setCategorySidebarOpen: (value) => {
                set((state) => {
                    state.isCategorySidebarOpen = value;
                });
            },


            updateCartQuantity: ({ id, itemType, quantity }) => {
                set((state) => {
                    const existing = state.cartItems.find(
                        (item) => item.id === id && item.itemType === itemType
                    );
                    if (existing) {
                        existing.quantity = Math.max(1, quantity);
                    }

                    state.syncState.cartPending = true;
                    state.syncState.lastCartSyncAt = null;
                });
            },

            removeFromCart: ({ id, itemType }) => {
                set((state) => {
                    state.cartItems = state.cartItems.filter(
                        (item) => !(item.id === id && item.itemType === itemType)
                    );
                    state.syncState.cartPending = true;
                    state.syncState.lastCartSyncAt = null;
                });
            },

            clearCart: () => {
                set((state) => {
                    state.cartItems = [];
                    state.syncState.cartPending = true;
                    state.syncState.lastCartSyncAt = null;
                });
            },

            toggleFavoriteProduct: (id) => {
                set((state) => {
                    if (state.favorites.products.includes(id)) {
                        state.favorites.products = state.favorites.products.filter(
                            (itemId) => itemId !== id
                        );
                    } else {
                        state.favorites.products.push(id);
                    }

                    state.syncState.favoritesPending = true;
                    state.syncState.lastFavoritesSyncAt = null;
                });
            },

            toggleFavoritePackage: (id) => {
                set((state) => {
                    if (state.favorites.packages.includes(id)) {
                        state.favorites.packages = state.favorites.packages.filter(
                            (itemId) => itemId !== id
                        );
                    } else {
                        state.favorites.packages.push(id);
                    }

                    state.syncState.favoritesPending = true;
                    state.syncState.lastFavoritesSyncAt = null;
                });
            },

            replaceFavorites: (favorites, options) => {
                set((state) => {
                    state.favorites = favorites;

                    if (options?.pending) {
                        state.syncState.favoritesPending = true;
                        state.syncState.lastFavoritesSyncAt = null;
                        return;
                    }

                    state.syncState.favoritesPending = false;
                    state.syncState.lastFavoritesSyncAt = new Date().toISOString();
                });
            },
        })),
        {
            name: "general-store",
            onRehydrateStorage: () => (state) => {
                if (state) state.setHydrated();
            },
        }
    )
)
