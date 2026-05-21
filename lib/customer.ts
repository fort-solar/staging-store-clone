import { appGet, appRequest } from "@/lib/api/client";
import type {
  CustomerCartApiResponse,
  CustomerCartItemRecord,
  CustomerCartReplacePayload,
  CustomerFavoritesApiResponse,
  CustomerFavoritesReplacePayload,
  CustomerFavoriteTogglePayload,
  CustomerInstallationApproveApiResponse,
  CustomerInstallationDetailApiResponse,
  CustomerInstallationIssuePayload,
  CustomerInstallationListApiResponse,
  CustomerInstallationSummaryApiResponse,
  CustomerOrderCreatePayload,
  CustomerOrderCreateResponse,
  CustomerOrderDetailApiResponse,
  CustomerOrderListApiResponse,
  CustomerOrderSummaryApiResponse,
  CustomerPackageRequestListApiResponse,
  CustomerQuoteListApiResponse,
  CustomerSummaryApiResponse,
  PaystackInitializeResponse,
  PaymentVerifyPayload,
  PaymentVerifyResponse,
} from "@/types/api.types";

function withQuery(path: string, params: Record<string, string | number | null | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function getCustomerSummary() {
  return appGet<CustomerSummaryApiResponse>("/api/v1/customer/me/summary");
}

export function getCustomerQuotes() {
  return appGet<CustomerQuoteListApiResponse>("/api/v1/customer/me/quotes");
}

export function getCustomerOrderSummary() {
  return appGet<CustomerOrderSummaryApiResponse>("/api/v1/customer/me/orders/summary");
}

export function getCustomerOrders(page = 1, limit = 10) {
  return appGet<CustomerOrderListApiResponse>(
    withQuery("/api/v1/customer/me/orders", { page, limit }),
  );
}

export function getCustomerOrderDetail(id: string) {
  return appGet<CustomerOrderDetailApiResponse>(`/api/v1/customer/me/orders/${id}`);
}

export function createCustomerOrder(payload: CustomerOrderCreatePayload) {
  return appRequest<CustomerOrderCreateResponse>("/api/v1/customer/me/orders", {
    method: "POST",
    body: payload,
  });
}

export function initializeCustomerOrderPayment(orderId: string) {
  return appRequest<PaystackInitializeResponse>(
    `/api/v1/customer/me/orders/${orderId}/payments/initialize`,
    {
      method: "POST",
      body: {},
    },
  );
}

export function verifyCustomerPayment(payload: PaymentVerifyPayload) {
  return appRequest<PaymentVerifyResponse>("/api/v1/customer/me/payments/verify", {
    method: "POST",
    body: payload,
  });
}

export function getCustomerInstallationSummary() {
  return appGet<CustomerInstallationSummaryApiResponse>(
    "/api/v1/customer/me/installations/summary",
  );
}

export function getCustomerInstallations(page = 1, limit = 10) {
  return appGet<CustomerInstallationListApiResponse>(
    withQuery("/api/v1/customer/me/installations", { page, limit }),
  );
}

export function getCustomerInstallationDetail(id: string) {
  return appGet<CustomerInstallationDetailApiResponse>(
    `/api/v1/customer/me/installations/${id}`,
  );
}

export function approveCustomerInstallation(id: string) {
  return appRequest<CustomerInstallationApproveApiResponse>(
    `/api/v1/customer/me/installations/${id}/approve`,
    {
      method: "POST",
      body: {},
    },
  );
}

export function reportCustomerInstallationIssue(
  id: string,
  payload: CustomerInstallationIssuePayload,
) {
  return appRequest<CustomerInstallationApproveApiResponse>(
    `/api/v1/customer/me/installations/${id}/report-issue`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getCustomerPackageRequests(page = 1, limit = 10) {
  return appGet<CustomerPackageRequestListApiResponse>(
    withQuery("/api/v1/customer/me/package-requests", { page, limit }),
  );
}

export function getCustomerCart() {
  return appGet<CustomerCartApiResponse>("/api/v1/customer/me/cart");
}

export function replaceCustomerCart(payload: CustomerCartReplacePayload) {
  return appRequest<CustomerCartApiResponse>("/api/v1/customer/me/cart", {
    method: "PUT",
    body: payload,
  });
}

export function clearCustomerCart() {
  return appRequest<CustomerCartApiResponse>("/api/v1/customer/me/cart", {
    method: "DELETE",
  });
}

export function upsertCustomerCartItem(payload: CustomerCartItemRecord) {
  return appRequest<CustomerCartApiResponse>("/api/v1/customer/me/cart/items", {
    method: "POST",
    body: payload,
  });
}

export function removeCustomerCartItem(itemType: string, itemId: string) {
  return appRequest<CustomerCartApiResponse>(
    `/api/v1/customer/me/cart/items/${itemType}/${itemId}`,
    {
      method: "DELETE",
    },
  );
}

export function getCustomerFavorites() {
  return appGet<CustomerFavoritesApiResponse>("/api/v1/customer/me/favorites");
}

export function replaceCustomerFavorites(payload: CustomerFavoritesReplacePayload) {
  return appRequest<CustomerFavoritesApiResponse>("/api/v1/customer/me/favorites", {
    method: "PUT",
    body: payload,
  });
}

export function toggleCustomerFavorite(payload: CustomerFavoriteTogglePayload) {
  return appRequest<CustomerFavoritesApiResponse>(
    "/api/v1/customer/me/favorites/toggle",
    {
      method: "POST",
      body: payload,
    },
  );
}
