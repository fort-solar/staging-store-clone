export interface GeneralStoreState {
  isHydrated: boolean;
  setHydrated: () => void;
  isCategorySidebarOpen: boolean;
  toggleCategorySidebar: () => void;
  cartItems: CartItem[];
  favorites: FavoritesState;
  addToCart: (item: CartItemInput) => void;
  replaceCart: (items: CartItem[], options?: SyncReplaceOptions) => void;
  updateCartQuantity: (item: CartItemInput & { quantity: number }) => void;
  removeFromCart: (item: CartItemInput) => void;
  clearCart: () => void;
  toggleFavoriteProduct: (id: CatalogId) => void;
  setCategorySidebarOpen: (value: boolean) => void;
  toggleFavoritePackage: (id: CatalogId) => void;
  replaceFavorites: (favorites: FavoritesState, options?: SyncReplaceOptions) => void;
  syncState: SyncState;
  markCatalogSyncPending: (resource: SyncResource) => void;
  markCatalogSyncComplete: (resource: SyncResource) => void;
}

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type CartItemType = "product" | "package";

export type CartItem = {
  id: CatalogId;
  itemType: CartItemType;
  quantity: number;
};

export type CartItemInput = {
  id: CatalogId;
  itemType: CartItemType;
};

export type FavoritesState = {
  products: CatalogId[];
  packages: CatalogId[];
};

export type CatalogId = string | number;

export type SyncResource = "cart" | "favorites";

export type SyncReplaceOptions = {
  pending?: boolean;
};

export type SyncState = {
  cartPending: boolean;
  favoritesPending: boolean;
  lastCartSyncAt: string | null;
  lastFavoritesSyncAt: string | null;
};
