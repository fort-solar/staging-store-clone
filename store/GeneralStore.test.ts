import { useGeneralStore } from "@/store/GeneralStore";

function resetGeneralStore() {
  localStorage.clear();
  useGeneralStore.setState({
    isHydrated: false,
    isCategorySidebarOpen: false,
    cartItems: [],
    favorites: {
      products: [],
      packages: [],
    },
    syncState: {
      cartPending: false,
      favoritesPending: false,
      lastCartSyncAt: null,
      lastFavoritesSyncAt: null,
    },
  });
}

describe("store cart actions", () => {
  beforeEach(() => {
    resetGeneralStore();
  });

  it("adds items to cart and increments quantity on repeated inserts", () => {
    const store = useGeneralStore.getState();

    store.addToCart({ id: "prod-1", itemType: "product" });
    store.addToCart({ id: "prod-1", itemType: "product" });

    expect(useGeneralStore.getState().cartItems).toEqual([
      { id: "prod-1", itemType: "product", quantity: 2 },
    ]);
    expect(useGeneralStore.getState().syncState.cartPending).toBe(true);
  });

  it("updates, removes, and clears cart items without corrupting state", () => {
    const store = useGeneralStore.getState();

    store.addToCart({ id: "prod-1", itemType: "product" });
    store.addToCart({ id: "pkg-1", itemType: "package" });
    store.updateCartQuantity({ id: "prod-1", itemType: "product", quantity: 5 });
    store.updateCartQuantity({ id: "pkg-1", itemType: "package", quantity: 0 });

    expect(useGeneralStore.getState().cartItems).toEqual([
      { id: "prod-1", itemType: "product", quantity: 5 },
      { id: "pkg-1", itemType: "package", quantity: 1 },
    ]);

    store.removeFromCart({ id: "prod-1", itemType: "product" });
    expect(useGeneralStore.getState().cartItems).toEqual([
      { id: "pkg-1", itemType: "package", quantity: 1 },
    ]);

    store.clearCart();
    expect(useGeneralStore.getState().cartItems).toEqual([]);
  });
});
