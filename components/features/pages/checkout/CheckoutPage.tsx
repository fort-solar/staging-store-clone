"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import GetQuoteModal from "@/components/features/pages/product/GetQuoteModal";
import GradientCheckbox from "@/components/ui/gradient-checkbox";
import { Input } from "@/components/ui/input";
import { ComboboxField } from "@/components/ui/combobox-field";
import { NigeriaLocationFields } from "@/components/ui/nigeria-location-fields";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useCustomerLoginGate } from "@/hooks/use-customer-login-gate";
import {
  clearCustomerCart,
  createCustomerOrder,
  initializeCustomerOrderPayment,
  verifyCustomerPayment,
  uploadFile,
  getDraftOrder,
  saveDraftOrder,
  deleteDraftOrder,
  getFinancingSettings,
  getCustomerDeliverySettings,
  validateCustomerCoupon,
  submitCustomerQuoteRequest,
} from "@/lib/customer";
import { sessionSnapshotToMockUser } from "@/lib/localAuth";
import {
  buildPaystackInlineOptions,
  isCheckoutDisabledState,
  verifyCheckoutPaymentFlow,
  type CheckoutAddress,
  type CheckoutItem,
} from "@/lib/checkout";
import {
  useStorePackageById,
  useStorePackagesByIds,
  useStoreProductsByIds,
} from "@/lib/store-catalog";
import { useGeneralStore } from "@/store/GeneralStore";
import type { CatalogId } from "@/types/common.types";

type QuoteProduct = {
  id: CatalogId;
  title: string;
  image: string;
  price: number;
  quantity?: number;
};

type AddressFormState = CheckoutAddress;

const formatNaira = (value: number) =>
  `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const EMPTY_ADDRESS: AddressFormState = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  city: "",
  state: "",
  country: "Nigeria",
};

function getOrderId(value: Record<string, unknown>) {
  const candidates = [
    value.id,
    value.orderId,
    typeof value.order === "object" && value.order !== null
      ? (value.order as Record<string, unknown>).id
      : null,
  ];

  return candidates.find((item): item is string => typeof item === "string" && item.length > 0) ?? null;
}

const CheckoutPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPackageId = searchParams?.get("packageId");
  const queryFinancing = searchParams?.get("financing");

  const [activePackageOrder, setActivePackageOrder] = useState<{
    packageId: string | number;
    packageTitle: string;
    price?: number;
    image?: string;
    requestFinancing?: boolean;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fortsolar:active_package_order");
      if (raw) {
        setActivePackageOrder(JSON.parse(raw));
      }
    } catch (e) {
      console.warn("Failed to parse package draft", e);
    }
  }, []);

  const targetPackageId = queryPackageId || (activePackageOrder?.packageId ? String(activePackageOrder.packageId) : undefined);
  const { package: selectedPackage } = useStorePackageById(targetPackageId || undefined);
  const isPackageCheckout = Boolean(targetPackageId);

  const { session } = useAuth();
  const { isRefreshing, requireCustomerLogin } = useCustomerLoginGate();
  const currentUser = useMemo(() => sessionSnapshotToMockUser(session), [session]);
  const [query, setQuery] = useState("");
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isPaystackReady, setIsPaystackReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [useShippingAsBilling, setUseShippingAsBilling] = useState(true);
  const [requestFinancing, setRequestFinancing] = useState(false);
  const [notes, setNotes] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<{
    tone: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const cartItems = useGeneralStore((state) => state.cartItems);
  const replaceCart = useGeneralStore((state) => state.replaceCart);
  const productIds = useMemo(
    () => cartItems.filter((item) => item.itemType === "product").map((item) => item.id),
    [cartItems],
  );
  const packageIds = useMemo(
    () => cartItems.filter((item) => item.itemType === "package").map((item) => item.id),
    [cartItems],
  );
  const { items: products } = useStoreProductsByIds(productIds);
  const { items: packages } = useStorePackagesByIds(packageIds);
  const productMap = useMemo(
    () => new Map(products.map((item) => [String(item.id), item])),
    [products],
  );
  const packageMap = useMemo(
    () => new Map(packages.map((item) => [String(item.id), item])),
    [packages],
  );

  const [shippingAddress, setShippingAddress] = useState<AddressFormState>(EMPTY_ADDRESS);
  const [billingAddress, setBillingAddress] = useState<AddressFormState>(EMPTY_ADDRESS);

  // Load draft from localStorage on mount, and backend if logged in
  const [draftPayload, setDraftPayload] = useState<any>(null);

  // Define installation states (Nigerian structural & roofing context) - unselected by default
  const [requestInstallation, setRequestInstallation] = useState(true);
  const [installationType, setInstallationType] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [roofStyle, setRoofStyle] = useState("");
  const [roofMaterial, setRoofMaterial] = useState("");

  // Sync package order financing and installation mode
  useEffect(() => {
    if (isPackageCheckout) {
      setRequestInstallation(true);
      if (queryFinancing === "1") {
        setRequestFinancing(true);
      } else {
        setRequestFinancing(false);
      }
    }
  }, [isPackageCheckout, queryFinancing]);

  // Define financing calculator states
  const [downpaymentPct, setDownpaymentPct] = useState(30);
  const [tenureMonths, setTenureMonths] = useState(12);

  // Profile type and BVN/Legal consent
  const [profileType, setProfileType] = useState<"individual" | "salary_earner" | "business">("individual");
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [bvnConsent, setBvnConsent] = useState(false);
  const [legalConsent, setLegalConsent] = useState(false);

  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [govIdUploadId, setGovIdUploadId] = useState<string | null>(null);
  const [isUploadingGovId, setIsUploadingGovId] = useState(false);
  const [govIdProgress, setGovIdProgress] = useState<number | null>(null);
  const [govIdError, setGovIdError] = useState<string | null>(null);

  const [utilityBillFile, setUtilityBillFile] = useState<File | null>(null);
  const [utilityBillUploadId, setUtilityBillUploadId] = useState<string | null>(null);
  const [isUploadingUtilityBill, setIsUploadingUtilityBill] = useState(false);
  const [utilityBillProgress, setUtilityBillProgress] = useState<number | null>(null);
  const [utilityBillError, setUtilityBillError] = useState<string | null>(null);

  const [bankStatementFile, setBankStatementFile] = useState<File | null>(null);
  const [bankStatementUploadId, setBankStatementUploadId] = useState<string | null>(null);
  const [isUploadingBankStatement, setIsUploadingBankStatement] = useState(false);
  const [bankStatementProgress, setBankStatementProgress] = useState<number | null>(null);
  const [bankStatementError, setBankStatementError] = useState<string | null>(null);

  const [cacDocumentFile, setCacDocumentFile] = useState<File | null>(null);
  const [cacDocumentUploadId, setCacDocumentUploadId] = useState<string | null>(null);
  const [isUploadingCacDocument, setIsUploadingCacDocument] = useState(false);
  const [cacDocumentProgress, setCacDocumentProgress] = useState<number | null>(null);
  const [cacDocumentError, setCacDocumentError] = useState<string | null>(null);

  // Financing configuration loaded from backend
  const [financingSettings, setFinancingSettings] = useState<{
    min_downpayment_pct: number;
    short_term_rate: number;
    long_term_rate: number;
    tenures: number[];
    individual_rate: number;
    salary_earner_rate: number;
    business_rate: number;
  } | null>(null);

  useEffect(() => {
    getFinancingSettings()
      .then((res) => {
        if (res?.success && res.data) {
          setFinancingSettings(res.data);
          setDownpaymentPct(res.data.min_downpayment_pct);
          if (res.data.tenures && res.data.tenures.length > 0) {
            setTenureMonths(res.data.tenures[0]);
          }
        }
      })
      .catch((err) => console.error("Error loading financing settings:", err));
  }, []);

  const performUploadWithProgress = (
    file: File,
    onProgress: (percent: number) => void,
    onSuccess: (uploadId: string) => void,
    onError: (errMessage: string) => void
  ) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.data?.id) {
            onSuccess(res.data.id);
          } else {
            onError(res.message || "Failed to upload file.");
          }
        } catch (e) {
          onError("Invalid response from server.");
        }
      } else {
        let errMsg = "File upload failed.";
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.message) errMsg = res.message;
        } catch (e) {}
        onError(errMsg);
      }
    };

    xhr.onerror = () => {
      onError("Network error. Check your connection.");
    };

    xhr.ontimeout = () => {
      onError("Upload timed out (120s limit exceeded). Please try a smaller file or faster connection.");
    };

    xhr.timeout = 120000; // 120 seconds (2 minutes)
    xhr.open("POST", "/api/proxy/api/v1/uploads");
    xhr.send(formData);

    return () => {
      xhr.abort();
    };
  };

  // Document upload handler
  const handleDocumentChange = async (file: File, docType: 'govId' | 'utilityBill' | 'bankStatement' | 'cac') => {
    const MAX_SIZE = 5242880; // 5MB

    if (docType === 'govId') {
      setGovIdFile(file);
      setGovIdUploadId(null);
      setGovIdProgress(0);
      setGovIdError(null);
      
      if (file.size > MAX_SIZE) {
        setGovIdError("File exceeds the 5MB size limit.");
        return;
      }
      
      setIsUploadingGovId(true);
      performUploadWithProgress(
        file,
        (pct) => setGovIdProgress(pct),
        (id) => {
          setGovIdUploadId(id);
          setIsUploadingGovId(false);
          setGovIdProgress(100);
        },
        (errMsg) => {
          setGovIdError(errMsg);
          setIsUploadingGovId(false);
          setGovIdProgress(null);
        }
      );
    } else if (docType === 'utilityBill') {
      setUtilityBillFile(file);
      setUtilityBillUploadId(null);
      setUtilityBillProgress(0);
      setUtilityBillError(null);
      
      if (file.size > MAX_SIZE) {
        setUtilityBillError("File exceeds the 5MB size limit.");
        return;
      }
      
      setIsUploadingUtilityBill(true);
      performUploadWithProgress(
        file,
        (pct) => setUtilityBillProgress(pct),
        (id) => {
          setUtilityBillUploadId(id);
          setIsUploadingUtilityBill(false);
          setUtilityBillProgress(100);
        },
        (errMsg) => {
          setUtilityBillError(errMsg);
          setIsUploadingUtilityBill(false);
          setUtilityBillProgress(null);
        }
      );
    } else if (docType === 'bankStatement') {
      setBankStatementFile(file);
      setBankStatementUploadId(null);
      setBankStatementProgress(0);
      setBankStatementError(null);
      
      if (file.size > MAX_SIZE) {
        setBankStatementError("File exceeds the 5MB size limit.");
        return;
      }
      
      setIsUploadingBankStatement(true);
      performUploadWithProgress(
        file,
        (pct) => setBankStatementProgress(pct),
        (id) => {
          setBankStatementUploadId(id);
          setIsUploadingBankStatement(false);
          setBankStatementProgress(100);
        },
        (errMsg) => {
          setBankStatementError(errMsg);
          setIsUploadingBankStatement(false);
          setBankStatementProgress(null);
        }
      );
    } else if (docType === 'cac') {
      setCacDocumentFile(file);
      setCacDocumentUploadId(null);
      setCacDocumentProgress(0);
      setCacDocumentError(null);
      
      if (file.size > MAX_SIZE) {
        setCacDocumentError("File exceeds the 5MB size limit.");
        return;
      }
      
      setIsUploadingCacDocument(true);
      performUploadWithProgress(
        file,
        (pct) => setCacDocumentProgress(pct),
        (id) => {
          setCacDocumentUploadId(id);
          setIsUploadingCacDocument(false);
          setCacDocumentProgress(100);
        },
        (errMsg) => {
          setCacDocumentError(errMsg);
          setIsUploadingCacDocument(false);
          setCacDocumentProgress(null);
        }
      );
    }
  };

  const serializeDraft = () => {
    return {
      shippingAddress,
      billingAddress,
      useShippingAsBilling,
      notes,
      requestFinancing,
      requestInstallation,
      installationType,
      buildingType,
      roofStyle,
      roofMaterial,
      downpaymentPct,
      tenureMonths,
      profileType,
      bvn,
      nin,
      bvnConsent,
      legalConsent,
      govIdUploadId,
      utilityBillUploadId,
      bankStatementUploadId,
      cacDocumentUploadId,
    };
  };

  // Sync draft details
  useEffect(() => {
    const payload = serializeDraft();
    localStorage.setItem("fortsolar:checkout_draft", JSON.stringify(payload));

    if (session) {
      const timer = setTimeout(() => {
        saveDraftOrder(payload).catch((err) => console.warn("Backend draft save failed:", err));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    shippingAddress,
    billingAddress,
    useShippingAsBilling,
    notes,
    requestFinancing,
    requestInstallation,
    installationType,
    buildingType,
    roofStyle,
    roofMaterial,
    downpaymentPct,
    tenureMonths,
    profileType,
    bvn,
    nin,
    bvnConsent,
    legalConsent,
    govIdUploadId,
    utilityBillUploadId,
    bankStatementUploadId,
    cacDocumentUploadId,
    session,
  ]);

  const applyDraftToState = useCallback((draft: any) => {
    if (!draft) return;
    if (draft.shippingAddress) {
      setShippingAddress((prev) => ({
        fullName: prev.fullName || draft.shippingAddress.fullName || "",
        email: prev.email || draft.shippingAddress.email || "",
        phone: prev.phone || draft.shippingAddress.phone || "",
        addressLine1: prev.addressLine1 || draft.shippingAddress.addressLine1 || "",
        state: prev.state || draft.shippingAddress.state || "",
        city: prev.city || draft.shippingAddress.city || "",
        country: prev.country || draft.shippingAddress.country || "Nigeria",
      }));
    }
    if (draft.billingAddress) {
      setBillingAddress((prev) => ({
        fullName: prev.fullName || draft.billingAddress.fullName || "",
        email: prev.email || draft.billingAddress.email || "",
        phone: prev.phone || draft.billingAddress.phone || "",
        addressLine1: prev.addressLine1 || draft.billingAddress.addressLine1 || "",
        state: prev.state || draft.billingAddress.state || "",
        city: prev.city || draft.billingAddress.city || "",
        country: prev.country || draft.billingAddress.country || "Nigeria",
      }));
    }
    if (draft.useShippingAsBilling !== undefined) setUseShippingAsBilling(draft.useShippingAsBilling);
    if (draft.notes) setNotes((prev) => prev || draft.notes);
    if (queryFinancing === "1") {
      setRequestFinancing(true);
    } else if (isPackageCheckout) {
      setRequestFinancing(false);
    } else if (draft.requestFinancing !== undefined) {
      setRequestFinancing(draft.requestFinancing);
    }
    if (draft.requestInstallation !== undefined) setRequestInstallation(draft.requestInstallation);
    if (draft.installationType) setInstallationType((prev) => prev || draft.installationType);
    if (draft.buildingType) setBuildingType((prev) => prev || draft.buildingType);
    if (draft.roofStyle) setRoofStyle((prev) => prev || draft.roofStyle);
    if (draft.roofMaterial) setRoofMaterial((prev) => prev || draft.roofMaterial);
    if (draft.downpaymentPct) setDownpaymentPct(draft.downpaymentPct);
    if (draft.tenureMonths) setTenureMonths(draft.tenureMonths);
    if (draft.profileType) setProfileType(draft.profileType);
    if (draft.bvn) setBvn((prev) => prev || draft.bvn);
    if (draft.nin) setNin((prev) => prev || draft.nin);
    if (draft.bvnConsent !== undefined) setBvnConsent(draft.bvnConsent);
    if (draft.legalConsent !== undefined) setLegalConsent(draft.legalConsent);
    if (draft.govIdUploadId) setGovIdUploadId((prev) => prev || draft.govIdUploadId);
    if (draft.utilityBillUploadId) setUtilityBillUploadId((prev) => prev || draft.utilityBillUploadId);
    if (draft.bankStatementUploadId) setBankStatementUploadId((prev) => prev || draft.bankStatementUploadId);
    if (draft.cacDocumentUploadId) setCacDocumentUploadId((prev) => prev || draft.cacDocumentUploadId);
  }, []);

  // Load draft order on mount and apply directly
  useEffect(() => {
    const localDraft = localStorage.getItem("fortsolar:checkout_draft");
    if (localDraft) {
      try {
        const parsed = JSON.parse(localDraft);
        setDraftPayload(parsed);
        applyDraftToState(parsed);
      } catch (err) {
        console.error("Failed to parse local checkout draft:", err);
      }
    }

    if (session) {
      getDraftOrder()
        .then((res) => {
          if (res?.success && res.data) {
            setDraftPayload(res.data);
            applyDraftToState(res.data);
          }
        })
        .catch((err) => console.warn("Failed to load backend draft order:", err));
    }
  }, [session, applyDraftToState]);

  useEffect(() => {
    if (!session && !isRefreshing) {
      requireCustomerLogin({ redirectTo: "/checkout" });
    }
  }, [isRefreshing, requireCustomerLogin, session]);

  useEffect(() => {
    const fullName = currentUser?.fullName ?? "";
    const email = currentUser?.email ?? "";
    const phone = currentUser?.phone ?? "";
    const addressLine1 = currentUser?.address ?? "";

    setShippingAddress({
      fullName,
      email,
      phone,
      addressLine1,
      city: "",
      state: "",
      country: "Nigeria",
    });
    setBillingAddress({
      fullName,
      email,
      phone,
      addressLine1,
      city: "",
      state: "",
      country: "Nigeria",
    });
  }, [currentUser?.address, currentUser?.email, currentUser?.fullName, currentUser?.phone]);

  const cartDetails = useMemo(() => {
    if (isPackageCheckout) {
      if (!selectedPackage) return [];
      const img =
        typeof selectedPackage.mainImage === "string" && selectedPackage.mainImage
          ? selectedPackage.mainImage
          : typeof selectedPackage.image === "string" && selectedPackage.image
          ? selectedPackage.image
          : "";
      return [
        {
          id: String(selectedPackage.id),
          itemType: "package" as const,
          quantity: 1,
          title: selectedPackage.title,
          price: selectedPackage.finalPrice ?? selectedPackage.price,
          image: img,
          sourceType: "package" as const,
          sourceId: String(selectedPackage.id),
          eligibleForInstallation: true,
          freeDelivery: true,
          weightTier: "under_5kg",
          eligibleForWaybill: true,
        },
      ];
    }

    return cartItems
      .filter((item) => item.itemType === "product")
      .map((item) => {
        const product = productMap.get(String(item.id));
        if (!product) {
          return null;
        }

        return {
          id: String(item.id),
          itemType: item.itemType,
          quantity: item.quantity,
          title: product.title,
          price: product.price,
          image: product.image,
          sourceType: product.sourceType,
          sourceId: product.sourceId,
          eligibleForInstallation: (product as any).eligibleForInstallation ?? false,
          freeDelivery: (product as any).freeDelivery ?? false,
          weightTier: (product as any).weightTier ?? "under_5kg",
          eligibleForWaybill: (product as any).eligibleForWaybill ?? true,
        };
      })
      .filter(Boolean) as Array<CheckoutItem & {
        eligibleForInstallation: boolean;
        freeDelivery: boolean;
        weightTier: string;
        eligibleForWaybill: boolean;
      }>;
  }, [isPackageCheckout, selectedPackage, cartItems, productMap]);

  const hasEligibleProduct = useMemo(() => {
    return cartDetails.some((item) => item.itemType === "product" && item.eligibleForInstallation);
  }, [cartDetails]);

  const hasPackage = useMemo(() => {
    return isPackageCheckout || cartDetails.some((item) => item.itemType === "package");
  }, [isPackageCheckout, cartDetails]);

  const isAllFreeDelivery = useMemo(() => {
    return cartDetails.length > 0 && cartDetails.every((item) => item.freeDelivery || item.itemType === "package");
  }, [cartDetails]);

  const maxWeightSurcharge = useMemo(() => {
    const TIER_SURCHARGES: Record<string, number> = {
      under_5kg: 0,
      "5_15kg": 4000,
      "15_30kg": 9000,
      over_30kg: 18000,
    };
    let max = 0;
    for (const item of cartDetails) {
      if (item.itemType === "product") {
        const surcharge = TIER_SURCHARGES[item.weightTier || "under_5kg"] ?? 0;
        if (surcharge > max) max = surcharge;
      }
    }
    return max;
  }, [cartDetails]);

  useEffect(() => {
    setRequestInstallation(true);
  }, []);

  const missingCartItems = cartItems.length - cartDetails.length;

  const subtotal = useMemo(
    () => cartDetails.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartDetails],
  );

  const [deliverySettings, setDeliverySettings] = useState<{
    universal_fee: number;
    free_shipping_threshold?: number;
    weight_tiers?: Array<{ key: string; name: string; surcharge: number }>;
    state_rules?: Record<string, { all_cities_free: boolean; free_cities: string[] }>;
  } | null>(null);

  useEffect(() => {
    getCustomerDeliverySettings()
      .then((res) => {
        if (res?.success && res.data) {
          setDeliverySettings(res.data);
        }
      })
      .catch((err) => console.warn("Failed to load customer delivery settings:", err));
  }, []);

  const [couponInput, setCouponInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_amount: number;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    description: string | null;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("fortsolar:applied_coupon");
      if (saved) {
        setAppliedCoupon(JSON.parse(saved));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await validateCustomerCoupon({
        code: couponInput.trim().toUpperCase(),
        order_amount: subtotal,
        product_ids: cartDetails.map((it) => String(it.id)),
      });
      if (res.success && res.data.valid && res.data.coupon) {
        const couponData = {
          code: res.data.coupon.code,
          discount_amount: res.data.discount_amount,
          discount_type: res.data.coupon.discount_type,
          discount_value: res.data.coupon.discount_value,
          description: res.data.coupon.description,
        };
        setAppliedCoupon(couponData);
        localStorage.setItem("fortsolar:applied_coupon", JSON.stringify(couponData));
        setCouponInput("");
      } else {
        setCouponError(res.data?.message || "Invalid or expired discount coupon.");
      }
    } catch (err: any) {
      setCouponError(err.message || "Failed to validate coupon code.");
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
    localStorage.removeItem("fortsolar:applied_coupon");
  }

  const shippingAmount = useMemo(() => {
    if (cartDetails.length === 0 || subtotal === 0) return 0;
    if (hasPackage) return 0; // Complete packages ship free nationwide
    const threshold = deliverySettings?.free_shipping_threshold ?? 1500000;
    if (subtotal >= threshold) return 0; // Free order threshold
    if (isAllFreeDelivery) return 0;

    // Check destination state free rules
    const stateNorm = (shippingAddress.state || "").trim().toLowerCase();
    if (stateNorm && deliverySettings?.state_rules) {
      for (const [st, rule] of Object.entries(deliverySettings.state_rules)) {
        if (st.toLowerCase() === stateNorm && rule.all_cities_free) {
          return 0;
        }
      }
    }

    const baseRate = deliverySettings?.universal_fee ?? 16000;
    return baseRate + maxWeightSurcharge;
  }, [cartDetails.length, subtotal, hasPackage, deliverySettings, isAllFreeDelivery, shippingAddress.state, maxWeightSurcharge]);

  const taxAmount = 0;

  const discountAmount = useMemo(() => {
    return cartDetails.reduce((sum, item) => {
      if (item.itemType === "package") {
        const pkg = packageMap.get(item.id);
        const pct = pkg?.discountPercentage ?? 0;
        return sum + (item.price * (pct / 100)) * item.quantity;
      }
      return sum;
    }, 0);
  }, [cartDetails, packageMap]);

  const installationFee = useMemo(() => {
    if (!requestInstallation || cartDetails.length === 0 || subtotal === 0) return 0;
    return hasPackage ? 0 : 150000;
  }, [requestInstallation, hasPackage, cartDetails.length, subtotal]);

  const couponDiscount = appliedCoupon?.discount_amount ?? 0;
  const totalDiscount = discountAmount + couponDiscount;
  const total = Math.max(0, subtotal + shippingAmount + installationFee - totalDiscount);

  const calculatorResults = useMemo(() => {
    if (!financingSettings) return null;
    const downpaymentVal = (total * downpaymentPct) / 100;
    const financedAmount = total - downpaymentVal;
    let monthlyInstallment = 0;
    let interest = 0;
    let apr = 0;

    if (financingSettings) {
      if (profileType === "individual") {
        apr = financingSettings.individual_rate ?? financingSettings.short_term_rate ?? 25.20;
        const tenureInYears = tenureMonths / 12;
        interest = financedAmount * (apr / 100) * tenureInYears;
        const totalRepayable = financedAmount + interest;
        monthlyInstallment = totalRepayable / tenureMonths;
      } else {
        apr = profileType === "salary_earner" 
          ? (financingSettings.salary_earner_rate ?? 20.00) 
          : (financingSettings.business_rate ?? 18.00);
        const r = (apr / 100) / 12;
        const n = tenureMonths;
        if (r > 0) {
          monthlyInstallment = (financedAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        } else {
          monthlyInstallment = financedAmount / n;
        }
      }
    }

    return {
      downpaymentVal,
      financedAmount,
      monthlyInstallment,
      apr,
    };
  }, [total, downpaymentPct, tenureMonths, financingSettings, profileType]);

  const quoteProducts = useMemo(() => {
    return cartDetails
      .filter((item) => item.itemType === "product")
      .map((item) => ({
        id: item.id,
        title: item.title,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      })) satisfies QuoteProduct[];
  }, [cartDetails]);

  const primaryPackage = useMemo(
    () => cartDetails.find((item) => item.itemType === "package") ?? null,
    [cartDetails],
  );
  const primaryPackageDetails = useMemo(
    () => (primaryPackage ? packageMap.get(primaryPackage.id) : undefined),
    [packageMap, primaryPackage],
  );

  const isCheckoutDisabled = isCheckoutDisabledState({
    isSubmitting,
    isVerifyingPayment,
    cartDetails,
    missingCartItems,
    shippingAddress,
  });

  async function handlePaymentVerification(reference: string, targetOrderId?: string) {
    setIsVerifyingPayment(true);
    setCheckoutStatus({
      tone: "info",
      message: "Verifying your payment...",
    });

    try {
      const nextStatus = await verifyCheckoutPaymentFlow({
        reference,
        verifyCustomerPayment,
        clearCustomerCart,
        replaceCart,
        onVerified: async () => {
          if (targetOrderId) {
            router.push(`/orders/${targetOrderId}`);
          } else {
            router.push("/settings/orders");
          }
          router.refresh();
        },
      });
      setCheckoutStatus(nextStatus);
    } catch {
      setCheckoutStatus({
        tone: "error",
        message: "Unable to verify your payment.",
      });
    } finally {
      setIsVerifyingPayment(false);
    }
  }

  async function handleCheckout() {
    const errors: Record<string, boolean> = {};

    // 1. Validate Shipping Address
    if (!shippingAddress.fullName.trim()) errors.shippingFullName = true;
    if (!shippingAddress.email.trim()) errors.shippingEmail = true;
    if (!shippingAddress.phone.trim()) errors.shippingPhone = true;
    if (!shippingAddress.addressLine1.trim()) errors.shippingAddressLine1 = true;

    // 2. Validate Billing Address (if not same as shipping)
    if (!useShippingAsBilling) {
      if (!billingAddress.fullName.trim()) errors.billingFullName = true;
      if (!billingAddress.email.trim()) errors.billingEmail = true;
      if (!billingAddress.phone.trim()) errors.billingPhone = true;
      if (!billingAddress.addressLine1.trim()) errors.billingAddressLine1 = true;
    }

    // 3. Validate Financing (if requestFinancing is true and hasPackage is true)
    if (hasPackage && requestFinancing) {
      if (!bvn || bvn.trim().length < 11) errors.bvn = true;
      if (!nin || nin.trim().length < 11) errors.nin = true;
      if (!bvnConsent) errors.bvnConsent = true;
      if (!govIdUploadId) errors.uploadsGovId = true;
      if (!utilityBillUploadId) errors.uploadsUtilityBill = true;
      if (!bankStatementUploadId) errors.uploadsBankStatement = true;
      if (profileType === "business" && !cacDocumentUploadId) errors.uploadsCac = true;
    }

    // 4. Validate Installation Site Details
    if (requestInstallation || hasPackage) {
      if (!installationType.trim()) errors.installationType = true;
      if (!buildingType.trim()) errors.buildingType = true;
      if (!roofStyle.trim()) errors.roofStyle = true;
      if (!roofMaterial.trim()) errors.roofMaterial = true;
    }

    // 5. Validate Legal Consent / Terms
    if (!legalConsent) errors.legalConsent = true;

    // If there are errors, set state and abort
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      
      let primaryErrorMessage = "Please correct the highlighted errors on the form before proceeding.";
      
      if (errors.legalConsent) {
        primaryErrorMessage = "You must agree to the Terms of Service, Refund Policy, and data consent to proceed.";
      } else if (errors.installationType || errors.buildingType || errors.roofStyle || errors.roofMaterial) {
        primaryErrorMessage = "Please select all required installation site details.";
      } else if (hasPackage && requestFinancing) {
        if (errors.bvn) {
          primaryErrorMessage = "Please enter a valid 11-digit BVN.";
        } else if (errors.nin) {
          primaryErrorMessage = "Please enter a valid 11-digit NIN.";
        } else if (errors.bvnConsent) {
          primaryErrorMessage = "You must consent to BVN verification to apply for financing.";
        } else if (errors.uploadsGovId || errors.uploadsUtilityBill || errors.uploadsBankStatement || errors.uploadsCac) {
          primaryErrorMessage = "Please upload all required files to continue.";
        }
      } else if (errors.shippingFullName || errors.shippingEmail || errors.shippingPhone || errors.shippingAddressLine1) {
        primaryErrorMessage = "Please fill in all required shipping address fields.";
      } else if (errors.billingFullName || errors.billingEmail || errors.billingPhone || errors.billingAddressLine1) {
        primaryErrorMessage = "Please fill in all required billing address fields.";
      }

      setCheckoutStatus({
        tone: "error",
        message: primaryErrorMessage,
      });

      // Scroll to first invalid section
      const firstErrorKey = Object.keys(errors)[0];
      let elementId = "";
      if (firstErrorKey.startsWith("shipping")) {
        elementId = "shipping-section";
      } else if (firstErrorKey.startsWith("billing")) {
        elementId = "billing-section";
      } else if (firstErrorKey.startsWith("installation") || firstErrorKey === "buildingType" || firstErrorKey === "roofStyle" || firstErrorKey === "roofMaterial") {
        elementId = "installation-section";
      } else if (firstErrorKey === "bvn" || firstErrorKey === "bvnConsent" || firstErrorKey.startsWith("uploads")) {
        elementId = "financing-section";
      } else if (firstErrorKey === "legalConsent") {
        elementId = "terms-section";
      }

      if (elementId) {
        const el = document.getElementById(elementId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    setValidationErrors({});

    setIsSubmitting(true);
    setCheckoutStatus(null);

    try {
      const resolvedBillingAddress = useShippingAsBilling ? shippingAddress : billingAddress;
      
      let finalNotes = notes.trim();
      if (requestInstallation || hasPackage) {
        const installationInfo = `
Professional Installation Site Details
Installation Type: ${installationType || "Residential"}
Building Type: ${buildingType || "Bungalow"}
Roof Architecture / Style: ${roofStyle || "Hip Roof (Pitched / Sloped)"}
Roof Material: ${roofMaterial || "Longspan Aluminium / Corrugated Metal"}
`;
        finalNotes = finalNotes ? `${finalNotes}\n${installationInfo}` : installationInfo;
      }

      const orderPayload = {
        items: cartDetails.map((item) => ({
          item_type: item.itemType,
          item_id: item.id,
          name: item.title,
          quantity: item.quantity,
          unit_price: item.price,
          metadata: {
            sourceType: item.sourceType,
            sourceId: item.sourceId,
          },
        })),
        shipping_address: shippingAddress,
        billing_address: resolvedBillingAddress,
        notes: finalNotes || undefined,
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        subtotal,
        shipping_amount: shippingAmount,
        tax_amount: taxAmount,
        discount_amount: totalDiscount,
        total_amount: total,
        currency: "NGN",
        installation_type: requestInstallation ? installationType.trim() || undefined : undefined,
        specifications: requestInstallation
          ? primaryPackageDetails?.installationSpecifications
          : undefined,
        create_bundle_request: primaryPackage
          ? {
              bundle_id: primaryPackage.sourceId,
              financing_requested: requestFinancing,
              financing_id_upload_id: govIdUploadId,
              financing_statement_upload_id: bankStatementUploadId,
              financing_cac_upload_id: profileType === "business" ? cacDocumentUploadId : null,
              financing_utility_bill_upload_id: utilityBillUploadId,
              financing_bvn: bvn,
              financing_nin: nin,
              financing_bvn_consent: bvnConsent,
              financing_profile_type: profileType,
            }
          : undefined,
      };

      const orderPayloadResponse = await createCustomerOrder(orderPayload);
      const orderId = getOrderId(orderPayloadResponse.data);

      if (!orderId) {
        throw new Error("The order was created, but the order id is missing from the response.");
      }

      if (requestFinancing) {
        setCheckoutStatus({
          tone: "success",
          message: "Your order and financing application have been submitted successfully! Our partners are reviewing your documents, and we will update you soon.",
        });
        if (!isPackageCheckout) {
          clearCustomerCart();
          replaceCart([]);
        }
        try {
          localStorage.removeItem("fortsolar:active_package_order");
          localStorage.removeItem("fortsolar:checkout_draft");
          localStorage.removeItem("fortsolar:applied_coupon");
        } catch (e) {}
        deleteDraftOrder().catch((err) => console.warn(err));
        setTimeout(() => {
          router.push("/settings");
        }, 4000);
        return;
      }

      const paymentPayload = await initializeCustomerOrderPayment(orderId);
      const { accessCode, amountKobo, authorizationUrl, publicKey, reference } =
        paymentPayload.data;

      if (window.PaystackPop?.setup) {
        const handler = window.PaystackPop.setup(
          buildPaystackInlineOptions({
            payment: {
              publicKey,
              amountKobo,
              reference,
              accessCode,
            },
            email: shippingAddress.email,
            onSuccess: (nextReference) => {
              try {
                localStorage.removeItem("fortsolar:active_package_order");
                localStorage.removeItem("fortsolar:checkout_draft");
                localStorage.removeItem("fortsolar:applied_coupon");
              } catch (e) {}
              deleteDraftOrder().catch((err) => console.warn(err));
              void handlePaymentVerification(nextReference, orderId);
            },
            onClose: () => {
              setCheckoutStatus({
                tone: "info",
                message: "Payment window closed before completion.",
              });
            },
          }),
        );

        handler.openIframe();
        setCheckoutStatus({
          tone: "info",
          message: "Order created. Complete payment in the secure window.",
        });
      } else {
        setCheckoutStatus({
          tone: "info",
          message: "Redirecting to complete your payment...",
        });
        localStorage.removeItem("fortsolar:checkout_draft");
        deleteDraftOrder().catch((err) => console.warn(err));
        window.location.assign(authorizationUrl);
      }
    } catch (error) {
      setCheckoutStatus({
        tone: "error",
        message: error instanceof Error ? error.message : "Unable to start checkout.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderAddressForm = (
    value: AddressFormState,
    onChange: (field: keyof AddressFormState, nextValue: string) => void,
    errorPrefix: "shipping" | "billing",
  ) => {
    const hasError = (field: keyof AddressFormState) => {
      const key = `${errorPrefix}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
      return !!validationErrors[key];
    };

    const handleInputChange = (field: keyof AddressFormState, val: string) => {
      onChange(field, val);
      const key = `${errorPrefix}${field.charAt(0).toUpperCase()}${field.slice(1)}`;
      if (validationErrors[key]) {
        setValidationErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    };

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          value={value.fullName}
          onChange={(event) => handleInputChange("fullName", event.target.value)}
          placeholder="Full name *"
          className={cn(
            "h-11 rounded-xl transition-all duration-200",
            hasError("fullName") && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
          )}
        />
        <Input
          value={value.email}
          onChange={(event) => handleInputChange("email", event.target.value)}
          placeholder="Email address *"
          className={cn(
            "h-11 rounded-xl transition-all duration-200",
            hasError("email") && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
          )}
        />
        <Input
          value={value.phone}
          onChange={(event) => handleInputChange("phone", event.target.value)}
          placeholder="Phone number *"
          className={cn(
            "h-11 rounded-xl transition-all duration-200",
            hasError("phone") && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
          )}
        />
        <NigeriaLocationFields state={value.state} city={value.city} onStateChange={(next) => handleInputChange("state", next)} onCityChange={(next) => handleInputChange("city", next)} />
        <Input
          value={value.addressLine1}
          onChange={(event) => handleInputChange("addressLine1", event.target.value)}
          placeholder="Street address *"
          className={cn(
            "h-11 rounded-xl md:col-span-2 transition-all duration-200",
            hasError("addressLine1") && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
          )}
        />
      </div>
    );
  };

  const renderDocumentUpload = (
    label: string,
    file: File | null,
    uploadId: string | null,
    isUploading: boolean,
    onFileChange: (file: File) => void,
    accept = "image/*,application/pdf",
    hasError = false,
    progress: number | null = null,
    errorMsg: string | null = null,
  ) => {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 rounded-xl border border-dashed p-4 transition-all duration-200",
          hasError || errorMsg
            ? "border-red-500 bg-red-50/30 shadow-sm"
            : "border-[#B0BABF] bg-gray-50/50",
        )}
      >
        <span className="text-xs font-semibold text-[#252C32]">{label}</span>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept={accept}
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) {
                onFileChange(selected);
                
                let key = "";
                if (label.includes("ID")) key = "uploadsGovId";
                else if (label.includes("Utility")) key = "uploadsUtilityBill";
                else if (label.includes("Statement")) key = "uploadsBankStatement";
                else if (label.includes("CAC")) key = "uploadsCac";
                if (key && validationErrors[key]) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                }
              }
            }}
            className="hidden"
            id={`file-upload-${label.replace(/[^a-zA-Z0-9]+/g, "-")}`}
          />
          <label
            htmlFor={`file-upload-${label.replace(/[^a-zA-Z0-9]+/g, "-")}`}
            className="cursor-pointer rounded-lg border border-[#B0BABF] bg-white px-3 py-2 text-xs font-semibold text-[#252C32] hover:bg-gray-50 transition"
          >
            Choose File
          </label>
          <span className="text-xs text-[#5A646B] truncate max-w-[150px]">
            {file ? file.name : "No file chosen"}
          </span>
        </div>
        
        {isUploading && (
          <div className="space-y-1 mt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#1FA21B] font-medium animate-pulse">
                {progress === 100 ? "Processing file..." : "Uploading..."}
              </span>
              <span className="text-[#1FA21B] font-bold">{progress ?? 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#1FA21B] h-1.5 rounded-full transition-all duration-200" 
                style={{ width: `${progress ?? 0}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {!isUploading && uploadId && (
          <span className="text-xs text-[#048A05] font-semibold flex items-center gap-1 mt-1">
            ✓ Upload complete
          </span>
        )}
        
        {errorMsg && (
          <span className="text-xs text-red-500 font-semibold mt-1">
            ⚠ {errorMsg}
          </span>
        )}
      </div>
    );
  };

  if (!session && !isRefreshing) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-24">
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
        onLoad={() => setIsPaystackReady(true)}
      />
      <DashboardHeader query={query} onQueryChange={setQuery} />

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="text-sm text-[#5A646B]">Store / Checkout</div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {checkoutStatus && checkoutStatus.tone !== "error" ? (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  checkoutStatus.tone === "success"
                    ? "bg-[#EAF7E8] text-[#048a05]"
                    : "bg-[#EEF5FF] text-[#1D4ED8]"
                }`}
              >
                {checkoutStatus.message}
              </div>
            ) : null}

            {missingCartItems > 0 ? (
              <div className="rounded-2xl border border-[#F7D8D8] bg-[#FFF5F5] px-4 py-3 text-sm text-[#B42318]">
                Some cart items could not be resolved from the live catalog. Refresh the catalog or remove the missing items before checkout.
              </div>
            ) : null}



            <section id="shipping-section" className="rounded-2xl border border-[#E9EEF0] p-5">
              <h1 className="text-2xl font-semibold text-[#252C32]">Shipping Address</h1>
              <p className="mt-1 text-sm text-[#5A646B]">
                Use a valid delivery address and contact details for order updates.
              </p>
              <div className="mt-5">
                {renderAddressForm(
                  shippingAddress,
                  (field, value) =>
                    setShippingAddress((current) => ({ ...current, [field]: value })),
                  "shipping",
                )}
              </div>
            </section>

            <section id="billing-section" className="rounded-2xl border border-[#E9EEF0] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[#252C32]">Billing Address</h2>
                  <p className="mt-1 text-sm text-[#5A646B]">
                    Match this to the cardholder or company billing details.
                  </p>
                </div>
                <GradientCheckbox
                  checked={useShippingAsBilling}
                  onChange={(event) => setUseShippingAsBilling(event.target.checked)}
                  label="Same as shipping"
                  labelClassName="text-sm text-[#252C32]"
                />
              </div>

              {!useShippingAsBilling ? (
                <div className="mt-5">
                  {renderAddressForm(
                    billingAddress,
                    (field, value) =>
                      setBillingAddress((current) => ({ ...current, [field]: value })),
                    "billing",
                  )}
                </div>
              ) : null}
             </section>

            {(requestInstallation || hasPackage) && (
              <section id="installation-section" className="rounded-2xl border border-[#E9EEF0] p-5">
                <h2 className="text-xl font-semibold text-[#252C32]">Installation Site Details</h2>
                <p className="mt-1 text-sm text-[#5A646B]">
                  Please specify structural details of the installation site to help our engineers plan and assign the best installation team.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={`block text-xs font-semibold mb-2 ${validationErrors.installationType ? "text-red-600" : "text-[#5A646B]"}`}>
                      Installation Type *
                    </label>
                    <ComboboxField
                      value={installationType}
                      onValueChange={setInstallationType}
                      placeholder="Select installation type"
                      options={[
                        { value: "Residential", label: "Residential" },
                        { value: "Commercial & Industrial (C&I)", label: "Commercial & Industrial (C&I)" },
                      ]}
                      className={`w-full h-11 px-3 rounded-xl border text-sm bg-white outline-none ${
                        validationErrors.installationType ? "border-red-500 ring-1 ring-red-500" : "border-[#E4E9EC]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-2 ${validationErrors.buildingType ? "text-red-600" : "text-[#5A646B]"}`}>
                      Building Type *
                    </label>
                    <ComboboxField
                      value={buildingType}
                      onValueChange={setBuildingType}
                      placeholder="Select building structure"
                      options={[
                        { value: "Bungalow", label: "Bungalow" },
                        { value: "1-Storey Building (e.g. Duplex / 2 Floors)", label: "1-Storey Building (e.g. Duplex / 2 Floors)" },
                        { value: "2-Storey Building (3 Floors)", label: "2-Storey Building (3 Floors)" },
                        { value: "3-Storey Building or Higher", label: "3-Storey Building or Higher" },
                        { value: "Warehouse / Commercial Facility", label: "Warehouse / Commercial Facility" },
                        { value: "Other", label: "Other Structure" },
                      ]}
                      className={`w-full h-11 px-3 rounded-xl border text-sm bg-white outline-none ${
                        validationErrors.buildingType ? "border-red-500 ring-1 ring-red-500" : "border-[#E4E9EC]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-2 ${validationErrors.roofStyle ? "text-red-600" : "text-[#5A646B]"}`}>
                      Roof Architecture / Style *
                    </label>
                    <ComboboxField
                      value={roofStyle}
                      onValueChange={setRoofStyle}
                      placeholder="Select roof design"
                      options={[
                        { value: "Hip Roof (Pitched / Sloped)", label: "Hip Roof (Pitched / Sloped)" },
                        { value: "Hidden Roof (Parapet / Concealed)", label: "Hidden Roof (Parapet / Concealed)" },
                        { value: "Flat Roof (Concrete Decking)", label: "Flat Roof (Concrete Decking)" },
                        { value: "Gable Roof", label: "Gable Roof" },
                        { value: "Other", label: "Other Design" },
                      ]}
                      className={`w-full h-11 px-3 rounded-xl border text-sm bg-white outline-none ${
                        validationErrors.roofStyle ? "border-red-500 ring-1 ring-red-500" : "border-[#E4E9EC]"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-2 ${validationErrors.roofMaterial ? "text-red-600" : "text-[#5A646B]"}`}>
                      Roof Material *
                    </label>
                    <ComboboxField
                      value={roofMaterial}
                      onValueChange={setRoofMaterial}
                      placeholder="Select roofing material"
                      options={[
                        { value: "Longspan Aluminium / Corrugated Metal", label: "Longspan Aluminium / Corrugated Metal" },
                        { value: "Stone-Coated Metal Tiles (Gerard)", label: "Stone-Coated Metal Tiles (Gerard)" },
                        { value: "Concrete Decking (Slab)", label: "Concrete Decking (Slab)" },
                        { value: "Clay / Ceramic Roof Tiles", label: "Clay / Ceramic Roof Tiles" },
                        { value: "Asbestos / Fibre Cement", label: "Asbestos / Fibre Cement" },
                        { value: "Other", label: "Other Material" },
                      ]}
                      className={`w-full h-11 px-3 rounded-xl border text-sm bg-white outline-none ${
                        validationErrors.roofMaterial ? "border-red-500 ring-1 ring-red-500" : "border-[#E4E9EC]"
                      }`}
                    />
                  </div>
                </div>
              </section>
            )}

            {requestFinancing && (
              <section id="financing-section" className="rounded-2xl border border-[#E9EEF0] p-5 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-[#252C32]">Financing Calculator & Application</h2>
                  <p className="mt-1 text-sm text-[#5A646B]">
                    Select your target downpayment and terms, then upload required documentation.
                  </p>
                </div>

                {financingSettings && calculatorResults && (() => {
                  const tenuresList = [3, 6, 9, 12, 15, 18, 21, 24];
                  const currentTenureIndex = tenuresList.indexOf(tenureMonths) !== -1 ? tenuresList.indexOf(tenureMonths) : 2;
                  
                  return (
                    <div className="rounded-xl border border-[#048A0530] bg-[#EBFAEB]/20 p-4 space-y-4">
                      <h3 className="font-semibold text-sm text-[#048A05]">
                        Repayment Estimator ({profileType === "individual" ? "Flat Rate APR" : "Reducing Balance"})
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-[#5A646B] mb-2">
                            Down Payment Percentage: <span className="font-bold text-[#252C32]">{downpaymentPct}%</span>
                          </label>
                          <input
                            type="range"
                            min={financingSettings.min_downpayment_pct}
                            max="80"
                            step="5"
                            value={downpaymentPct}
                            onChange={(e) => setDownpaymentPct(Number(e.target.value))}
                            className="w-full accent-[#1FA21B]"
                          />
                          <span className="text-[10px] text-[#5A646B]">Minimum: {financingSettings.min_downpayment_pct}%</span>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[#5A646B] mb-1">
                            Select tenure: <span className="font-bold text-[#252C32]">{tenureMonths} Months</span>
                          </label>
                          <div className="py-2">
                            <input
                              type="range"
                              min="0"
                              max={tenuresList.length - 1}
                              step="1"
                              value={currentTenureIndex}
                              onChange={(e) => {
                                const idx = Number(e.target.value);
                                setTenureMonths(tenuresList[idx]);
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1FA21B]"
                            />
                            <div className="flex justify-between text-[10px] text-[#5A646B] font-semibold mt-1 px-1">
                              {tenuresList.map((t) => (
                                <span
                                  key={t}
                                  className={`cursor-pointer hover:text-[#048A05] transition ${
                                    tenureMonths === t ? "text-[#048A05] font-bold" : ""
                                  }`}
                                  onClick={() => setTenureMonths(t)}
                                >
                                  {t} mo
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#048A0515] pt-3 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-[#5A646B]">Down Payment Amount:</span>
                          <p className="font-bold text-sm text-[#252C32]">{formatNaira(calculatorResults.downpaymentVal)}</p>
                        </div>
                        <div>
                          <span className="text-[#5A646B]">Amount Financed:</span>
                          <p className="font-bold text-sm text-[#252C32]">{formatNaira(calculatorResults.financedAmount)}</p>
                        </div>
                        <div>
                          <span className="text-[#5A646B]">Monthly Installment:</span>
                          <p className="font-bold text-lg text-[#048A05]">{formatNaira(calculatorResults.monthlyInstallment)} / mo</p>
                        </div>
                        <div>
                          <span className="text-[#5A646B]">Interest APR ({profileType === "individual" ? "Flat-Rate" : "Reducing Balance"}):</span>
                          <p className="font-bold text-sm text-[#252C32]">{calculatorResults.apr}% APR</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="border-t border-[#E9EEF0] pt-5">
                  <span className="block text-sm font-semibold text-[#252C32] mb-3">Applicant Profile Type</span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="profileType"
                        checked={profileType === "individual"}
                        onChange={() => setProfileType("individual")}
                        className="accent-[#1FA21B]"
                      />
                      Individual
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="profileType"
                        checked={profileType === "salary_earner"}
                        onChange={() => setProfileType("salary_earner")}
                        className="accent-[#1FA21B]"
                      />
                      Salary Earner
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="profileType"
                        checked={profileType === "business"}
                        onChange={() => setProfileType("business")}
                        className="accent-[#1FA21B]"
                      />
                      Registered Business / Corporate
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {renderDocumentUpload(
                    "Government-issued ID *",
                    govIdFile,
                    govIdUploadId,
                    isUploadingGovId,
                    (file) => handleDocumentChange(file, "govId"),
                    "image/*,application/pdf",
                    !!validationErrors.uploadsGovId,
                    govIdProgress,
                    govIdError,
                  )}
                  {renderDocumentUpload(
                    "Utility Bill *",
                    utilityBillFile,
                    utilityBillUploadId,
                    isUploadingUtilityBill,
                    (file) => handleDocumentChange(file, "utilityBill"),
                    "image/*,application/pdf",
                    !!validationErrors.uploadsUtilityBill,
                    utilityBillProgress,
                    utilityBillError,
                  )}
                  {renderDocumentUpload(
                    "6-Month Bank Statement *",
                    bankStatementFile,
                    bankStatementUploadId,
                    isUploadingBankStatement,
                    (file) => handleDocumentChange(file, "bankStatement"),
                    "image/*,application/pdf",
                    !!validationErrors.uploadsBankStatement,
                    bankStatementProgress,
                    bankStatementError,
                  )}
                  {profileType === "business" &&
                    renderDocumentUpload(
                      "CAC Registration Documents *",
                      cacDocumentFile,
                      cacDocumentUploadId,
                      isUploadingCacDocument,
                      (file) => handleDocumentChange(file, "cac"),
                      "image/*,application/pdf",
                      !!validationErrors.uploadsCac,
                      cacDocumentProgress,
                      cacDocumentError,
                    )}
                </div>

                <div className="border-t border-[#E9EEF0] pt-5 space-y-4">
                  <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5A646B] mb-2">Bank Verification Number (BVN) *</label>
                      <Input
                        type="text"
                        maxLength={11}
                        placeholder="Enter 11-digit BVN"
                        value={bvn}
                        onChange={(e) => {
                          setBvn(e.target.value.replace(/\D/g, ""));
                          if (validationErrors.bvn) {
                            setValidationErrors((prev) => {
                              const next = { ...prev };
                              delete next.bvn;
                              return next;
                            });
                          }
                        }}
                        className={cn(
                          "h-11 rounded-xl w-full transition-all duration-200",
                          validationErrors.bvn && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#5A646B] mb-2">National Identification Number (NIN) *</label>
                      <Input
                        type="text"
                        maxLength={11}
                        placeholder="Enter 11-digit NIN"
                        value={nin}
                        onChange={(e) => {
                          setNin(e.target.value.replace(/\D/g, ""));
                          if (validationErrors.nin) {
                            setValidationErrors((prev) => {
                              const next = { ...prev };
                              delete next.nin;
                              return next;
                            });
                          }
                        }}
                        className={cn(
                          "h-11 rounded-xl w-full transition-all duration-200",
                          validationErrors.nin && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
                        )}
                      />
                    </div>
                  </div>
                  </div>

                  <div
                    className={cn(
                      "p-3 rounded-xl transition-all duration-200",
                      validationErrors.bvnConsent && "bg-red-50 border border-red-200 shadow-sm",
                    )}
                  >
                    <GradientCheckbox
                      checked={bvnConsent}
                      onChange={(event) => {
                        setBvnConsent(event.target.checked);
                        if (validationErrors.bvnConsent) {
                          setValidationErrors((prev) => {
                            const next = { ...prev };
                            delete next.bvnConsent;
                            return next;
                          });
                        }
                      }}
                      label="I hereby consent to Fortsolar performing legal verification of my BVN for credit scoring purposes."
                      labelClassName="text-xs text-[#5A646B] leading-relaxed"
                      indicatorClassName={validationErrors.bvnConsent ? "border-red-500 bg-red-50" : ""}
                    />
                  </div>
                </div>
              </section>
            )}

            <section id="terms-section" className="rounded-2xl border border-[#E9EEF0] p-5">
              <h2 className="text-xl font-semibold text-[#252C32]">Order Notes</h2>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add delivery notes or payment context for this order."
                className="mt-4 min-h-28 w-full rounded-2xl border border-[#E4E9EC] px-4 py-3 text-sm outline-none"
              />

              {primaryPackage ? (
                <GradientCheckbox
                  className="mt-4"
                  checked={requestFinancing}
                  onChange={(event) => setRequestFinancing(event.target.checked)}
                  label="Request financing for this package order"
                  labelClassName="text-sm text-[#252C32]"
                />
              ) : null}

              <div className="mt-6 border-t border-[#E4E9EC] pt-4 space-y-3">
                <div
                  className={cn(
                    "p-3 rounded-xl transition-all duration-200",
                    validationErrors.legalConsent && "bg-red-50 border border-red-200 shadow-sm",
                  )}
                >
                  <GradientCheckbox
                    checked={legalConsent}
                    onChange={(event) => {
                      setLegalConsent(event.target.checked);
                      if (validationErrors.legalConsent) {
                        setValidationErrors((prev) => {
                          const next = { ...prev };
                          delete next.legalConsent;
                          return next;
                        });
                      }
                    }}
                    label="I agree to the Terms of Service, Refund Policy, and consent to the collection and secure handling of my personal and financial data."
                    labelClassName="text-xs text-[#5A646B]"
                    indicatorClassName={validationErrors.legalConsent ? "border-red-500 bg-red-50" : ""}
                  />
                </div>
                
                <p className="text-[10px] text-[#5A646B] leading-normal font-normal">
                  <strong>Refund & Verification Policy:</strong> By completing this transaction, you agree to Fortsolar's standardized return and replacement guidelines. Verification documents and financial application materials will be processed and stored securely in accordance with standard data privacy guidelines and transmitted via encrypted pathways only.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#E9EEF0] p-4">
              <p className="font-semibold text-[#252C32]">Order Summary</p>
              <div className="mt-4 space-y-4">
                {cartDetails.map((item) => (
                  <div key={`${item.itemType}-${item.id}`} className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-xl bg-cover bg-center bg-no-repeat bg-[#D9D9D9]"
                      style={{ backgroundImage: `url(${item.image})` }}
                    />
                    <div className="flex-1 text-sm">
                      <p className="text-[#252C32]">{item.title}</p>
                      <p className="font-semibold text-[#252C32]">
                        {formatNaira(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-[#252C32]">
                      {formatNaira(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 border-t border-[#E9EEF0] pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Sub Total</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5A646B]">Shipping</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(shippingAmount)}
                  </span>
                </div>
                {requestInstallation && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#5A646B]">Professional Installation</span>
                    <span className="font-semibold text-[#252C32]">
                      {installationFee === 0 ? "Free" : formatNaira(installationFee)}
                    </span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#5A646B]">Package Discount</span>
                    <span className="font-semibold text-red-600">
                      -{formatNaira(discountAmount)}
                    </span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#048A05] font-medium">Coupon ({appliedCoupon.code})</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-red-500 hover:text-red-700 font-bold"
                        title="Remove coupon"
                      >
                        ✕
                      </button>
                    </div>
                    <span className="font-semibold text-[#048A05]">
                      -{formatNaira(couponDiscount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[#E9EEF0] pt-3">
                  <span className="font-semibold text-[#252C32]">Total</span>
                  <span className="font-semibold text-[#252C32]">
                    {formatNaira(total)}
                  </span>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-[#E9EEF0] bg-gray-50/70 p-3">
                <label className="block text-xs font-semibold text-[#252C32] mb-1.5">
                  Have a Discount Code?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      if (couponError) setCouponError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleApplyCoupon();
                      }
                    }}
                    className="h-9 flex-1 rounded-lg border border-[#E4E9EC] bg-white px-2.5 text-xs uppercase font-semibold outline-none focus:border-[#1FA21B]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleApplyCoupon()}
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="h-9 rounded-lg bg-[#1FA21B] px-3 text-xs font-semibold text-white disabled:opacity-50 hover:bg-[#188015] transition"
                  >
                    {isValidatingCoupon ? "..." : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-1 text-xs text-red-500 font-medium">⚠️ {couponError}</p>
                )}
                {appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-[#EBFAEB] px-2 py-1 text-xs text-[#048A05]">
                    <span className="font-semibold">✓ {appliedCoupon.code} (-{formatNaira(couponDiscount)})</span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-red-500 hover:text-red-700 font-bold text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={isSubmitting || isVerifyingPayment || cartDetails.length === 0 || missingCartItems > 0}
                className="mt-5 w-full rounded-xl bg-[#1FA21B] py-3 text-center font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? (requestFinancing ? "Submitting application..." : "Starting payment...")
                  : isVerifyingPayment
                    ? "Verifying payment..."
                    : (requestFinancing ? "Apply for Financing" : "Proceed to Payment")}
              </button>

              {checkoutStatus && checkoutStatus.tone === "error" && (
                <div className="mt-3 rounded-xl bg-[#FDECEC] p-3 text-xs text-[#C73939] border border-[#F5C2C2] space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <span className="text-sm">⚠️</span> Checkout failed
                  </div>
                  <p>{checkoutStatus.message}</p>
                </div>
              )}

              {isPackageCheckout ? (
                <div className="mt-8 text-sm text-[#5A646B]">
                  <p className="font-semibold text-[#252C32]">
                    Free Nationwide Delivery & Installation
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#5A646B]">
                    Every complete solar package includes free nationwide delivery and certified professional installation.
                  </p>
                </div>
              ) : (
                <div className="mt-8 text-sm text-[#5A646B]">
                  <p className="mb-2">Good to know</p>
                  <p className="font-semibold text-[#252C32]">
                    Packages remain available during checkout
                  </p>
                  <p className="mt-2">
                    Need a full installation-ready setup instead of individual components?{" "}
                    <Link
                      href="/packages"
                      className="inline-flex items-center gap-1 font-medium text-[#252C32] underline"
                    >
                      Browse packages
                      <span>↗</span>
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {isQuoteModalOpen && quoteProducts.length > 0 ? (
        <GetQuoteModal
          open={isQuoteModalOpen}
          products={quoteProducts}
          onClose={() => setIsQuoteModalOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default CheckoutPage;
