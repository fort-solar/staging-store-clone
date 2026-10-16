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

  // Define financing calculator states (Standard 4% monthly flat rate)
  const [downpaymentPct, setDownpaymentPct] = useState(30);
  const [tenureMonths, setTenureMonths] = useState(12);

  // Qualification profile fields (Frictionless 3-step intake: no uploads, no BVN/NIN)
  const [profileType, setProfileType] = useState<"individual" | "salary_earner" | "business">("individual");
  const [employerOrBusinessName, setEmployerOrBusinessName] = useState("");
  const [incomeRange, setIncomeRange] = useState("₦500,000 – ₦1,000,000 / month");
  const [legalConsent, setLegalConsent] = useState(false);

  // Dedicated success screen state upon financing submission
  const [submittedFinancingInfo, setSubmittedFinancingInfo] = useState<{
    orderId: string;
    packageTitle: string;
    totalAmount: number;
    downpaymentAmount: number;
    financedAmount: number;
    tenureMonths: number;
    monthlyInstallment: number;
    profileType: "individual" | "salary_earner" | "business";
    employerOrBusinessName: string;
    incomeRange: string;
  } | null>(null);

  // Financing configuration loaded from backend
  const [financingSettings, setFinancingSettings] = useState<{
    min_downpayment_pct: number;
    base_monthly_rate_pct?: number;
    tenures: number[];
  } | null>(null);

  useEffect(() => {
    getFinancingSettings()
      .then((res) => {
        if (res?.success && res.data) {
          setFinancingSettings(res.data);
          if (res.data.min_downpayment_pct) {
            setDownpaymentPct((prev) => Math.max(prev, res.data.min_downpayment_pct));
          }
          if (res.data.tenures && res.data.tenures.length > 0) {
            setTenureMonths(res.data.tenures[res.data.tenures.length - 1] || 12);
          }
        }
      })
      .catch((err) => console.error("Error loading financing settings:", err));
  }, []);

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
      employerOrBusinessName,
      incomeRange,
      legalConsent,
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
    employerOrBusinessName,
    incomeRange,
    legalConsent,
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
    if (draft.employerOrBusinessName) setEmployerOrBusinessName((prev) => prev || draft.employerOrBusinessName);
    if (draft.incomeRange) setIncomeRange((prev) => prev || draft.incomeRange);
    if (draft.legalConsent !== undefined) setLegalConsent(draft.legalConsent);
  }, [isPackageCheckout, queryFinancing]);

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
    const downpaymentVal = Math.round((total * downpaymentPct) / 100);
    const financedAmount = Math.max(0, total - downpaymentVal);
    // Standard flat rate: 4% per month (48% p.a.)
    const monthlyRate = (financingSettings?.base_monthly_rate_pct ?? 4) / 100;
    const totalInterest = Math.round(financedAmount * monthlyRate * tenureMonths);
    const totalRepayable = financedAmount + totalInterest;
    const monthlyInstallment = tenureMonths > 0 ? Math.round(totalRepayable / tenureMonths) : 0;

    return {
      downpaymentVal,
      financedAmount,
      totalInterest,
      totalRepayable,
      monthlyInstallment,
      monthlyRatePct: financingSettings?.base_monthly_rate_pct ?? 4,
    };
  }, [total, downpaymentPct, tenureMonths, financingSettings]);

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
      if (!employerOrBusinessName.trim()) {
        errors.employerOrBusinessName = true;
      }
      if (!incomeRange.trim()) {
        errors.incomeRange = true;
      }
      if (downpaymentPct < (financingSettings?.min_downpayment_pct ?? 30)) {
        errors.downpaymentPct = true;
      }
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
        if (errors.employerOrBusinessName) {
          primaryErrorMessage = profileType === "business"
            ? "Please enter your registered business or company name."
            : "Please enter your employer or organization name.";
        } else if (errors.incomeRange) {
          primaryErrorMessage = "Please select your monthly income or turnover range.";
        } else if (errors.downpaymentPct) {
          primaryErrorMessage = `Minimum down payment is ${financingSettings?.min_downpayment_pct ?? 30}%.`;
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
      } else if (firstErrorKey === "employerOrBusinessName" || firstErrorKey === "incomeRange" || firstErrorKey === "downpaymentPct") {
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
              financing_profile_type: profileType,
              employment_or_business_name: employerOrBusinessName.trim() || undefined,
              estimated_monthly_income_range: incomeRange || undefined,
              preferred_downpayment_pct: downpaymentPct,
              preferred_tenure_months: tenureMonths,
              financing_terms: calculatorResults
                ? {
                    downpayment_amount: calculatorResults.downpaymentVal,
                    financed_principal: calculatorResults.financedAmount,
                    monthly_installment: calculatorResults.monthlyInstallment,
                    monthly_rate_pct: calculatorResults.monthlyRatePct,
                    tenure_months: tenureMonths,
                    rate_structure: "flat",
                  }
                : undefined,
            }
          : undefined,
      };

      const orderPayloadResponse = await createCustomerOrder(orderPayload);
      const orderId = getOrderId(orderPayloadResponse.data);

      if (!orderId) {
        throw new Error("The order was created, but the order id is missing from the response.");
      }

      if (requestFinancing) {
        try {
          localStorage.removeItem("fortsolar:active_package_order");
          localStorage.removeItem("fortsolar:checkout_draft");
          localStorage.removeItem("fortsolar:applied_coupon");
        } catch (e) {}
        void deleteDraftOrder().catch((err) => console.warn(err));

        if (!isPackageCheckout) {
          clearCustomerCart();
          replaceCart([]);
        }

        setSubmittedFinancingInfo({
          orderId,
          packageTitle: primaryPackage?.title || selectedPackage?.title || "Solar System Package",
          totalAmount: total,
          downpaymentAmount: calculatorResults?.downpaymentVal ?? 0,
          financedAmount: calculatorResults?.financedAmount ?? 0,
          tenureMonths,
          monthlyInstallment: calculatorResults?.monthlyInstallment ?? 0,
          profileType,
          employerOrBusinessName: employerOrBusinessName.trim(),
          incomeRange,
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
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

  if (!session && !isRefreshing) {
    return null;
  }

  if (submittedFinancingInfo) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-24">
        <DashboardHeader query={query} onQueryChange={setQuery} />

        <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
          <div className="rounded-3xl border border-[#E4E9EC] bg-white p-6 sm:p-10 shadow-sm text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EBFAEB] text-[#1FA21B]">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#252C32]">
              Financing Application Received!
            </h1>
            <p className="text-sm text-[#5A646B] max-w-lg mx-auto leading-relaxed">
              Your order <span className="font-bold text-[#252C32]">#{submittedFinancingInfo.orderId}</span> for{" "}
              <span className="font-semibold text-[#252C32]">{submittedFinancingInfo.packageTitle}</span> has been submitted to our financing partner network.
            </p>

            {/* Repayment overview card */}
            <div className="rounded-2xl border border-[#048A05]/20 bg-[#EBFAEB]/30 p-5 text-left space-y-4 my-6">
              <div className="flex items-center justify-between border-b border-[#048A05]/15 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#048A05]">
                  Proposed Payment Plan
                </span>
                <span className="text-xs font-semibold text-[#048A05] bg-[#1FA21B]/15 px-2.5 py-0.5 rounded-full">
                  Underwriting in Review
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#5A646B] block">Package Value</span>
                  <p className="font-bold text-sm text-[#252C32] mt-0.5">
                    {formatNaira(submittedFinancingInfo.totalAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-[#5A646B] block">Down Payment Due</span>
                  <p className="font-bold text-sm text-[#252C32] mt-0.5">
                    {formatNaira(submittedFinancingInfo.downpaymentAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-[#5A646B] block">Amount to Finance</span>
                  <p className="font-bold text-sm text-[#252C32] mt-0.5">
                    {formatNaira(submittedFinancingInfo.financedAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-[#5A646B] block">Tenure</span>
                  <p className="font-bold text-sm text-[#252C32] mt-0.5">
                    {submittedFinancingInfo.tenureMonths} Months
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <span className="text-[#5A646B] block">Estimated Monthly Payment</span>
                  <p className="font-black text-lg text-[#048A05] mt-0.5">
                    {formatNaira(submittedFinancingInfo.monthlyInstallment)}
                    <span className="text-xs font-normal text-[#5A646B]"> / month</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Next steps timeline */}
            <div className="text-left border-t border-[#E9EEF0] pt-6 space-y-4">
              <h3 className="font-bold text-sm text-[#252C32]">What Happens Next?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1FA21B] text-xs font-bold text-white">
                    1
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#252C32]">Partner Review & Underwriting</h4>
                    <p className="text-xs text-[#5A646B] mt-0.5 leading-relaxed">
                      Our accredited financing partner will review your qualification within 24 to 48 business hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1FA21B] text-xs font-bold text-white">
                    2
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#252C32]">Final Agreement Confirmation</h4>
                    <p className="text-xs text-[#5A646B] mt-0.5 leading-relaxed">
                      You will receive a call and email notification to verify details and accept your approved financing terms.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1FA21B] text-xs font-bold text-white">
                    3
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#252C32]">Disbursement & Priority Installation</h4>
                    <p className="text-xs text-[#5A646B] mt-0.5 leading-relaxed">
                      Once terms are accepted and your initial down payment is confirmed, your Fortsolar system is scheduled for priority dispatch and professional installation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => router.push(`/settings`)}
                className="rounded-xl bg-[#1FA21B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#188015] transition shadow-sm"
              >
                View Order in Dashboard
              </button>
              <button
                type="button"
                onClick={() => router.push(`/packages`)}
                className="rounded-xl border border-[#D0D5DD] bg-white px-6 py-3 text-sm font-semibold text-[#344054] hover:bg-gray-50 transition"
              >
                Browse Solar Packages
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1FA21B] text-xs font-bold text-white">
                  1
                </span>
                <h1 className="text-xl font-bold text-[#252C32]">Delivery Address & Contact Details</h1>
              </div>
              <p className="mt-1 text-sm text-[#5A646B] pl-8">
                Use a valid delivery address and contact details for order delivery and installation planning.
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
              <section id="financing-section" className="rounded-2xl border border-[#E9EEF0] bg-white p-6 shadow-sm space-y-6">
                <div className="border-b border-[#E9EEF0] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1FA21B] text-xs font-bold text-white">
                      2
                    </span>
                    <h2 className="text-xl font-bold text-[#252C32]">Financing & Payment Plan</h2>
                  </div>
                  <p className="mt-1 text-sm text-[#5A646B] pl-8">
                    Customize your payment plan. No BVN, NIN, or document uploads required at checkout.
                  </p>
                </div>

                {/* Sub-step A: Down Payment */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-[#252C32]">
                      Equity Down Payment
                    </label>
                    <span className="text-xs text-[#5A646B]">
                      Minimum: {financingSettings?.min_downpayment_pct ?? 30}%
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {[30, 40, 50, 60].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDownpaymentPct(pct)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border py-3 px-2 text-center transition font-semibold text-sm",
                          downpaymentPct === pct
                            ? "border-[#1FA21B] bg-[#EBFAEB] text-[#048A05] ring-2 ring-[#1FA21B]/30"
                            : "border-[#E4E9EC] bg-white text-[#5A646B] hover:border-[#B0BABF] hover:bg-gray-50",
                        )}
                      >
                        <span>{pct}%</span>
                        <span className="text-[10px] font-normal text-[#5A646B]">
                          {pct === 30 ? "Min. Equity" : `${pct}% Equity`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-step B: Tenure */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-[#252C32]">
                    Repayment Tenure
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {(financingSettings?.tenures ?? [3, 6, 9, 12]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTenureMonths(t)}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border py-3 px-2 text-center transition font-semibold text-sm",
                          tenureMonths === t
                            ? "border-[#1FA21B] bg-[#EBFAEB] text-[#048A05] ring-2 ring-[#1FA21B]/30"
                            : "border-[#E4E9EC] bg-white text-[#5A646B] hover:border-[#B0BABF] hover:bg-gray-50",
                        )}
                      >
                        <span>{t} Months</span>
                        <span className="text-[10px] font-normal text-[#5A646B]">
                          {t === 12 ? "Standard term" : "Flexible term"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Repayment Summary Card */}
                {calculatorResults && (
                  <div className="rounded-xl border border-[#048A05]/20 bg-[#EBFAEB]/30 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#048A05]">
                        Estimated Repayment Plan
                      </span>
                      <span className="rounded-full bg-[#1FA21B]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#048A05]">
                        4.0% Flat / Month
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-[#5A646B] block">Down Payment ({downpaymentPct}%):</span>
                        <p className="font-bold text-sm text-[#252C32] mt-0.5">
                          {formatNaira(calculatorResults.downpaymentVal)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#5A646B] block">Amount Financed:</span>
                        <p className="font-bold text-sm text-[#252C32] mt-0.5">
                          {formatNaira(calculatorResults.financedAmount)}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l sm:pl-4 border-[#048A05]/15 pt-2 sm:pt-0">
                        <span className="text-[#5A646B] block">Monthly Installment:</span>
                        <p className="font-black text-lg text-[#048A05] mt-0.5">
                          {formatNaira(calculatorResults.monthlyInstallment)}
                          <span className="text-xs font-normal text-[#5A646B]">/mo</span>
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] leading-relaxed text-[#5A646B] border-t border-[#048A05]/15 pt-3">
                      Estimates based on standard 4% monthly flat rate. Final financing terms, tenure, and approved rates are confirmed upon partner review.
                    </p>
                  </div>
                )}

                {/* Step 3: Qualification Profile */}
                <div className="border-t border-[#E9EEF0] pt-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1FA21B] text-xs font-bold text-white">
                      3
                    </span>
                    <h3 className="text-base font-bold text-[#252C32]">Quick Qualification Profile</h3>
                  </div>
                  <p className="text-xs text-[#5A646B] pl-8 -mt-2">
                    Help our lending partners match the best underwriting tier for your profile.
                  </p>

                  <div className="pl-8 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5A646B] mb-2">
                        Applicant Category *
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { id: "individual", label: "Individual / Self-Employed" },
                          { id: "salary_earner", label: "Salary Earner" },
                          { id: "business", label: "Registered Business" },
                        ].map((cat) => (
                          <label
                            key={cat.id}
                            onClick={() => setProfileType(cat.id as any)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer text-xs font-semibold transition",
                              profileType === cat.id
                                ? "border-[#1FA21B] bg-[#EBFAEB] text-[#048A05]"
                                : "border-[#E4E9EC] bg-white text-[#252C32] hover:bg-gray-50",
                            )}
                          >
                            <input
                              type="radio"
                              name="profileType"
                              checked={profileType === cat.id}
                              onChange={() => setProfileType(cat.id as any)}
                              className="accent-[#1FA21B]"
                            />
                            <span>{cat.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={cn(
                          "block text-xs font-semibold mb-1.5",
                          validationErrors.employerOrBusinessName ? "text-red-600" : "text-[#5A646B]",
                        )}>
                          {profileType === "business"
                            ? "Registered Business / Enterprise Name *"
                            : profileType === "salary_earner"
                            ? "Employer / Organization Name *"
                            : "Occupation / Source of Income *"}
                        </label>
                        <Input
                          type="text"
                          placeholder={
                            profileType === "business"
                              ? "e.g. Fortsolar Energy Ltd"
                              : profileType === "salary_earner"
                              ? "e.g. Chevron Nigeria / Central Bank"
                              : "e.g. Architect / Consultant / Trader"
                          }
                          value={employerOrBusinessName}
                          onChange={(e) => {
                            setEmployerOrBusinessName(e.target.value);
                            if (validationErrors.employerOrBusinessName) {
                              setValidationErrors((prev) => {
                                const next = { ...prev };
                                delete next.employerOrBusinessName;
                                return next;
                              });
                            }
                          }}
                          className={cn(
                            "h-11 rounded-xl w-full text-sm transition-all duration-200",
                            validationErrors.employerOrBusinessName && "border-red-500 bg-red-50/50 focus-visible:ring-red-500",
                          )}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#5A646B] mb-1.5">
                          {profileType === "business" ? "Monthly Turnover / Revenue *" : "Monthly Net Income *"}
                        </label>
                        <ComboboxField
                          value={incomeRange}
                          onValueChange={(val) => {
                            setIncomeRange(val);
                            if (validationErrors.incomeRange) {
                              setValidationErrors((prev) => {
                                const next = { ...prev };
                                delete next.incomeRange;
                                return next;
                              });
                            }
                          }}
                          placeholder="Select monthly income / turnover"
                          options={[
                            { value: "Under ₦500,000 / month", label: "Under ₦500,000 / month" },
                            { value: "₦500,000 – ₦1,000,000 / month", label: "₦500,000 – ₦1,000,000 / month" },
                            { value: "₦1,000,000 – ₦2,500,000 / month", label: "₦1,000,000 – ₦2,500,000 / month" },
                            { value: "₦2,500,000 – ₦5,000,000 / month", label: "₦2,500,000 – ₦5,000,000 / month" },
                            { value: "Above ₦5,000,000 / month", label: "Above ₦5,000,000 / month" },
                          ]}
                          className="w-full h-11 px-3 rounded-xl border text-sm bg-white border-[#E4E9EC] outline-none"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-800 flex items-start gap-2.5">
                      <span className="text-base leading-none">🛡️</span>
                      <p className="leading-relaxed">
                        <strong>Frictionless Application:</strong> No documents or ID uploads are needed today. After your order is placed, an underwriting specialist from our lending partner network will contact you to verify your details and issue your formal repayment agreement.
                      </p>
                    </div>
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
                    label="I agree to the Terms of Service, Privacy Policy, and Fortsolar standard installation guidelines."
                    labelClassName="text-xs text-[#5A646B]"
                    indicatorClassName={validationErrors.legalConsent ? "border-red-500 bg-red-50" : ""}
                  />
                </div>
                
                <p className="text-[10px] text-[#5A646B] leading-normal font-normal">
                  <strong>Terms & Privacy:</strong> By completing this order, you agree to Fortsolar's terms and warranty coverage. Customer details are securely handled in strict accordance with data privacy regulations.
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
