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
