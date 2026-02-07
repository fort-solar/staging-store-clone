export interface GeneralStoreState {
  isHydrated: boolean;
  setHydrated: () => void;
  isCategorySidebarOpen: boolean;
  toggleCategorySidebar: () => void;
  cartItems: CartItem[];
  favorites: FavoritesState;
  addToCart: (item: CartItemInput) => void;
  updateCartQuantity: (item: CartItemInput & { quantity: number }) => void;
  removeFromCart: (item: CartItemInput) => void;
  clearCart: () => void;
  toggleFavoriteProduct: (id: number) => void;
  toggleFavoritePackage: (id: number) => void;
}

export type CartItemType = "product" | "package";

export type CartItem = {
  id: number;
  itemType: CartItemType;
  quantity: number;
};

export type CartItemInput = {
  id: number;
  itemType: CartItemType;
};

export type FavoritesState = {
  products: number[];
  packages: number[];
};
