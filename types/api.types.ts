export type ApiErrorResponse = {
  success: false;
  error?: string;
  message?: string;
};

export type ApiSuccessResponse = {
  success: true;
  message?: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiDataResponse<T> = ApiSuccessResponse & {
  data: T;
};

export type ApiCollectionResponse<T> = ApiSuccessResponse & {
  data: T[];
  pagination?: PaginationMeta;
};

export type PortalRole = "customer" | "installer";
export type UserRole = PortalRole | "admin";

export type AuthSession = {
  userId: string;
  email: string;
  fullName: string;
  role: UserRole;
  adminRole?: string | null;
  signedInAt: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  role: UserRole;
  adminRole?: string | null;
  status: string;
  avatar_url: string | null;
  emailVerified: boolean;
  createdAt: string;
};

export type LoginApiResponse = ApiSuccessResponse & {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  session: AuthSession;
  user: AuthUser;
};

export type RefreshTokenApiResponse = ApiSuccessResponse & {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  session: AuthSession;
  user: AuthUser;
};

export type RegisterApiResponse = LoginApiResponse;
export type LogoutApiResponse = ApiSuccessResponse;

export type VerifyEmailRequestApiResponse = ApiSuccessResponse;

export type VerifyEmailApiResponse = ApiSuccessResponse & {
  email: string;
};

export type AuthMeApiResponse = ApiSuccessResponse & {
  session: AuthSession;
  user: AuthUser;
};

export type SessionSnapshot = {
  portal: PortalRole;
  session: AuthSession;
  user: Pick<AuthUser, "id" | "email" | "name" | "fullName" | "role" | "adminRole" | "avatar_url" | "status" | "phone" | "address" | "emailVerified">;
  expiresAt: string | null;
};

export type ProductPackageRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string | null;
  system_size_kw: number;
  price: number;
  number_of_panels: number;
  panel_type: string;
  inverter_type: string;
  battery_included: boolean;
  warranty_years: number;
  estimated_savings_monthly: number;
  payback_period_years: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductPanelRecord = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  wattage: number;
  efficiency: number;
  voltage: number;
  dimensions: string;
  weight_kg: number;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  specifications: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductInverterRecord = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  type: string;
  capacity_kva: number;
  efficiency: number;
  voltage_range: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  specifications: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductBatteryRecord = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  capacity_ah: number;
  voltage: number;
  type: string;
  cycle_life: number;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  specifications: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductPackageListApiResponse = ApiCollectionResponse<ProductPackageRecord>;
export type ProductPackageDetailApiResponse = ApiDataResponse<ProductPackageRecord>;
export type ProductPanelListApiResponse = ApiCollectionResponse<ProductPanelRecord>;
export type ProductPanelDetailApiResponse = ApiDataResponse<ProductPanelRecord>;
export type ProductInverterListApiResponse = ApiCollectionResponse<ProductInverterRecord>;
export type ProductInverterDetailApiResponse = ApiDataResponse<ProductInverterRecord>;
export type ProductBatteryListApiResponse = ApiCollectionResponse<ProductBatteryRecord>;
export type ProductBatteryDetailApiResponse = ApiDataResponse<ProductBatteryRecord>;

export type NotificationRecord = {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type NotificationListApiResponse = ApiCollectionResponse<NotificationRecord>;

export type NotificationSocketConfigApiResponse = ApiSuccessResponse & {
  channel: "socket.io";
  socketPath: string;
  message: string;
  defaultEventNames: string[];
};

export type ClientAuthState = {
  session: Pick<AuthSession, "userId" | "email" | "fullName" | "role" | "signedInAt">;
  user: Pick<AuthUser, "id" | "email" | "fullName" | "name" | "phone" | "address" | "role" | "status" | "emailVerified">;
  portal: PortalRole;
  expiresAt: string | null;
};

export type FetchResponseType<T = unknown> = Promise<{ data?: T; error?: string }>;

export type FormProps = {
  endpoint: string;
  method?: string;
  values: unknown;
};

export type StoreCatalogProduct = {
  id: string | number;
  title: string;
  mini_description: string;
  image: string;
  images: string[];
  price: number;
  priceOriginal: number;
  category: string;
  productType: string;
  powerRating: string;
  features: string[];
  availability: string;
  warrantyYears: number;
  createdAt: string;
  section: string;
  rating: number;
  reviewsCount: number;
  description: string;
  quickSpecs: Array<{ label: string; value: string }>;
  sourceType: "panel" | "inverter" | "battery";
  sourceId: string;
};

export type StoreCatalogPackage = {
  id: string | number;
  title: string;
  mini_description: string;
  image: string;
  price: number;
  category: string;
  packageType: string;
  powerRating: string;
  features: string[];
  availability: string;
  warrantyYears: number;
  createdAt: string;
  rating: number;
  reviewsCount: number;
  overview: string;
  packageIncludes: Array<{ label: string; qty: string }>;
  systemDetails: string[];
  powers: string[];
  sourceType: "package" | "bundle";
  sourceId: string;
};

export type PendingEndpointSubmission = {
  id: string;
  action: string;
  endpoint: string;
  method: string;
  values: Record<string, unknown>;
  createdAt: string;
  portal: PortalRole;
  notes?: string;
};

export type CustomerSummaryRecord = {
  packageRequests: number;
  completedInstallations: number;
};

export type CustomerSummaryApiResponse = ApiDataResponse<CustomerSummaryRecord>;

export type CustomerQuoteRecord = {
  id: string;
  createdAt: string;
  status: string;
  energySummary: {
    totalLoad: string;
    totalWattHoursPerDay: string;
    dailyUsage: string;
    monthlyUsage: string;
  };
  appliances: string[];
  formExtras: Record<string, unknown>;
};

export type CustomerQuoteListApiResponse = ApiCollectionResponse<CustomerQuoteRecord>;

export type CustomerOrderSummaryRecord = {
  allOrders: number;
  processingOrders: number;
  deliveredOrders: number;
};

export type CustomerOrderSummaryApiResponse = ApiDataResponse<CustomerOrderSummaryRecord>;

export type CustomerOrderListItem = {
  id: string;
  type: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  displayStatus: string;
  fulfillmentStatus: string;
  qty: number;
  unitPrice: string;
  totalAmount: string;
  currency: string;
  primaryItemName: string;
};

export type CustomerOrderListApiResponse = ApiSuccessResponse & {
  data: CustomerOrderListItem[];
  summary: CustomerOrderSummaryRecord;
  pagination: PaginationMeta;
};

export type CustomerOrderItemPayload = {
  item_type: "product" | "package";
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  metadata?: Record<string, unknown>;
};

export type CustomerAddressPayload = Record<string, unknown>;

export type CustomerOrderCreatePayload = {
  items: CustomerOrderItemPayload[];
  shipping_address: CustomerAddressPayload;
  billing_address: CustomerAddressPayload;
  notes?: string;
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  create_bundle_request?: {
    bundle_id: string;
    financing_requested: boolean;
  };
};

export type CustomerOrderCreateResponse = ApiDataResponse<Record<string, unknown>>;
export type CustomerOrderDetailApiResponse = ApiDataResponse<Record<string, unknown>>;

export type CustomerInstallationSummaryRecord = {
  activeInstallations: number;
  pendingApproval: number;
  completedInstallations: number;
};

export type CustomerInstallationSummaryApiResponse =
  ApiDataResponse<CustomerInstallationSummaryRecord>;

export type CustomerInstallationListItem = {
  id: string;
  packageLabel: string;
  status: string;
  displayStatus: string;
  progressPercent: number;
  installerName: string;
  scheduledDate: string | null;
  completedDate: string | null;
  createdAt: string;
  totalCost: string;
  paymentStatus: string;
  customerApprovalStatus: string;
  requiresApproval: boolean;
};

export type CustomerInstallationListApiResponse = ApiSuccessResponse & {
  data: CustomerInstallationListItem[];
  summary: CustomerInstallationSummaryRecord;
  pagination: PaginationMeta;
};

export type CustomerInstallationDetailApiResponse = ApiDataResponse<Record<string, unknown>>;
export type CustomerInstallationApproveApiResponse = ApiDataResponse<Record<string, unknown>>;

export type CustomerInstallationIssuePayload = {
  description: string;
  metadata?: Record<string, unknown>;
};

export type CustomerPackageRequestRecord = {
  id: string;
  requestId: string;
  packageName: string;
  date: string;
  financing: string;
  status: string;
  displayStatus: string;
  orderId: string | null;
  bundleId: string | null;
};

export type CustomerPackageRequestListApiResponse = ApiSuccessResponse & {
  data: CustomerPackageRequestRecord[];
  pagination: PaginationMeta;
};

export type CustomerCartItemRecord = {
  id: string;
  itemType: "product" | "package";
  quantity: number;
};

export type CustomerCartRecord = {
  items: CustomerCartItemRecord[];
  syncedAt: string;
};

export type CustomerCartApiResponse = ApiDataResponse<CustomerCartRecord>;

export type CustomerCartReplacePayload = {
  items: CustomerCartItemRecord[];
};

export type CustomerFavoriteRecord = {
  products: string[];
  packages: string[];
  syncedAt: string;
};

export type CustomerFavoritesApiResponse = ApiDataResponse<CustomerFavoriteRecord>;

export type CustomerFavoritesReplacePayload = {
  products: string[];
  packages: string[];
};

export type CustomerFavoriteTogglePayload = {
  id: string;
  itemType: "product" | "package";
};

export type PaystackInitializeResponse = ApiDataResponse<{
  reference: string;
  accessCode: string;
  authorizationUrl: string;
  amountKobo: number;
  publicKey: string;
  orderId: string;
}>;

export type PaymentVerifyPayload = {
  reference: string;
};

export type PaymentVerifyResponse = ApiDataResponse<{
  transaction: Record<string, unknown>;
  order: Record<string, unknown>;
}>;
