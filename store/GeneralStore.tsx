import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { GeneralStoreState } from "@/types/common.types";

const initialState: GeneralStoreState = {
    isHydrated: false,
    setHydrated: () => { },
    isCategorySidebarOpen: true,
    toggleCategorySidebar: () => { },
    cartItems: [],
    favorites: {
        products: [],
        packages: [],
    },
    addToCart: () => { },
    updateCartQuantity: () => { },
    removeFromCart: () => { },
    clearCart: () => { },
    toggleFavoriteProduct: () => { },
    toggleFavoritePackage: () => { },
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
                });
            },

            removeFromCart: ({ id, itemType }) => {
                set((state) => {
                    state.cartItems = state.cartItems.filter(
                        (item) => !(item.id === id && item.itemType === itemType)
                    );
                });
            },

            clearCart: () => {
                set((state) => {
                    state.cartItems = [];
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
