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

export type AuthProfileUpdateApiResponse = ApiSuccessResponse & {
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
  discount_percentage?: number | null;
  solar_finance_enabled?: boolean;
  number_of_panels: number;
  panel_type: string;
  inverter_type: string;
  battery_included: boolean;
  warranty_years: number;
  estimated_savings_monthly: number;
  payback_period_years: number;
  image_url: string | null;
  thumbnail_url?: string | null;
  package_image_url?: string | null;
  overview?: string | null;
  items?: StorePackageItemRecord[];
  what_it_powers?: string[];
  system_details?: StorePackageSystemDetails | null;
  datasheets?: StoreAssetRecord[];
  product_images?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductCategorySummaryRecord = {
  id: string;
  name: string;
};

export type ProductCategoryRecord = ProductCategorySummaryRecord & {
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  sections?: Array<{
    id: string;
    key: string;
    name: string;
    position: number;
  }>;
  requires_datasheet?: boolean;
  requires_product_image?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UnifiedProductSectionValueRecord = {
  id?: string;
  section_id?: string | null;
  section_name: string;
  value: string;
  unit?: string | null;
};

export type UnifiedProductRecord = {
  id: string;
  slug: string;
  name: string;
  category_id: string | null;
  category?: ProductCategorySummaryRecord | null;
  price: number;
  discounted_price?: number | null;
  stock_quantity: number;
  overview?: string | null;
  free_delivery?: boolean | null;
  delivery_warranty_info?: string | null;
  section_values?: UnifiedProductSectionValueRecord[];
  product_image_url?: string | null;
  product_image_urls?: string[];
  image_url?: string | null;
  image_urls?: string[];
  image?: string | null;
  datasheet_url?: string | null;
  warranty_years?: number | null;
  specifications?: Record<string, unknown>;
  is_active: boolean;
  status?: string | null;
  eligible_for_installation?: boolean | null;
  created_at: string;
  updated_at: string;
};

export type UnifiedProductListApiResponse = ApiCollectionResponse<UnifiedProductRecord>;
export type UnifiedProductDetailApiResponse = ApiDataResponse<UnifiedProductRecord>;

export type ProductPanelRecord = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category_id?: string | null;
  category_name?: string | null;
  wattage: number;
  efficiency: number;
  voltage: number;
  dimensions: string;
  weight_kg: number;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  datasheet_url?: string | null;
  overview?: string | null;
  section_values?: Array<{ section_name: string; value: string; unit?: string | null }>;
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
  category_id?: string | null;
  category_name?: string | null;
  type: string;
  capacity_kva: number;
  efficiency: number;
  voltage_range: string;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  datasheet_url?: string | null;
  overview?: string | null;
  section_values?: Array<{ section_name: string; value: string; unit?: string | null }>;
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
  category_id?: string | null;
  category_name?: string | null;
  capacity_ah: number;
  voltage: number;
  type: string;
  cycle_life: number;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  datasheet_url?: string | null;
  overview?: string | null;
  section_values?: Array<{ section_name: string; value: string; unit?: string | null }>;
  specifications: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductPackageListApiResponse = ApiCollectionResponse<ProductPackageRecord>;
export type ProductPackageDetailApiResponse = ApiDataResponse<ProductPackageRecord>;
export type ProductCategoryListApiResponse = ApiCollectionResponse<ProductCategoryRecord>;
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

export type StoreAssetRecord = {
  id?: string;
  name: string;
  url: string;
  mime_type?: string | null;
  kind?: "image" | "pdf" | "file" | (string & {});
};

export type StorePackageItemRecord = {
  id?: string;
  category_id: string;
  category_name?: string | null;
  product_id: string;
  product_name?: string | null;
  quantity: number;
  product?: UnifiedProductRecord | null;
};

export type StorePackageSystemDetails = {
  inverter_size: string;
  inverter_label?: string;
  pv_size: string;
  pv_label?: string;
  battery_size: string;
  battery_label?: string;
};

export type StoreCatalogProduct = {
  id: string | number;
  title: string;
  mini_description: string;
  image: string;
  images: string[];
  datasheet?: StoreAssetRecord | null;
  price: number;
  priceOriginal: number;
  stockQuantity: number;
  categoryId?: string | null;
  category: string;
  categoryLabel?: string;
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
  freeDelivery?: boolean;
  deliveryWarrantyInfo?: string | null;
  quickSpecs: Array<{ label: string; value: string }>;
  sectionValues?: Array<{ label: string; value: string }>;
  isActive?: boolean;
  eligibleForInstallation?: boolean;
  sourceType: "product";
  sourceId: string;
};

export type StoreCatalogPackage = {
  id: string | number;
  title: string;
  mini_description: string;
  image: string;
  thumbnail?: string;
  mainImage?: string;
  galleryImages?: string[];
  datasheets?: StoreAssetRecord[];
  price: number;
  finalPrice?: number;
  isActive?: boolean;
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
  installationSpecifications: InstallationSpecifications;
  powers: string[];
  solarFinanceEnabled?: boolean;
  discountPercentage?: number;
  includedProducts?: Array<{ id: string; categoryLabel: string; productName: string; quantity: number; image?: string | null; datasheet?: StoreAssetRecord | null }>;
  sourceType: "package";
  sourceId: string;
};

export type InstallationSpecifications = {
  inverter_size?: string;
  inverter_label?: string;
  pv_size?: string;
  pv_label?: string;
  battery_size?: string;
  battery_label?: string;
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
  updatedAt: string;
  status: string;
  energySummary: {
    totalLoad: string;
    totalWattHoursPerDay: string;
    dailyUsage: string;
    monthlyUsage: string;
  };
  appliances: string[];
  formExtras: Record<string, unknown>;
  recommendedSystemSize: number | null;
  estimatedCost: number | null;
  estimatedSavings: number | null;
  paybackPeriodYears: number | null;
  adminNotes: string | null;
  quoteAssetUrl: string | null;
  quoteAssetKind: string | null;
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
  installation_type?: string;
  specifications?: InstallationSpecifications;
  create_package_request?: {
    package_id: string;
    financing_requested: boolean;
  };
  create_bundle_request?: {
    bundle_id: string;
    financing_requested: boolean;
    financing_id_upload_id?: string | null;
    financing_statement_upload_id?: string | null;
    financing_cac_upload_id?: string | null;
    financing_utility_bill_upload_id?: string | null;
    financing_bvn?: string | null;
    financing_nin?: string | null;
    financing_bvn_consent?: boolean;
    financing_profile_type?: string | null;
  };
};

export type CustomerOrderResponseRecord = Record<string, unknown> & {
  id?: string;
  installation_type?: string | null;
  specifications?: InstallationSpecifications | null;
  order?: (Record<string, unknown> & {
    id?: string;
    installation_type?: string | null;
    specifications?: InstallationSpecifications | null;
  }) | null;
};

export type CustomerOrderCreateResponse = ApiDataResponse<CustomerOrderResponseRecord>;
export type CustomerOrderDetailApiResponse = ApiDataResponse<CustomerOrderResponseRecord>;

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
  financing_requested?: boolean;
  financing_status?: string | null;
  financing_terms?: {
    downpayment_amount?: number;
    installment?: number;
    tenure?: number;
  } | null;
  financing_profile_type?: string | null;
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
  added?: boolean;
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
